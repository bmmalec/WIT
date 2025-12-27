/**
 * Simple reactive store for WIT Application
 * Uses Vue 3 reactivity
 */

const { reactive, readonly } = Vue;

// Create the store state
const state = reactive({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  theme: 'system',
  notifications: [],
});

// Store actions
const actions = {
  /**
   * Set the current user
   * @param {Object|null} user
   */
  setUser(user) {
    state.user = user;
    state.isAuthenticated = !!user;
    if (user?.settings?.theme) {
      state.theme = user.settings.theme;
      actions.applyTheme(user.settings.theme);
    }
  },

  /**
   * Clear user data (logout)
   */
  clearUser() {
    state.user = null;
    state.isAuthenticated = false;
  },

  /**
   * Set loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    state.isLoading = loading;
  },

  /**
   * Apply theme to document
   * @param {string} theme - 'light', 'dark', or 'system'
   */
  applyTheme(theme) {
    state.theme = theme;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  /**
   * Add a notification
   * @param {Object} notification - { type, message, duration? }
   */
  addNotification(notification) {
    const id = Date.now();
    const duration = notification.duration || 5000;

    state.notifications.push({ ...notification, id });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        actions.removeNotification(id);
      }, duration);
    }

    return id;
  },

  /**
   * Remove a notification by ID
   * @param {number} id
   */
  removeNotification(id) {
    const index = state.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      state.notifications.splice(index, 1);
    }
  },

  /**
   * Show success notification
   * @param {string} message
   */
  success(message) {
    return actions.addNotification({ type: 'success', message });
  },

  /**
   * Show error notification
   * @param {string} message
   */
  error(message) {
    return actions.addNotification({ type: 'error', message, duration: 8000 });
  },

  /**
   * Show info notification
   * @param {string} message
   */
  info(message) {
    return actions.addNotification({ type: 'info', message });
  },
};

// Export store
const store = {
  state: readonly(state),
  ...actions,
};

// Expose globally
window.store = store;

export default store;
