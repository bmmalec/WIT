/**
 * API Client for WIT Application
 * Handles all HTTP requests to the backend
 */

class ApiError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

const API = {
  baseUrl: '/api',

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
      ...options,
    };

    // Convert body to JSON if it's an object
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error?.message || 'An error occurred',
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.details || null
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network or other fetch errors
      throw new ApiError(
        error.message || 'Network error',
        'NETWORK_ERROR'
      );
    }
  },

  // Convenience methods
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'DELETE' });
  },
};

// Auth API
const auth = {
  /**
   * Register a new user
   * @param {Object} data - { email, password, name }
   */
  register(data) {
    return API.post('/auth/register', data);
  },

  /**
   * Login user
   * @param {Object} data - { email, password }
   */
  login(data) {
    return API.post('/auth/login', data);
  },

  /**
   * Logout current user
   */
  logout() {
    return API.post('/auth/logout');
  },

  /**
   * Get current user
   */
  me() {
    return API.get('/auth/me');
  },

  /**
   * Update profile
   * @param {Object} data - { name?, avatar? }
   */
  updateProfile(data) {
    return API.put('/auth/me', data);
  },

  /**
   * Change password
   * @param {Object} data - { currentPassword, newPassword }
   */
  changePassword(data) {
    return API.put('/auth/me/password', data);
  },

  /**
   * Update settings
   * @param {Object} data - { theme?, defaultView?, notifications? }
   */
  updateSettings(data) {
    return API.put('/auth/me/settings', data);
  },
};

// Locations API (placeholder for future)
const locations = {
  list() {
    return API.get('/locations');
  },

  tree() {
    return API.get('/locations/tree');
  },

  get(id) {
    return API.get(`/locations/${id}`);
  },

  getBreadcrumb(id) {
    return API.get(`/locations/${id}/breadcrumb`);
  },

  create(data) {
    return API.post('/locations', data);
  },

  update(id, data) {
    return API.put(`/locations/${id}`, data);
  },

  delete(id, options = {}) {
    const params = {};
    if (options.cascade) params.cascade = 'true';
    return API.delete(`/locations/${id}`, params);
  },
};

// Items API (placeholder for future)
const items = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return API.get(`/items${query ? `?${query}` : ''}`);
  },

  get(id) {
    return API.get(`/items/${id}`);
  },

  create(data) {
    return API.post('/items', data);
  },

  update(id, data) {
    return API.put(`/items/${id}`, data);
  },

  delete(id) {
    return API.delete(`/items/${id}`);
  },
};

// Shares API
const shares = {
  /**
   * Invite a user to access a location
   * @param {string} locationId - Location to share
   * @param {Object} data - { email, permission, inheritToChildren? }
   */
  invite(locationId, data) {
    return API.post(`/locations/${locationId}/share`, data);
  },

  /**
   * Get all shares for a location
   * @param {string} locationId - Location ID
   */
  getLocationShares(locationId) {
    return API.get(`/locations/${locationId}/shares`);
  },

  /**
   * Get locations shared with current user
   */
  getMyShares() {
    return API.get('/shares');
  },

  /**
   * Get pending invitations for current user
   */
  getPendingInvites() {
    return API.get('/shares/pending');
  },

  /**
   * Accept an invitation
   * @param {string} token - Invite token
   */
  acceptInvite(token) {
    return API.post(`/shares/accept/${token}`);
  },

  /**
   * Decline an invitation
   * @param {string} token - Invite token
   */
  declineInvite(token) {
    return API.post(`/shares/decline/${token}`);
  },

  /**
   * Update share permission
   * @param {string} shareId - Share ID
   * @param {string} permission - New permission level
   */
  updatePermission(shareId, permission) {
    return API.put(`/shares/${shareId}`, { permission });
  },

  /**
   * Revoke a share
   * @param {string} shareId - Share ID
   */
  revoke(shareId) {
    return API.delete(`/shares/${shareId}`);
  },
};

// Export for ES modules
export { API, ApiError, auth, locations, items, shares };

// Also expose globally for non-module scripts
window.API = API;
window.ApiError = ApiError;
window.api = { auth, locations, items, shares };
