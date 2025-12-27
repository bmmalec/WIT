/**
 * ProfilePage Component
 * Displays user profile information
 */

const { ref, computed, onMounted } = Vue;

export default {
  name: 'ProfilePage',

  setup() {
    const loading = ref(true);
    const error = ref(null);
    const user = ref(null);

    // Fetch user profile
    const fetchProfile = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.auth.me();
        user.value = response.data.user;

        // Update store
        if (window.store) {
          window.store.setUser(response.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        error.value = err.message || 'Failed to load profile';

        // If unauthorized, redirect to login
        if (err.code === 'UNAUTHORIZED' || err.code === 'TOKEN_EXPIRED') {
          window.store?.clearUser();
          window.router?.push('/login');
        }
      } finally {
        loading.value = false;
      }
    };

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Get initials for avatar placeholder
    const initials = computed(() => {
      if (!user.value?.name) return '?';
      return user.value.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    });

    // Subscription badge color
    const tierBadgeClass = computed(() => {
      if (user.value?.subscription?.tier === 'premium') {
        return 'bg-yellow-100 text-yellow-800';
      }
      return 'bg-gray-100 text-gray-800';
    });

    // Navigate to edit profile
    const handleEdit = () => {
      window.router?.push('/profile/edit');
    };

    // Navigate to change password
    const handleChangePassword = () => {
      window.router?.push('/profile/password');
    };

    // Navigate to settings
    const handleSettings = () => {
      window.router?.push('/settings');
    };

    // Go back to dashboard
    const handleBack = () => {
      window.router?.push('/dashboard');
    };

    onMounted(fetchProfile);

    return {
      loading,
      error,
      user,
      initials,
      tierBadgeClass,
      formatDate,
      handleEdit,
      handleChangePassword,
      handleSettings,
      handleBack,
      fetchProfile,
    };
  },

  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center py-4">
            <button
              @click="handleBack"
              class="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 class="text-xl font-semibold text-gray-900">Profile</h1>
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
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p class="text-red-700 mb-4">{{ error }}</p>
          <button @click="fetchProfile" class="btn-primary">
            Try Again
          </button>
        </div>

        <!-- Profile Content -->
        <div v-else-if="user" class="space-y-6">
          <!-- Profile Card -->
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <!-- Profile Header -->
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
              <div class="flex items-center">
                <!-- Avatar -->
                <div class="flex-shrink-0">
                  <div v-if="user.avatar" class="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
                  </div>
                  <div v-else class="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-blue-600 border-4 border-white shadow-lg">
                    {{ initials }}
                  </div>
                </div>

                <!-- Name & Email -->
                <div class="ml-6">
                  <h2 class="text-2xl font-bold text-white">{{ user.name }}</h2>
                  <p class="text-blue-100">{{ user.email }}</p>
                  <span :class="['inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium', tierBadgeClass]">
                    {{ user.subscription?.tier === 'premium' ? '⭐ Premium' : 'Free Plan' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Profile Details -->
            <div class="px-6 py-6">
              <dl class="divide-y divide-gray-100">
                <!-- Email -->
                <div class="py-4 flex justify-between">
                  <dt class="text-sm font-medium text-gray-500">Email</dt>
                  <dd class="text-sm text-gray-900">{{ user.email }}</dd>
                </div>

                <!-- Name -->
                <div class="py-4 flex justify-between">
                  <dt class="text-sm font-medium text-gray-500">Name</dt>
                  <dd class="text-sm text-gray-900">{{ user.name }}</dd>
                </div>

                <!-- Member Since -->
                <div class="py-4 flex justify-between">
                  <dt class="text-sm font-medium text-gray-500">Member since</dt>
                  <dd class="text-sm text-gray-900">{{ formatDate(user.createdAt) }}</dd>
                </div>

                <!-- Subscription -->
                <div class="py-4 flex justify-between">
                  <dt class="text-sm font-medium text-gray-500">Subscription</dt>
                  <dd class="text-sm text-gray-900">
                    <span v-if="user.subscription?.tier === 'premium'">
                      Premium
                      <span v-if="user.subscription?.expiresAt" class="text-gray-500">
                        (expires {{ formatDate(user.subscription.expiresAt) }})
                      </span>
                    </span>
                    <span v-else>Free Plan</span>
                  </dd>
                </div>

                <!-- Theme -->
                <div class="py-4 flex justify-between">
                  <dt class="text-sm font-medium text-gray-500">Theme</dt>
                  <dd class="text-sm text-gray-900 capitalize">{{ user.settings?.theme || 'System' }}</dd>
                </div>

                <!-- Default View -->
                <div class="py-4 flex justify-between">
                  <dt class="text-sm font-medium text-gray-500">Default view</dt>
                  <dd class="text-sm text-gray-900 capitalize">{{ user.settings?.defaultView || 'Grid' }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <button
              @click="handleEdit"
              class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span class="flex items-center">
                <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span class="text-gray-900">Edit Profile</span>
              </span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <button
              @click="handleChangePassword"
              class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span class="flex items-center">
                <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <span class="text-gray-900">Change Password</span>
              </span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <button
              @click="handleSettings"
              class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span class="flex items-center">
                <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="text-gray-900">Settings</span>
              </span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- Upgrade Banner (for free users) -->
          <div v-if="user.subscription?.tier !== 'premium'" class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-white">
            <h3 class="text-lg font-semibold mb-2">Upgrade to Premium</h3>
            <p class="text-sm opacity-90 mb-4">Get unlimited locations, AI identification, and more!</p>
            <button class="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors">
              View Plans
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
};
