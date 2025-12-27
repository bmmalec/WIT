/**
 * ChangePasswordPage Component
 * Page for changing user password
 */

import ChangePasswordForm from '../components/ChangePasswordForm.js';

const { ref } = Vue;

export default {
  name: 'ChangePasswordPage',

  components: {
    ChangePasswordForm,
  },

  setup() {
    // Handle successful password change
    const handleSuccess = () => {
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

    return {
      handleSuccess,
      handleCancel,
      handleBack,
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
            <h1 class="text-xl font-semibold text-gray-900">Change Password</h1>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <!-- Security Notice -->
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex">
              <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="ml-3">
                <p class="text-sm text-blue-700">
                  Choose a strong password that you don't use elsewhere. After changing your password, you'll remain logged in on this device.
                </p>
              </div>
            </div>
          </div>

          <ChangePasswordForm
            @success="handleSuccess"
            @cancel="handleCancel"
          />
        </div>
      </main>
    </div>
  `,
};
