import axios from 'axios';

export const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
export default API_BASE;

export const ENDPOINTS = {
  SUB_USERS: '/sub-users',
    NOTIFICATIONS: '/notifications',
};

const API_BASE_CLEAN = (API_BASE || 'http://localhost:5000').replace(/\/$/, '');

// central axios instance for backend calls
export const apiClient = axios.create({
  baseURL: API_BASE_CLEAN,
  validateStatus: () => true,
  headers: { 'Content-Type': 'application/json' },
});

// clear auth cookies helper
const clearAuthCookies = () => {
  try {
    // expire cookies we've used
    document.cookie = `accessToken=; Path=/; Max-Age=0;`;
    document.cookie = `access_token=; Path=/; Max-Age=0;`;
    document.cookie = `idToken=; Path=/; Max-Age=0;`;
  } catch (e) { /* ignore in non-browser env */ }
};

// called when token expired — redirect to login (client-side)
const handleAuthExpired = () => {
  try {
    clearAuthCookies();
    // navigate to login route
    window.location.href = '/login';
  } catch (e) {
    // final fallback: reload
    window.location.reload();
  }
};

// Response interceptor to detect token expiry / missing token responses
apiClient.interceptors.response.use((response) => {
  // backend might return JSON { message: 'TokenExpiredError: jwt expired' } with 401/200, check both
  const msg = response?.data?.message || response?.data?.error || '';
  const status = response?.status;
  if (
    status === 401 ||
    /tokenexpirederror/i.test(msg) ||
    /jwt expired/i.test(msg) ||
    /missing token/i.test(msg)
  ) {
    // small timeout so any UI state settles before navigation
    setTimeout(handleAuthExpired, 50);
  }
  return response;
}, (error) => {
  // network/axios error - inspect server response if present
  const resp = error?.response;
  const msg = resp?.data?.message || resp?.data?.error || error?.message || '';
  const status = resp?.status;
  if (
    status === 401 ||
    /tokenexpirederror/i.test(msg) ||
    /jwt expired/i.test(msg) ||
    /missing token/i.test(msg)
  ) {
    setTimeout(handleAuthExpired, 50);
  }
  // propagate original error to callers (they can still read .response)
  return Promise.reject(error);
});


export const buildUrl = (base, params = {}) => {
  const qs = Object.entries(params)
    .filter(([,v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `${base.replace(/\/$/, '')}?${qs}` : base;
};


export const getAuthHeaders = (idToken) => {
  const readCookie = (name) => {
    try {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    } catch {
      return null;
    }
  };
  
  // prefer explicit idToken param, otherwise fallback to cookie 'idToken'
  const id = idToken || (typeof document !== 'undefined' ? readCookie('idToken') : null);
  // also read backend access token cookie
   const accessToken = (typeof document !== 'undefined') ? (readCookie('accessToken') || readCookie('access_token')) : null;

  const headers = {};
 if (accessToken) {
    headers.Authorization = `Bearer ${decodeURIComponent(accessToken)}`;
    headers['X-API-Key'] = decodeURIComponent(accessToken);
  } else if (id) {
    headers.Authorization = `Bearer ${id}`;
  }
  return headers;
};

export const getSubUsers = async (parentUid, idToken = null) => {
  const url = buildUrl(`${API_BASE.replace(/\/$/, '')}${ENDPOINTS.SUB_USERS}`, { uid: parentUid });
  const headers = getAuthHeaders(idToken);
  return apiClient.get(url, { headers});
};

/**
 * Update a sub-user via backend PATCH /sub-users?sub_user_id=<id>
 * Also include sub_user_id in the body because backend controllers typically read body
 * payload: object with fields to update (autobid_enabled, autobid_enabled_for_job_type, etc.)
 * idToken optional - will fallback to cookie if not provided
 */
export const updateSubUser = async (subUserId, payload = {}, idToken = null) => {
  if (!subUserId) throw new Error('subUserId required');
  const url = `${API_BASE.replace(/\/$/, '')}${ENDPOINTS.SUB_USERS}?sub_user_id=${encodeURIComponent(subUserId)}`;
  const body = { sub_user_id: subUserId, ...payload };
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders(idToken) };

  try {
    const res = await axios.patch(url, body, { headers, validateStatus: () => true });
    // Normalise non-2xx into thrown error to simplify callers
    if (!(res.status >= 200 && res.status < 300)) {
      const errMsg = res?.data?.message || `Failed to update sub-user: ${res.status}`;
      const err = new Error(errMsg);
      err.response = res;
      throw err;
    }
    return res;
  } catch (err) {
    // rethrow with normalized message
    const msg = err?.response?.data?.message || err.message || 'Failed to call updateSubUser';
    const error = new Error(msg);
    error.original = err;
    throw error;
  }
};


export const getNotifications = async (subUserId, idToken = null) => {
  if (!subUserId) throw new Error('subUserId required to fetch notifications');
  const url = buildUrl(`${API_BASE.replace(/\/$/, '')}${ENDPOINTS.NOTIFICATIONS}`, { sub_user_id: subUserId });
  const headers = getAuthHeaders(idToken);
  return apiClient.get(url, { headers});
};


export const postBid = async (payload = {}, idToken = null) => {
  const url = '/bid';
  const headers = {...getAuthHeaders(idToken) };
  return apiClient.post(url, payload, { headers });
};