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

  /**
   * Request password reset
   * @param {Object} data - { email }
   */
  forgotPassword(data) {
    return API.post('/auth/forgot-password', data);
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {Object} data - { password }
   */
  resetPassword(token, data) {
    return API.post(`/auth/reset-password/${token}`, data);
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

// Items API
const items = {
  /**
   * Create a new item
   * @param {Object} data - Item data
   */
  create(data) {
    return API.post('/items', data);
  },

  /**
   * Get item by ID
   * @param {string} id - Item ID
   */
  get(id) {
    return API.get(`/items/${id}`);
  },

  /**
   * Get items for a location
   * @param {string} locationId - Location ID
   * @param {Object} params - Query params (categoryId, itemType, limit, skip)
   */
  getByLocation(locationId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/locations/${locationId}/items${queryString ? `?${queryString}` : ''}`;
    return API.get(url);
  },

  /**
   * Search items
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.limit - Max results
   * @param {string} options.locationId - Filter by location
   * @param {string} options.categoryId - Filter by category
   * @param {string} options.expirationStatus - Filter by expiration ('expired', 'expiring', 'fresh', 'perishable')
   * @param {string} options.storageType - Filter by storage ('pantry', 'refrigerated', 'frozen')
   */
  search(query, options = {}) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.limit) params.append('limit', options.limit);
    if (options.locationId) params.append('locationId', options.locationId);
    if (options.categoryId) params.append('categoryId', options.categoryId);
    if (options.expirationStatus) params.append('expirationStatus', options.expirationStatus);
    if (options.storageType) params.append('storageType', options.storageType);
    return API.get(`/items/search?${params.toString()}`);
  },

  /**
   * Get autocomplete suggestions
   * @param {string} query - Partial search query (min 2 chars)
   * @param {Object} options - Options
   * @param {number} options.limit - Max suggestions (default 10)
   */
  autocomplete(query, options = {}) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.limit) params.append('limit', options.limit);
    return API.get(`/items/autocomplete?${params.toString()}`);
  },

  /**
   * Get recent searches for current user
   */
  getRecentSearches() {
    return API.get('/items/recent-searches');
  },

  /**
   * Clear recent search history
   */
  clearRecentSearches() {
    return API.delete('/items/recent-searches');
  },

  /**
   * Update an item
   * @param {string} id - Item ID
   * @param {Object} data - Updated fields
   */
  update(id, data) {
    return API.put(`/items/${id}`, data);
  },

  /**
   * Delete an item
   * @param {string} id - Item ID
   */
  delete(id) {
    return API.delete(`/items/${id}`);
  },

  /**
   * Move item to a new location
   * @param {string} id - Item ID
   * @param {string} locationId - New location ID
   */
  move(id, locationId) {
    return API.put(`/items/${id}/move`, { locationId });
  },

  /**
   * Adjust item quantity
   * @param {string} id - Item ID
   * @param {number} adjustment - Amount to adjust (positive or negative)
   */
  adjustQuantity(id, adjustment) {
    return API.put(`/items/${id}/quantity`, { adjustment });
  },

  /**
   * Get low stock items
   */
  getLowStock() {
    return API.get('/items/low-stock');
  },

  /**
   * Get items by expiration status
   * @param {Object} options - Filter options
   * @param {string} options.status - 'expired', 'current', 'expiring-soon', 'future', 'all'
   * @param {number} options.periodIndex - Specific period index to filter by
   * @param {number} options.currentPeriodIndex - Current period index for status calculation
   */
  getByExpirationStatus(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.periodIndex !== undefined) params.append('periodIndex', options.periodIndex);
    if (options.currentPeriodIndex !== undefined) params.append('currentPeriodIndex', options.currentPeriodIndex);
    const queryString = params.toString();
    return API.get(`/items/expiring${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Mark item as consumed
   * @param {string} id - Item ID
   */
  consume(id) {
    return API.put(`/items/${id}/consume`);
  },

  /**
   * Mark item as discarded
   * @param {string} id - Item ID
   */
  discard(id) {
    return API.put(`/items/${id}/discard`);
  },

  /**
   * Upload images for an item
   * @param {string} id - Item ID
   * @param {FileList|File[]} files - Files to upload
   */
  async uploadImages(id, files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    const response = await fetch(`${API.baseUrl}/items/${id}/images`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'Failed to upload images',
        data.error?.code || 'UPLOAD_ERROR',
        data.error?.details || null
      );
    }

    return data;
  },

  /**
   * Delete an image from an item
   * @param {string} id - Item ID
   * @param {number} imageIndex - Index of image to delete
   */
  deleteImage(id, imageIndex) {
    return API.delete(`/items/${id}/images/${imageIndex}`);
  },

  /**
   * Set primary image for an item
   * @param {string} id - Item ID
   * @param {number} imageIndex - Index of image to set as primary
   */
  setPrimaryImage(id, imageIndex) {
    return API.put(`/items/${id}/images/${imageIndex}/primary`);
  },

  /**
   * Reorder images for an item
   * @param {string} id - Item ID
   * @param {number[]} order - New order of image indices
   */
  reorderImages(id, order) {
    return API.put(`/items/${id}/images/reorder`, { order });
  },
};

// Categories API
const categories = {
  /**
   * Get all categories (tree structure)
   */
  getAll() {
    return API.get('/categories');
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

  /**
   * Leave a shared location (remove own access)
   * @param {string} shareId - Share ID
   */
  leave(shareId) {
    return API.post(`/shares/${shareId}/leave`);
  },
};

// Identify API (AI-powered identification)
const identify = {
  /**
   * Identify item from image using AI
   * @param {string} image - Base64 encoded image or data URL
   * @param {string} mediaType - Image MIME type
   */
  image(image, mediaType = 'image/jpeg') {
    return API.post('/identify/image', { image, mediaType });
  },

  /**
   * Get quick description of item from image
   * @param {string} image - Base64 encoded image or data URL
   * @param {string} mediaType - Image MIME type
   */
  describe(image, mediaType = 'image/jpeg') {
    return API.post('/identify/describe', { image, mediaType });
  },

  /**
   * Lookup product by UPC/barcode
   * @param {string} code - UPC/EAN barcode
   */
  upc(code) {
    return API.post('/identify/upc', { code });
  },
};

// Bulk Sessions API
const bulkSessions = {
  /**
   * Start a new bulk import session
   * @param {Object} data - { targetLocationId, defaultCategoryId?, name? }
   */
  start(data) {
    return API.post('/bulk-sessions', data);
  },

  /**
   * Get current active session
   */
  getActive() {
    return API.get('/bulk-sessions/active');
  },

  /**
   * Get session by ID
   * @param {string} id - Session ID
   */
  get(id) {
    return API.get(`/bulk-sessions/${id}`);
  },

  /**
   * Get session history
   * @param {Object} params - { limit?, skip? }
   */
  getHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return API.get(`/bulk-sessions${query ? `?${query}` : ''}`);
  },

  /**
   * Change target location
   * @param {string} id - Session ID
   * @param {string} locationId - New target location ID
   */
  changeTargetLocation(id, locationId) {
    return API.put(`/bulk-sessions/${id}/target-location`, { locationId });
  },

  /**
   * Add pending item to session
   * @param {string} id - Session ID
   * @param {Object} itemData - Item data
   */
  addItem(id, itemData) {
    return API.post(`/bulk-sessions/${id}/items`, itemData);
  },

  /**
   * Update pending item
   * @param {string} id - Session ID
   * @param {string} tempId - Temp ID of item
   * @param {Object} updates - Updates to apply
   */
  updateItem(id, tempId, updates) {
    return API.put(`/bulk-sessions/${id}/items/${tempId}`, updates);
  },

  /**
   * Remove pending item (reject)
   * @param {string} id - Session ID
   * @param {string} tempId - Temp ID of item
   */
  removeItem(id, tempId) {
    return API.delete(`/bulk-sessions/${id}/items/${tempId}`);
  },

  /**
   * Commit session (save all items to inventory)
   * @param {string} id - Session ID
   */
  commit(id) {
    return API.post(`/bulk-sessions/${id}/commit`);
  },

  /**
   * Cancel session
   * @param {string} id - Session ID
   */
  cancel(id) {
    return API.post(`/bulk-sessions/${id}/cancel`);
  },
};

// Export for ES modules
export { API, ApiError, auth, locations, items, categories, shares, identify, bulkSessions };

// Also expose globally for non-module scripts
window.API = API;
window.ApiError = ApiError;
window.api = { auth, locations, items, categories, shares, identify, bulkSessions };
