import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG, buildQueryParams, STORAGE_KEYS } from '../utils/apiUtils';
import { useAuth } from '../contexts/AuthContext';
import { getUnixTimestamp } from '../utils/dateUtils';

export const useFreelancerAPI = ({ bidderType }) => {
  const { token, currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(false); // Cooldown state
  const [skillsCache, setSkillsCache] = useState({});

  const handleApiError = (error) => {
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      const status = error.response.status;
      const data = error.response.data;

      if (status === 400) {
        return data.message || 'Bad Request. Please check your input.';
      } else if (status === 401) {
        return 'Unauthorized. Please log in again.';
      } else if (status === 403) {
        return 'Forbidden. You do not have permission to perform this action.';
      } else if (status === 404) {
        return 'Resource not found. Please try again.';
      } else if (status === 429) {
        return 'Too many requests. Please wait and try again later.';
      } else if (status >= 500) {
        return 'Server error. Please try again later.';
      } else {
        return data.message || 'An unexpected error occurred. Please try again.';
      }
    } else if (error.request) {
      // No response received from the server
      return 'Network error. Please check your internet connection.';
    } else {
      // Error occurred while setting up the request
      return error.message || 'An unexpected error occurred.';
    }
  };

  const getUserInfo = useCallback(async () => {
    try {
      const response = await axios.get('https://www.freelancer.com/api/users/0.1/self', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data?.result?.id || null;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('Error fetching user info:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [token]);

  const getUserSkills = async (userId) => {
    if (skillsCache[userId]) {
      console.log(`Using cached skills for user ${userId}`);
      return skillsCache[userId];
    }

    try {
      const response = await axios.get(
        `https://www.freelancer.com/ajax-api/skills/top-skills.php?limit=9999&userId=${userId}&compact=true`
      );
      console.log(response);
      const skills = response.data?.result?.topSkills?.map((skill) => skill.id) || [];
      console.log(skills)
      setSkillsCache((prevCache) => ({ ...prevCache, [userId]: skills }));
      return skills;
    } catch (err) {
      console.error('Error fetching user skills:', err);
      throw new Error('Failed to fetch user skills');
    }
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getProjectsBySkills = useCallback(async (skillIds) => {
    if (!skillIds || skillIds.length === 0) {
      console.warn('No skills found for the user. Returning an empty project list.');
      return [];
    }

    const from_time = getUnixTimestamp(300)

    try {
      const params = {
        ...API_CONFIG.DEFAULT_PARAMS,
        'jobs[]': skillIds,
        from_time,
        full_description: true,
        user_details: true, // Include user details
        user_responsiveness: true, // Include user responsiveness
        user_portfolio_details: true, // Include user portfolio details
        user_reputation: true, // Include user reputation
        'languages[]': 'en'

      };
      const queryString = buildQueryParams(params);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACTIVE_PROJECTS}?${queryString}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data?.result?.projects || [];
    } catch (err) {
      console.error('Error fetching projects by skills:', err);
      throw new Error('Failed to fetch projects by skills');
    }
  }, [token]);
  // Track last fetch time (ms epoch)
  const [lastFetchTime, setLastFetchTime] = useState(
    (() => {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
      return saved ? parseInt(saved, 10) : null;
    })()
  );

  const loadProjectsFromStorage = useCallback(() => {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        setProjects(parsedProjects);
        const savedFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
        if (savedFetch) setLastFetchTime(parseInt(savedFetch, 10));
        return parsedProjects;
      }
    } catch (error) {
      console.error('Error loading projects from storage:', error);
    }
    return [];
  }, []);

  const fetchRecentProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = await getUserInfo();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const skillIds = await getUserSkills(userId);
      let projects = await getProjectsBySkills(skillIds); // Change `const` to `let`

      // Filter projects based on the conditions
      projects = projects.filter((project) => {
        const { currency, budget, location, NDA } = project;

        // Exclude projects with country = "India"
        if (location?.country.name === 'India') {
          return false;
        }

        // Exclude projects with currency = "INR"
        if (currency?.code === 'INR') {
          return false;
        }

        // Exclude projects with hourly rate minimum <= 5
        if (budget?.minimum && budget.minimum <= 5) {
          return false;
        }

        // Exclude projects with NDA = true
        if (NDA === true) {
          console.log(`Project ${project.id} is an NDA project. Skipping.`);
          return false;
        }

        return true;
      });

      setProjects(projects);
      console.log(`Fetched ${projects.length} projects for user ${currentUser}`);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to fetch recent projects:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getUserInfo, getUserSkills, getProjectsBySkills]);

  const autoPlaceBids = useCallback(async () => {
    if (cooldown) {
      console.log('Cooldown active. Skipping auto-bid.');
      return;
    }

    const nowUnix = Math.floor(Date.now() / 1000);
    const recentProjects = projects.filter((project) => {
      if (!project.submitdate) {
        console.log(`Project ${project.id} has no submit date. Skipping.`);
        return false;
      }

      const isRecent = nowUnix - project.submitdate <= 60; // Projects less than 1 minute old
      if (!isRecent) {
        console.log(`Project ${project.id} is not recent. Skipping.`);
      }
      return isRecent;
    });

    console.log(`Recent projects for auto-bid:`, recentProjects);

    if (recentProjects.length === 0) {
      console.log('No recent projects to bid on.');
      return;
    }

    console.log(`Found ${recentProjects.length} recent projects. Starting auto-bid...`);

    try {
      const bidderId = await getUserInfo();

      for (const project of recentProjects) {
        try {
          const bidAmount = calculateBidAmount(project);

          // Skip projects that do not meet the criteria
          if (bidAmount === null) {
            console.log(`Skipping project ${project.id} due to bid criteria.`);
            continue;
          }

          console.log(`Generating proposal for project ${project.id}...`);
          const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/generate-proposal`, {
            id: project.id,
            title: project.title,
            description: project.description || 'No description available',
          });

          if (!response.data || !response.data.proposal) {
            console.error(`Failed to generate proposal for project ${project.id}. Response:`, response.data);
            continue;
          }

          const proposal = response.data.proposal;
          console.log(`Proposal generated for project ${project.id}:`, proposal);

          console.log(`Placing bid for project ${project.id} with amount ${bidAmount}...`);
          const bidResponse = await axios.post(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACE_BID}`,
            {
              project_id: project.id,
              bidder_id: bidderId,
              amount: bidAmount,
              period: 5,
              description: proposal,
              milestone_percentage: 100,
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          console.log(`Bid placed successfully for project ${project.id}`);

          // Save bid history
          await saveBidHistory({ ...bidResponse.data, bidderType });

          // Add a 30-second delay before placing the next bid
          console.log(`Waiting 20 seconds before placing the next bid...`);
          await delay(30000); // 30-second delay
        } catch (err) {
          const errorMessage = handleApiError(err);
          console.error(`Error processing project ${project.id}:`, err);
        }
      }

      setCooldown(true);
      setTimeout(() => {
        setCooldown(false);
        console.log('Cooldown ended. Auto-bid is now active.');
      }, 5 * 60 * 1000); // 2-minute cooldown
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('Error fetching bidder_id or placing bids:', err);
    }
  }, [projects, token, cooldown, getUserInfo]);



  const calculateBidAmount = (project) => {
    const { type, budget } = project;

    if (!budget || !budget.minimum || !budget.maximum) {
      console.log(`Project ${project.id} has an invalid budget.`);
      return null;
    }

    const minBudget = budget.minimum;
    const maxBudget = budget.maximum;

    console.log(`Calculating bid amount for project ${project.id}:`, { type, minBudget, maxBudget });

    if (type === 'hourly') {
      // Hourly Projects
      if (minBudget > 10) {
        console.log(`Project ${project.id} is hourly with rate > $10/hour. Bidding minimum: ${minBudget}`);
        return minBudget; // Bid the minimum amount for rates > $10/hour
      } else {
        console.log(`Project ${project.id} is hourly with rate ≤ $10/hour. Bidding maximum: ${maxBudget}`);
        return maxBudget; // Bid the maximum amount for rates ≤ $10/hour
      }
    } else if (type === 'fixed') {
      // Fixed-Price Projects
      if (minBudget >= 200 && maxBudget <= 900) {
        console.log(`Project ${project.id} is fixed-price with budget between $200 and $500. Bidding maximum: ${maxBudget}`);
        return maxBudget; // Bid the maximum amount for budgets between $200 and $500
      } else if (maxBudget > 1000) {
        console.log(`Project ${project.id} is fixed-price with budget > $1,000. Bidding minimum: ${minBudget}`);
        return minBudget; // Bid the minimum amount for budgets > $1,000
      } else if (maxBudget < 200) {
        console.log(`Project ${project.id} is fixed-price with budget < $200. Skipping.`);
        return null; // Skip projects with budgets < $200
      }
    }

    console.log(`Project ${project.id} does not meet any criteria. Skipping.`);
    return null; // Skip projects that do not meet any criteria
  };

  const saveBidHistory = async ({projectId, amount, period, description, bidderType}) => {
    const bidderId = await getUserInfo();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/save-bid-history`, {
        project_id: projectId,
        bidder_id: bidderId,
        amount,
        period,
        description,
        bidder_type: bidderType,
      });

      console.log(`Bid history saved for project ${projectId}:`, response.data);
    } catch (err) {
      console.error(`Failed to save bid history for project ${projectId}:`, err);
    }
  };

  return {
    projects,
    loading,
    error,
    fetchRecentProjects,
    loadProjectsFromStorage,
    autoPlaceBids,
    calculateBidAmount,

  };
};
