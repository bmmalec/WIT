/**
 * EditProfilePage Component
 * Page for editing user profile
 */

import ProfileForm from '../components/ProfileForm.js';

const { ref, computed, onMounted } = Vue;

export default {
  name: 'EditProfilePage',

  components: {
    ProfileForm,
  },

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
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        error.value = err.message || 'Failed to load profile';

        if (err.code === 'UNAUTHORIZED' || err.code === 'TOKEN_EXPIRED') {
          window.store?.clearUser();
          window.router?.push('/login');
        }
      } finally {
        loading.value = false;
      }
    };

    // Handle successful update
    const handleSuccess = (updatedUser) => {
      user.value = updatedUser;
      window.router?.push('/profile');
    };

    // Handle cancel
    const handleCancel = () => {
      window.router?.push('/profile');
    };

    // Go back
    const handleBack = () => {
      window.router?.push('/profile');
    };

    onMounted(fetchProfile);

    return {
      loading,
      error,
      user,
      handleSuccess,
      handleCancel,
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
            <h1 class="text-xl font-semibold text-gray-900">Edit Profile</h1>
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

        <!-- Edit Form -->
        <div v-else-if="user" class="bg-white rounded-lg shadow-sm p-6">
          <ProfileForm
            :user="user"
            @success="handleSuccess"
            @cancel="handleCancel"
          />
        </div>
      </main>
    </div>
  `,
};
