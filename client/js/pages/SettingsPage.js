/**
 * SettingsPage Component
 * Page for configuring user settings (theme, default view, notifications, expiration periods)
 */

import {
  PERIOD_CONFIGS,
  DEFAULT_COLORS,
  generatePeriodSchedule,
  getCurrentPeriod,
  formatDateRange,
} from '../utils/expirationPeriods.js';

const { ref, reactive, computed, onMounted, watch } = Vue;

export default {
  name: 'SettingsPage',

  setup() {
    const loading = ref(true);
    const saving = ref(false);
    const savingNotifications = ref(false);
    const sendingTestEmail = ref(false);
    const error = ref(null);
    const successMessage = ref('');

    // Settings form
    const settings = reactive({
      theme: 'system',
      defaultView: 'grid',
      notifications: {
        enabled: true,
        email: {
          enabled: true,
          expiration: true,
          lowStock: true,
          frequency: 'daily',
          expirationDaysAhead: 7,
          digestHour: 8,
        },
        inApp: {
          enabled: true,
          expiration: true,
          lowStock: true,
          shoppingList: true,
        },
      },
      expirationPeriod: {
        periodType: 'quarterly',
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        colorScheme: [...DEFAULT_COLORS],
        usePatterns: false,
      },
    });

    // Period type options
    const periodTypes = Object.entries(PERIOD_CONFIGS).map(([value, config]) => ({
      value,
      label: config.label,
    }));

    // Original settings for comparison
    const originalSettings = ref(null);

    // Computed: Current period info
    const currentPeriod = computed(() => {
      return getCurrentPeriod(
        new Date(settings.expirationPeriod.startDate),
        settings.expirationPeriod.periodType,
        settings.expirationPeriod.colorScheme
      );
    });

    // Computed: Period schedule preview
    const periodSchedule = computed(() => {
      return generatePeriodSchedule(
        new Date(settings.expirationPeriod.startDate),
        settings.expirationPeriod.periodType,
        settings.expirationPeriod.colorScheme,
        8 // Show 8 periods
      );
    });

    // Check if settings have changed
    const hasChanges = computed(() => {
      if (!originalSettings.value) return false;
      return (
        settings.theme !== originalSettings.value.theme ||
        settings.defaultView !== originalSettings.value.defaultView ||
        JSON.stringify(settings.notifications) !== JSON.stringify(originalSettings.value.notifications) ||
        settings.expirationPeriod.periodType !== originalSettings.value.expirationPeriod?.periodType ||
        settings.expirationPeriod.startDate !== originalSettings.value.expirationPeriod?.startDate ||
        settings.expirationPeriod.usePatterns !== originalSettings.value.expirationPeriod?.usePatterns ||
        JSON.stringify(settings.expirationPeriod.colorScheme) !== JSON.stringify(originalSettings.value.expirationPeriod?.colorScheme)
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

        // Load notification settings
        const notifSettings = user.settings?.notifications;
        if (notifSettings && typeof notifSettings === 'object') {
          settings.notifications.enabled = notifSettings.enabled !== false;
          if (notifSettings.email) {
            settings.notifications.email.enabled = notifSettings.email.enabled !== false;
            settings.notifications.email.expiration = notifSettings.email.expiration !== false;
            settings.notifications.email.lowStock = notifSettings.email.lowStock !== false;
            settings.notifications.email.frequency = notifSettings.email.frequency || 'daily';
            settings.notifications.email.expirationDaysAhead = notifSettings.email.expirationDaysAhead || 7;
            settings.notifications.email.digestHour = notifSettings.email.digestHour ?? 8;
          }
          if (notifSettings.inApp) {
            settings.notifications.inApp.enabled = notifSettings.inApp.enabled !== false;
            settings.notifications.inApp.expiration = notifSettings.inApp.expiration !== false;
            settings.notifications.inApp.lowStock = notifSettings.inApp.lowStock !== false;
            settings.notifications.inApp.shoppingList = notifSettings.inApp.shoppingList !== false;
          }
        } else {
          // Legacy boolean format - convert to new structure
          settings.notifications.enabled = notifSettings !== false;
        }

        // Load expiration period settings
        const expSettings = user.settings?.expirationPeriod;
        if (expSettings) {
          settings.expirationPeriod.periodType = expSettings.periodType || 'quarterly';
          settings.expirationPeriod.startDate = expSettings.startDate
            ? new Date(expSettings.startDate).toISOString().split('T')[0]
            : new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
          settings.expirationPeriod.colorScheme = expSettings.colorScheme?.length === 6
            ? [...expSettings.colorScheme]
            : [...DEFAULT_COLORS];
          settings.expirationPeriod.usePatterns = expSettings.usePatterns || false;
        }

        originalSettings.value = JSON.parse(JSON.stringify(settings));

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
          expirationPeriod: {
            periodType: settings.expirationPeriod.periodType,
            startDate: new Date(settings.expirationPeriod.startDate),
            colorScheme: settings.expirationPeriod.colorScheme,
            usePatterns: settings.expirationPeriod.usePatterns,
          },
        });

        // Update store
        if (window.store) {
          window.store.setUser(response.data.user);
        }

        originalSettings.value = JSON.parse(JSON.stringify(settings));
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
        settings.notifications = JSON.parse(JSON.stringify(originalSettings.value.notifications));
        settings.expirationPeriod.periodType = originalSettings.value.expirationPeriod?.periodType || 'quarterly';
        settings.expirationPeriod.startDate = originalSettings.value.expirationPeriod?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        settings.expirationPeriod.colorScheme = originalSettings.value.expirationPeriod?.colorScheme ? [...originalSettings.value.expirationPeriod.colorScheme] : [...DEFAULT_COLORS];
        settings.expirationPeriod.usePatterns = originalSettings.value.expirationPeriod?.usePatterns || false;
      }
    };

    // Save notification settings separately
    const saveNotificationSettings = async () => {
      savingNotifications.value = true;
      error.value = null;

      try {
        await window.api.notifications.updateSettings(settings.notifications);
        successMessage.value = 'Notification settings saved';
        setTimeout(() => { successMessage.value = ''; }, 3000);
      } catch (err) {
        console.error('Failed to save notification settings:', err);
        error.value = err.message || 'Failed to save notification settings';
      } finally {
        savingNotifications.value = false;
      }
    };

    // Send test email
    const sendTestEmail = async () => {
      sendingTestEmail.value = true;
      error.value = null;

      try {
        await window.api.notifications.sendTestEmail();
        successMessage.value = 'Test email sent! Check your inbox.';
        setTimeout(() => { successMessage.value = ''; }, 5000);
      } catch (err) {
        console.error('Failed to send test email:', err);
        error.value = err.message || 'Failed to send test email';
      } finally {
        sendingTestEmail.value = false;
      }
    };

    // Update a color in the scheme
    const updateColor = (index, color) => {
      settings.expirationPeriod.colorScheme[index].color = color;
    };

    // Update a color name
    const updateColorName = (index, name) => {
      settings.expirationPeriod.colorScheme[index].name = name;
    };

    // Reset colors to default
    const resetColors = () => {
      settings.expirationPeriod.colorScheme = [...DEFAULT_COLORS];
    };

    // Go back
    const handleBack = () => {
      window.router?.push('/profile');
    };

    onMounted(fetchSettings);

    return {
      loading,
      saving,
      savingNotifications,
      sendingTestEmail,
      error,
      successMessage,
      settings,
      hasChanges,
      periodTypes,
      currentPeriod,
      periodSchedule,
      formatDateRange,
      handleSave,
      handleReset,
      handleBack,
      fetchSettings,
      updateColor,
      updateColorName,
      resetColors,
      saveNotificationSettings,
      sendTestEmail,
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
              <p class="text-sm text-gray-500 dark:text-gray-400">Manage alerts for expiring items and low stock</p>
            </div>

            <div class="px-6 py-4 space-y-6">
              <!-- Master Toggle -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Enable all notifications</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Master toggle for all notification types</p>
                </div>
                <button
                  type="button"
                  @click="settings.notifications.enabled = !settings.notifications.enabled"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    settings.notifications.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      settings.notifications.enabled ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  />
                </button>
              </div>

              <!-- Email Notifications -->
              <div v-if="settings.notifications.enabled" class="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Email Notifications
                </h4>

                <div class="space-y-4">
                  <!-- Email Enable -->
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Enable email notifications</span>
                    <button
                      type="button"
                      @click="settings.notifications.email.enabled = !settings.notifications.email.enabled"
                      :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        settings.notifications.email.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      ]"
                    >
                      <span :class="['pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.notifications.email.enabled ? 'translate-x-5' : 'translate-x-0']"/>
                    </button>
                  </div>

                  <div v-if="settings.notifications.email.enabled" class="ml-4 space-y-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <!-- Expiration Alerts -->
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Expiration alerts</span>
                      <button
                        type="button"
                        @click="settings.notifications.email.expiration = !settings.notifications.email.expiration"
                        :class="[
                          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                          settings.notifications.email.expiration ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        ]"
                      >
                        <span :class="['pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.notifications.email.expiration ? 'translate-x-4' : 'translate-x-0']"/>
                      </button>
                    </div>

                    <!-- Low Stock Alerts -->
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Low stock alerts</span>
                      <button
                        type="button"
                        @click="settings.notifications.email.lowStock = !settings.notifications.email.lowStock"
                        :class="[
                          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                          settings.notifications.email.lowStock ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        ]"
                      >
                        <span :class="['pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.notifications.email.lowStock ? 'translate-x-4' : 'translate-x-0']"/>
                      </button>
                    </div>

                    <!-- Frequency -->
                    <div>
                      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Frequency</label>
                      <select v-model="settings.notifications.email.frequency" class="input w-full max-w-xs text-sm">
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily digest</option>
                        <option value="weekly">Weekly digest</option>
                      </select>
                    </div>

                    <!-- Days Ahead -->
                    <div>
                      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Alert days before expiration</label>
                      <input
                        type="number"
                        v-model.number="settings.notifications.email.expirationDaysAhead"
                        min="1"
                        max="30"
                        class="input w-20 text-sm"
                      />
                      <span class="text-sm text-gray-500 ml-2">days</span>
                    </div>

                    <!-- Digest Hour -->
                    <div v-if="settings.notifications.email.frequency !== 'immediate'">
                      <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Send digest at</label>
                      <select v-model.number="settings.notifications.email.digestHour" class="input w-32 text-sm">
                        <option v-for="h in 24" :key="h-1" :value="h-1">
                          {{ (h-1).toString().padStart(2, '0') }}:00
                        </option>
                      </select>
                    </div>

                    <!-- Test Email Button -->
                    <button
                      type="button"
                      @click="sendTestEmail"
                      :disabled="sendingTestEmail"
                      class="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <svg v-if="sendingTestEmail" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ sendingTestEmail ? 'Sending...' : 'Send test email' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- In-App Notifications -->
              <div v-if="settings.notifications.enabled" class="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  In-App Notifications
                </h4>

                <div class="space-y-4">
                  <!-- In-App Enable -->
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Enable in-app notifications</span>
                    <button
                      type="button"
                      @click="settings.notifications.inApp.enabled = !settings.notifications.inApp.enabled"
                      :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        settings.notifications.inApp.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      ]"
                    >
                      <span :class="['pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.notifications.inApp.enabled ? 'translate-x-5' : 'translate-x-0']"/>
                    </button>
                  </div>

                  <div v-if="settings.notifications.inApp.enabled" class="ml-4 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Expiration alerts</span>
                      <button
                        type="button"
                        @click="settings.notifications.inApp.expiration = !settings.notifications.inApp.expiration"
                        :class="['relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out', settings.notifications.inApp.expiration ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700']"
                      >
                        <span :class="['pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.notifications.inApp.expiration ? 'translate-x-4' : 'translate-x-0']"/>
                      </button>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Low stock alerts</span>
                      <button
                        type="button"
                        @click="settings.notifications.inApp.lowStock = !settings.notifications.inApp.lowStock"
                        :class="['relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out', settings.notifications.inApp.lowStock ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700']"
                      >
                        <span :class="['pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.notifications.inApp.lowStock ? 'translate-x-4' : 'translate-x-0']"/>
                      </button>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Shopping list reminders</span>
                      <button
                        type="button"
                        @click="settings.notifications.inApp.shoppingList = !settings.notifications.inApp.shoppingList"
                        :class="['relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out', settings.notifications.inApp.shoppingList ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700']"
                      >
                        <span :class="['pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.notifications.inApp.shoppingList ? 'translate-x-4' : 'translate-x-0']"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Expiration Period Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">Expiration Tracking</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Configure color-coded expiration periods for perishable items</p>
            </div>

            <div class="px-6 py-4 space-y-6">
              <!-- Current Period Display -->
              <div class="p-4 rounded-lg border-2" :style="{ borderColor: currentPeriod.color, backgroundColor: currentPeriod.color + '10' }">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" :style="{ backgroundColor: currentPeriod.color }">
                    {{ currentPeriod.colorName.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Current Period</p>
                    <p class="font-semibold text-gray-900 dark:text-white">{{ currentPeriod.label }} - {{ currentPeriod.colorName }}</p>
                  </div>
                </div>
              </div>

              <!-- Period Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period Type
                </label>
                <select v-model="settings.expirationPeriod.periodType" class="input w-full">
                  <option v-for="type in periodTypes" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  How often expiration periods rotate
                </p>
              </div>

              <!-- Start Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  v-model="settings.expirationPeriod.startDate"
                  class="input w-full max-w-xs"
                />
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  When the first period begins (typically start of year)
                </p>
              </div>

              <!-- Color Scheme -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color Scheme (6 colors)
                  </label>
                  <button type="button" @click="resetColors" class="text-sm text-blue-600 hover:text-blue-700">
                    Reset to defaults
                  </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div v-for="(colorItem, index) in settings.expirationPeriod.colorScheme" :key="index" class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="color"
                      :value="colorItem.color"
                      @input="updateColor(index, $event.target.value)"
                      class="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      :value="colorItem.name"
                      @input="updateColorName(index, $event.target.value)"
                      class="flex-1 text-sm border-0 bg-transparent focus:ring-0 p-0 text-gray-900 dark:text-white"
                      :placeholder="'Color ' + (index + 1)"
                    />
                  </div>
                </div>
              </div>

              <!-- Use Patterns Toggle -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Color-blind patterns</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Add patterns to distinguish colors</p>
                </div>
                <button
                  type="button"
                  @click="settings.expirationPeriod.usePatterns = !settings.expirationPeriod.usePatterns"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    settings.expirationPeriod.usePatterns ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      settings.expirationPeriod.usePatterns ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  />
                </button>
              </div>

              <!-- Period Schedule Preview -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period Schedule Preview
                </label>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Period</th>
                        <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Date Range</th>
                        <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Color</th>
                        <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="period in periodSchedule"
                        :key="period.index"
                        :class="[
                          'border-b border-gray-100 dark:border-gray-800',
                          period.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        ]"
                      >
                        <td class="py-2 px-3 text-gray-900 dark:text-white">{{ period.label }}</td>
                        <td class="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">{{ formatDateRange(period.start, period.end) }}</td>
                        <td class="py-2 px-3">
                          <div class="flex items-center gap-2">
                            <span class="w-4 h-4 rounded" :style="{ backgroundColor: period.color }"></span>
                            <span class="text-gray-700 dark:text-gray-300">{{ period.colorName }}</span>
                          </div>
                        </td>
                        <td class="py-2 px-3">
                          <span
                            :class="[
                              'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                              period.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              period.status === 'current' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            ]"
                          >
                            {{ period.status === 'expired' ? 'Expired' : period.status === 'current' ? 'Current' : 'Future' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
