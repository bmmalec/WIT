/**
 * WIT Application - Main Entry Point
 * Vue 3 application with routing and state management
 */

import store from './store.js';
import router from './router.js';
import { auth } from './api.js';

// Import pages
import RegisterPage from './pages/RegisterPage.js';
import LoginPage from './pages/LoginPage.js';
import DashboardPage from './pages/DashboardPage.js';
import ProfilePage from './pages/ProfilePage.js';
import EditProfilePage from './pages/EditProfilePage.js';
import ChangePasswordPage from './pages/ChangePasswordPage.js';
import SettingsPage from './pages/SettingsPage.js';

const { createApp, ref, onMounted, watch } = Vue;

// Theme utilities
const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const currentTheme = store.state.user?.settings?.theme;
  if (currentTheme === 'system' || !currentTheme) {
    applyTheme('system');
  }
});

// Define routes
const routes = [
  {
    path: '/',
    component: {
      template: `
        <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <h1 class="text-4xl font-bold text-blue-600 mb-2">WIT</h1>
          <p class="text-gray-600 mb-8">Where Is It? - Smart Inventory Management</p>
          <div class="flex gap-4">
            <a href="/login" @click.prevent="router.push('/login')" class="btn-primary">Sign In</a>
            <a href="/register" @click.prevent="router.push('/register')" class="btn-secondary">Create Account</a>
          </div>
        </div>
      `,
    },
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    component: RegisterPage,
    meta: { guestOnly: true },
  },
  {
    path: '/login',
    component: LoginPage,
    meta: { guestOnly: true },
  },
  {
    path: '/dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/edit',
    component: EditProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/password',
    component: ChangePasswordPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    component: SettingsPage,
    meta: { requiresAuth: true },
  },
  {
    path: '*',
    component: {
      template: `
        <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <p class="text-gray-600 mb-8">Page not found</p>
          <a href="/" @click.prevent="router.push('/')" class="btn-primary">Go Home</a>
        </div>
      `,
    },
  },
];

// Register routes
router.registerRoutes(routes);

// Auth guard
router.setAuthGuard((to, from) => {
  const isAuthenticated = store.state.isAuthenticated;

  if (to.meta?.requiresAuth && !isAuthenticated) {
    // Redirect to login if not authenticated
    return '/login';
  }

  if (to.meta?.guestOnly && isAuthenticated) {
    // Redirect to dashboard if already authenticated
    return '/dashboard';
  }

  return true;
});

// Main App Component
const App = {
  setup() {
    const isLoading = ref(true);

    // Check authentication on mount
    onMounted(async () => {
      try {
        const response = await auth.me();
        store.setUser(response.data.user);

        // Apply user's theme preference
        const userTheme = response.data.user?.settings?.theme || 'system';
        applyTheme(userTheme);
      } catch (error) {
        // Not authenticated, that's fine
        store.clearUser();
        // Apply system theme for unauthenticated users
        applyTheme('system');
      } finally {
        isLoading.value = false;
        store.setLoading(false);

        // Navigate to current path after auth check
        const path = window.location.pathname + window.location.search;
        router.navigate(path, { replace: true });
      }
    });

    return {
      isLoading,
      currentComponent: router.currentComponent,
      notifications: store.state.notifications,
      removeNotification: store.removeNotification,
    };
  },

  template: `
    <!-- Loading Screen -->
    <div v-if="isLoading" class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- Main App -->
    <div v-else>
      <!-- Notifications -->
      <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'notification',
            notification.type === 'success' ? 'notification-success' : '',
            notification.type === 'error' ? 'notification-error' : '',
            notification.type === 'info' ? 'notification-info' : ''
          ]"
        >
          <span>{{ notification.message }}</span>
          <button @click="removeNotification(notification.id)" class="ml-4 text-sm opacity-75 hover:opacity-100">
            &times;
          </button>
        </div>
      </div>

      <!-- Router View -->
      <component :is="currentComponent" />
    </div>
  `,
};

// Create and mount app
const app = createApp(App);

// Make router available to components
app.config.globalProperties.$router = router;
app.config.globalProperties.$store = store;

// Mount the app
app.mount('#app');

// Expose app globally for debugging
window.app = app;

// Expose theme utilities
window.applyTheme = applyTheme;
