import axios from 'axios';

export const API_BASE = process.env.REACT_APP_API_BASE_URL;
export default API_BASE;

export const ENDPOINTS = {
  SUB_USERS: '/sub-users',
    NOTIFICATIONS: '/notifications',
};

const API_BASE_CLEAN = (API_BASE);

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
  const params = {};
  if (parentUid !== undefined && parentUid !== null && String(parentUid).trim() !== '') {
    params.parent_uid = String(parentUid);
  }

  const headers = getAuthHeaders(idToken);

  // debug URL for easier inspection in network / console
  try {
    const debugUrl = buildUrl(`${API_BASE_CLEAN}${ENDPOINTS.SUB_USERS}`, params);
    // eslint-disable-next-line no-console
    console.debug('[api.getSubUsers] url:', debugUrl, 'headers:', headers);
  } catch (e) { /* ignore */ }

  try {
    const res = await apiClient.get(ENDPOINTS.SUB_USERS, { headers, params, validateStatus: () => true });
    // surface server body on errors for easier debugging
    if (res.status >= 400) {
      // eslint-disable-next-line no-console
      console.error('[api.getSubUsers] server error', res.status, res.data);
    }
    return res;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api.getSubUsers] network error', err?.response?.data || err.message || err);
    throw err;
  }
};

// export const getSubUsers = async (parentUid, idToken = null) => {
//  const params = {};
//   if (parentUid) params.parent_uid = String(parentUid);
//   const headers = getAuthHeaders(idToken);
//   // use apiClient.get with params so axios constructs URL correctly
//   return apiClient.get(ENDPOINTS.SUB_USERS, { headers, params, validateStatus: () => true });

// };

/**
 * Update a sub-user via backend PATCH /sub-users?sub_user_id=<id>
 * Also include sub_user_id in the body because backend controllers typically read body
 * payload: object with fields to update (autobid_enabled, autobid_enabled_for_job_type, etc.)
 * idToken optional - will fallback to cookie if not provided
 */
export const deleteSubUser = async (subUserId, parentUid = null, idToken = null) => {
  if (!subUserId) throw new Error('subUserId required');

  const params = { sub_user_id: String(subUserId) };
  // only include parent_uid when explicitly provided (avoid 'undefined' or '')
  if (parentUid !== undefined && parentUid !== null && String(parentUid).trim() !== '') {
    params.parent_uid = String(parentUid);
  }

  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders(idToken) };

  // debug: show the final request URL and params
  try {
    // eslint-disable-next-line no-console
    console.debug('[api.deleteSubUser] params:', params);
  } catch (e) {}

  try {
    const res = await apiClient.delete(ENDPOINTS.SUB_USERS, { headers, params, validateStatus: () => true });
    if (!(res.status >= 200 && res.status < 300)) {
      const errMsg = res?.data?.message || `Failed to delete sub-user: ${res.status}`;
      const err = new Error(errMsg);
      err.response = res;
      throw err;
    }
    return res;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to call deleteSubUser';
    const error = new Error(msg);
    error.original = err;
    throw error;
  }
};
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

export const markNotificationRead = async (subUserId, notificationId, is_read = true, idToken = null) => {
  if (!subUserId) throw new Error('subUserId required to mark notification');
  if (!notificationId) throw new Error('notificationId required to mark notification');
  const base = `${API_BASE.replace(/\/$/, '')}${ENDPOINTS.NOTIFICATIONS}/mark-read`;
  const url = buildUrl(base, { sub_user_id: subUserId, is_read: String(is_read), notification_id: notificationId });
  const headers = getAuthHeaders(idToken);
  return apiClient.post(url, {}, { headers });
};


export const postBid = async (payload = {}, idToken = null) => {
  const url = '/bid';
  const headers = {...getAuthHeaders(idToken) };
  return apiClient.post(url, payload, { headers });
};

export const getNotificationDetails = async (subUserId, notificationId, idToken = null) => {
  if (!subUserId) throw new Error('subUserId required');
  if (!notificationId) throw new Error('notificationId required');

  const params = {
    sub_user_id: String(subUserId),
    notification_id: String(notificationId),
  };

  const headers = getAuthHeaders(idToken);

  try {
    const res = await apiClient.get(`${ENDPOINTS.NOTIFICATIONS}/details`, { headers, params, validateStatus: () => true });
    if (res.status >= 400) {
      const msg = res?.data?.message || `Failed to fetch notification details: ${res.status}`;
      const err = new Error(msg);
      err.response = res;
      throw err;
    }
    return res;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Network error';
    const error = new Error(msg);
    error.original = err;
    throw error;
  }
};