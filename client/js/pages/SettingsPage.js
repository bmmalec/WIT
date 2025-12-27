/**
 * SettingsPage Component
 * Page for configuring user settings (theme, default view, notifications)
 */

const { ref, reactive, computed, onMounted, watch } = Vue;

export default {
  name: 'SettingsPage',

  setup() {
    const loading = ref(true);
    const saving = ref(false);
    const error = ref(null);
    const successMessage = ref('');

    // Settings form
    const settings = reactive({
      theme: 'system',
      defaultView: 'grid',
      notifications: true,
    });

    // Original settings for comparison
    const originalSettings = ref(null);

    // Check if settings have changed
    const hasChanges = computed(() => {
      if (!originalSettings.value) return false;
      return (
        settings.theme !== originalSettings.value.theme ||
        settings.defaultView !== originalSettings.value.defaultView ||
        settings.notifications !== originalSettings.value.notifications
      );
    });

    // Fetch current settings
    const fetchSettings = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.auth.me();
        const user = response.data.user;

        settings.theme = user.settings?.theme || 'system';
        settings.defaultView = user.settings?.defaultView || 'grid';
        settings.notifications = user.settings?.notifications !== false;

        originalSettings.value = { ...settings };

        // Apply current theme
        if (window.applyTheme) {
          window.applyTheme(settings.theme);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        error.value = err.message || 'Failed to load settings';

        if (err.code === 'UNAUTHORIZED' || err.code === 'TOKEN_EXPIRED') {
          window.store?.clearUser();
          window.router?.push('/login');
        }
      } finally {
        loading.value = false;
      }
    };

    // Watch for theme changes and apply immediately
    watch(() => settings.theme, (newTheme) => {
      if (window.applyTheme) {
        window.applyTheme(newTheme);
      }
    });

    // Save settings
    const handleSave = async () => {
      saving.value = true;
      error.value = null;
      successMessage.value = '';

      try {
        const response = await window.api.auth.updateSettings({
          theme: settings.theme,
          defaultView: settings.defaultView,
          notifications: settings.notifications,
        });

        // Update store
        if (window.store) {
          window.store.setUser(response.data.user);
        }

        originalSettings.value = { ...settings };
        successMessage.value = 'Settings saved successfully';

        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } catch (err) {
        console.error('Failed to save settings:', err);
        error.value = err.message || 'Failed to save settings';
      } finally {
        saving.value = false;
      }
    };

    // Reset to original settings
    const handleReset = () => {
      if (originalSettings.value) {
        settings.theme = originalSettings.value.theme;
        settings.defaultView = originalSettings.value.defaultView;
        settings.notifications = originalSettings.value.notifications;
      }
    };

    // Go back
    const handleBack = () => {
      window.router?.push('/profile');
    };

    onMounted(fetchSettings);

    return {
      loading,
      saving,
      error,
      successMessage,
      settings,
      hasChanges,
      handleSave,
      handleReset,
      handleBack,
      fetchSettings,
    };
  },

  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center py-4">
            <button
              @click="handleBack"
              class="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error && !settings" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p class="text-red-700 dark:text-red-400 mb-4">{{ error }}</p>
          <button @click="fetchSettings" class="btn-primary">
            Try Again
          </button>
        </div>

        <!-- Settings Content -->
        <div v-else class="space-y-6">
          <!-- Success Message -->
          <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ successMessage }}
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {{ error }}
          </div>

          <!-- Appearance Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Customize how WIT looks on your device</p>
            </div>

            <div class="px-6 py-4 space-y-6">
              <!-- Theme Selector -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme
                </label>
                <div class="grid grid-cols-3 gap-3">
                  <!-- Light Theme -->
                  <button
                    type="button"
                    @click="settings.theme = 'light'"
                    :class="[
                      'relative p-4 rounded-lg border-2 transition-all',
                      settings.theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    ]"
                  >
                    <div class="flex flex-col items-center">
                      <svg class="w-8 h-8 text-yellow-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
                      </svg>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                    </div>
                    <div v-if="settings.theme === 'light'" class="absolute top-2 right-2">
                      <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </button>

                  <!-- Dark Theme -->
                  <button
                    type="button"
                    @click="settings.theme = 'dark'"
                    :class="[
                      'relative p-4 rounded-lg border-2 transition-all',
                      settings.theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    ]"
                  >
                    <div class="flex flex-col items-center">
                      <svg class="w-8 h-8 text-indigo-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                    </div>
                    <div v-if="settings.theme === 'dark'" class="absolute top-2 right-2">
                      <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </button>

                  <!-- System Theme -->
                  <button
                    type="button"
                    @click="settings.theme = 'system'"
                    :class="[
                      'relative p-4 rounded-lg border-2 transition-all',
                      settings.theme === 'system'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    ]"
                  >
                    <div class="flex flex-col items-center">
                      <svg class="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">System</span>
                    </div>
                    <div v-if="settings.theme === 'system'" class="absolute top-2 right-2">
                      <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Default View -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Default View
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <!-- Grid View -->
                  <button
                    type="button"
                    @click="settings.defaultView = 'grid'"
                    :class="[
                      'relative p-4 rounded-lg border-2 transition-all',
                      settings.defaultView === 'grid'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    ]"
                  >
                    <div class="flex flex-col items-center">
                      <svg class="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                      </svg>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Grid</span>
                    </div>
                    <div v-if="settings.defaultView === 'grid'" class="absolute top-2 right-2">
                      <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </button>

                  <!-- List View -->
                  <button
                    type="button"
                    @click="settings.defaultView = 'list'"
                    :class="[
                      'relative p-4 rounded-lg border-2 transition-all',
                      settings.defaultView === 'list'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    ]"
                  >
                    <div class="flex flex-col items-center">
                      <svg class="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                      </svg>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">List</span>
                    </div>
                    <div v-if="settings.defaultView === 'list'" class="absolute top-2 right-2">
                      <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </button>
                </div>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Choose how items and locations are displayed by default
                </p>
              </div>
            </div>
          </div>

          <!-- Notifications Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Manage your notification preferences</p>
            </div>

            <div class="px-6 py-4">
              <!-- Enable Notifications Toggle -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Enable notifications</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Receive updates about shared locations and items</p>
                </div>
                <button
                  type="button"
                  @click="settings.notifications = !settings.notifications"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    settings.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      settings.notifications ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              type="button"
              @click="handleReset"
              :disabled="saving || !hasChanges"
              :class="[
                'flex-1 btn-secondary',
                (!hasChanges || saving) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              Reset
            </button>
            <button
              type="button"
              @click="handleSave"
              :disabled="saving || !hasChanges"
              :class="[
                'flex-1 btn-primary flex justify-center items-center',
                (!hasChanges || saving) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span v-if="saving" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
};
