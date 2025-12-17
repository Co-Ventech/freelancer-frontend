import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUsersStore } from '../store/useUsersStore';
import { API_CONFIG, buildQueryParams, STORAGE_KEYS } from '../utils/apiUtils';
import { useAuth } from '../contexts/AuthContext';
import { getUnixTimestamp } from '../utils/dateUtils';
import { API_BASE, getAuthHeaders } from '../utils/api';

// move stable helpers to module scope so hook deps remain simple
const EXCLUDED_COUNTRIES = [
  'pakistan', 'india', 'bangladesh', 'indonesia', 'algeria', 'nigeria', 'egypt', 'nepal', 'israel'
];
const normalize = (s) => (s || '').toString().trim().toLowerCase();
const isLocalProject = (proj) => {
  if (!proj) return false;
  const v = proj.local;
  return v === true || v === 'true' || String(v).toLowerCase() === 'true';
};
const isExcludedCountry = (countryName) => {
  if (!countryName) return false;
  const n = normalize(countryName);
  return EXCLUDED_COUNTRIES.some((c) => n.includes(c) || c.includes(n));
};
const getOwnerCountry = (project, usersMap = {}) => {
  const ownerId = project.owner_id ?? project.owner?.id ?? project.user_id ?? null;
  let owner;
  if (ownerId != null) {
    owner = usersMap[ownerId] || usersMap[String(ownerId)] || usersMap[Number(ownerId)];
  }
  owner = owner || project.owner || project.user || project.users?.[Object.keys(project.users || {})[0]];
  const country =
    owner?.location?.country?.name ||
    owner?.profile?.location?.country?.name ||
    project.location?.country?.name ||
    '';
  return country;
};
const controlCharRegex = new RegExp("[^\\u0000-\\u007F]");


export const useFreelancerAPI = () => {
  const selectedKey = useUsersStore((s) => s.selectedKey);

  const [projects, setProjects] = useState([]);
  const [usersMapState, setUsersMapState] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [skillsCache, setSkillsCache] = useState({});

  const skillsCacheRef = useRef({});
  const isFetchingRef = useRef(false);
  const cooldownUntilRef = useRef(0); // timestamp (ms) until which we should back off on rate-limit




  const handleApiError = (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      if (status === 400) return data.message || 'Bad Request. Please check your input.';
      if (status === 401) return 'Unauthorized. Please log in again.';
      if (status === 403) return 'Forbidden. You do not have permission to perform this action.';
      if (status === 404) return 'Resource not found. Please try again.';
      if (status === 429) return 'Too many requests. Please wait and try again later.';
      if (status >= 500) return 'Server error. Please try again later.';
      return data.message || 'An unexpected error occurred. Please try again.';
    } else if (error.request) {
      return 'Network error. Please check your internet connection.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  };
  const getUserInfo = useCallback(async () => {
    const waitForSelection = async (timeoutMs = 5000, pollMs = 200) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const state = useUsersStore.getState();
        const selected = state.getSelectedUser?.() || null;
        const users = state.users || [];
        if (selected || users.length > 0) return { selected: selected || users[0], users };
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, pollMs));
      }
      const state = useUsersStore.getState();
      return { selected: state.getSelectedUser?.() || null, users: state.users || [] };
    };

    const { selected: selectedFromStore } = await waitForSelection(5000, 200);
    const selected = selectedFromStore;
    if (!selected) throw new Error('No sub-user selected. Please select an account in the User Switcher.');

    // Ensure selectedKey is set if we auto-picked
    try {
      const key = selected.sub_username || selected.document_id || String(selected.id);
      const currentKey = useUsersStore.getState().selectedKey;
      if (key && currentKey !== key) useUsersStore.getState().selectUser(key);
    } catch { /* non-fatal */ }

    // Prefer backend-provided bidder id
    if (selected?.user_bid_id) return Number(selected.user_bid_id);

    // If backend did not provide bidder id, upstream should handle bidding — fail fast
    throw new Error('Selected sub-user does not include a bidder id (user_bid_id). Backend must provide bidder id for bidding.');
  }, []);
  // memoized user-skills fetch (uses ref cache to keep stable identity)
  const getUserSkills = useCallback(async (userId) => {
    if (!userId) {
      throw new Error('userId required to fetch skills');
    }
    if (skillsCacheRef.current[userId]) {
      return skillsCacheRef.current[userId];
    }
    try {
      const response = await axios.get(
        `https://www.freelancer.com/ajax-api/skills/top-skills.php?limit=9999&userId=${userId}&compact=true`
      );
      const skills = response.data?.result?.topSkills?.map((skill) => skill.id) || [];
      skillsCacheRef.current = { ...skillsCacheRef.current, [userId]: skills };
      return skills;
    } catch (err) {
      console.error('Error fetching user skills:', err);
      throw new Error('Failed to fetch user skills');
    }
  }, []);

  const getProjectsBySkills = useCallback(async (skillIds) => {
    if (!skillIds || skillIds.length === 0) {
      return { projects: [], users: {} };
    }
    const from_time = getUnixTimestamp(300);
    try {
      const params = {
        ...API_CONFIG.DEFAULT_PARAMS,
        'jobs[]': skillIds,
        from_time,
        full_description: true,
        user_details: true,
        user_responsiveness: true,
        user_portfolio_details: true,
        user_reputation: true,
        user_employer_reputation: true,
        status: true,
        'languages[]': 'en'
      };
      const queryString = buildQueryParams(params);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACTIVE_PROJECTS}?${queryString}`;
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      });
      const resProjects = response.data?.result?.projects || [];
      const resUsers = response.data?.result?.users || {};
      return { projects: resProjects, users: resUsers };
    } catch (err) {
      console.error('Error fetching projects by skills:', err);
      throw new Error('Failed to fetch projects by skills');
    }
  }, []);

  const lastFetchTimeRef = useRef(null);


  const loadProjectsFromStorage = useCallback(() => {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const filtered = (Array.isArray(parsedProjects) ? parsedProjects : []).filter((proj) => {
          const country = getOwnerCountry(proj);
          if (isExcludedCountry(country)) return false;
          if (isLocalProject(proj)) return false;
          return true;
        });
        setProjects(filtered);
        const savedFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
       if (savedFetch) lastFetchTimeRef.current = parseInt(savedFetch, 10);
        return filtered;
      }
    } catch (error) {
      console.error('Error loading projects from storage:', error);
    }
    return [];
  }, []);

  const fetchRecentProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    // if we are currently in a cooldown period (rate-limited), skip and exit early
    if (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current) {
      const waitSecs = Math.ceil((cooldownUntilRef.current - Date.now()) / 1000);
      console.warn(`In cooldown due to previous rate-limit. Next fetch in ${waitSecs}s`);
      setLoading(false);
      return;
    }

    // guard against concurrent fetches
    if (isFetchingRef.current) {
      console.warn('fetchRecentProjects: fetch already in progress, skipping overlapping call');
      setLoading(false);
      return;
    }
    isFetchingRef.current = true;

    try {
      const userId = await getUserInfo();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const skillIds = await getUserSkills(userId);
      const result = await getProjectsBySkills(skillIds);
      let projects = result.projects || [];
      const usersMap = result.users || {};

      projects = projects.filter((project) => {
        const { currency, budget, NDA, title } = project;
        const ownerCountry = getOwnerCountry(project, usersMap);
    if (isExcludedCountry(ownerCountry)) return false;
        if (isLocalProject(project)) return false;
    if (controlCharRegex.test(title)) return false;
        if ((currency?.code || '').toUpperCase() === 'INR') return false;
        if (budget?.minimum && Number(budget.minimum) <= 5) return false;
        if (NDA === true || project.upgrades?.NDA === true) return false;
        const upgrades = project.upgrades || {};
        if (NDA === true || upgrades.NDA === true || upgrades.nonpublic === true || upgrades.sealed === true) return false;
        return true;
      });

      setUsersMapState(usersMap);
      setProjects(projects);
      try { localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)); } catch (e) { /* ignore */ }

    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to fetch recent projects:', err);
      // if rate-limited, back off for 5 minutes
      if ((err?.response?.status === 429) || /(Too many requests|RATE_LIMITED|rate limit)/i.test(errorMessage)) {
        cooldownUntilRef.current = Date.now() + 5 * 60 * 1000; // 5 minutes
        console.warn('Rate-limited by API. Activating 5 minute cooldown.');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
   }, [getUserInfo, getUserSkills, getProjectsBySkills]);


  useEffect(() => {
    let intervalId = null;
    let scheduledTimeout = null;

    if (!selectedKey) {
      setProjects([]);
      setUsersMapState({});
      return;
    }
     

    const runFetchOrSchedule = () => {
      // if currently in cooldown, schedule a single retry when cooldown ends
      if (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current) {
        const waitMs = cooldownUntilRef.current - Date.now() + 1000;
        console.warn(`Cooldown active. Scheduling next fetch in ${Math.ceil(waitMs / 10000)}s`);
        scheduledTimeout = setTimeout(() => {
          fetchRecentProjects().catch((e) => console.warn('Scheduled fetch failed:', e.message));
        }, waitMs);
        return;
      }

      // immediate fetch
      fetchRecentProjects().catch((e) => console.warn('fetchRecentProjects failed:', e.message));

      // periodic fetch every 60 seconds
      intervalId = setInterval(() => {
        // if cooldown became active, clear interval and let scheduledTimeout handle next try
        if (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current) {
          clearInterval(intervalId);
          intervalId = null;
          runFetchOrSchedule();
          return;
        }
        fetchRecentProjects().catch((e) => console.warn('Periodic fetch failed:', e.message));
      }, 60 * 1000);
    };

    runFetchOrSchedule();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (scheduledTimeout) clearTimeout(scheduledTimeout);
    };
  }, [selectedKey, fetchRecentProjects]);



  const calculateBidAmount = (project) => {
    const { type, budget } = project;
    if (!budget || !budget.minimum || !budget.maximum) {
      return null;
    }
    const minBudget = budget.minimum;
    const maxBudget = budget.maximum;
    if (type === 'hourly') {
      return minBudget > 10 ? minBudget : maxBudget;
    } else if (type === 'fixed') {
      if (minBudget >= 30) return minBudget;
      return null;
    }
  };

  // Manual place bid uses selectedUser credentials (already implemented earlier)
  const placeBidManual = useCallback(async ({ projectId, amount, period = 5, description = '', userKey = null, projectMeta = null }) => {
    const getSelected = useUsersStore.getState().getSelectedUser;
    const selected = userKey ? useUsersStore.getState().users.find(u => u.sub_username === userKey || String(u.id) === String(userKey)) : getSelected();
    if (!selected) throw new Error('No sub-user selected. Please select an account in the User Switcher.');

    // backend should provide user_bid_id and sub_user identifier (e.g. "sub_0")
    const bidVia = selected.sub_user || selected.subUser || selected.sub_user_key || selected.sub_username;
    const bidderId = selected.user_bid_id || selected.bidder_id || selected.bidderId;
    if (!bidVia || !bidderId) throw new Error('Selected sub-user missing bid_via or bidder id.');
    const payload = {
      bid_via: bidVia,
      projectId: Number(projectId),
      seo_url: projectMeta?.seo_url || null,
      projectType: projectMeta?.type || projectMeta?.projectType || null,
      bidderId: Number(bidderId),
      bidAmount: Number(amount),
      proposal: description || selected.general_proposal || '',
      bidderName: selected.sub_username || selected.name || '',
      projectTitle: projectMeta?.title || null,
      projectDescription: projectMeta?.description || null,
      budget: projectMeta?.budget || null,
    };

    const url = `${process.env.REACT_APP_API_BASE_URL || API_BASE}/bid`;
    const headers = getAuthHeaders(); // will prefer backend accessToken cookie
    const res = await axios.post(url, payload, { headers, validateStatus: () => true });
    if (!(res.status >= 200 && res.status < 300)) {
      const msg = res?.data?.message || `Failed to place bid: ${res.status}`;
      return { success: false, message: msg, data: res.data };
    }
    return { success: true, data: res.data };
  }, []);

  return {
    projects,
    loading,
    error,
    fetchRecentProjects,
    loadProjectsFromStorage,
    calculateBidAmount,
    usersMap: usersMapState,
    placeBidManual,
  };
};
