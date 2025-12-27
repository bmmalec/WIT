/**
 * ResetPasswordPage Component
 * Reset password using token from email link
 */

const { ref, reactive, computed, onMounted } = Vue;

export default {
  name: 'ResetPasswordPage',

  setup() {
    const password = ref('');
    const confirmPassword = ref('');
    const showPassword = ref(false);
    const loading = ref(false);
    const success = ref(false);
    const error = ref('');
    const token = ref('');

    // Get token from URL on mount
    onMounted(() => {
      const path = window.location.pathname;
      const match = path.match(/\/reset-password\/(.+)/);
      if (match) {
        token.value = match[1];
      }
    });

    const isValidPassword = computed(() => {
      return password.value.length >= 8;
    });

    const passwordsMatch = computed(() => {
      return password.value === confirmPassword.value;
    });

    const canSubmit = computed(() => {
      return isValidPassword.value && passwordsMatch.value && token.value;
    });

    const handleSubmit = async () => {
      if (!canSubmit.value) {
        if (!isValidPassword.value) {
          error.value = 'Password must be at least 8 characters';
        } else if (!passwordsMatch.value) {
          error.value = 'Passwords do not match';
        }
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        await window.api.auth.resetPassword(token.value, { password: password.value });
        success.value = true;
        window.store?.success('Password reset successful!');
      } catch (err) {
        console.error('Reset password error:', err);
        if (err.code === 'INVALID_RESET_TOKEN') {
          error.value = 'This reset link is invalid or has expired. Please request a new one.';
        } else {
          error.value = err.message || 'Failed to reset password. Please try again.';
        }
      } finally {
        loading.value = false;
      }
    };

    const goToLogin = () => {
      window.router?.push('/login');
    };

    const goToForgotPassword = () => {
      window.router?.push('/forgot-password');
    };

    return {
      password,
      confirmPassword,
      showPassword,
      loading,
      success,
      error,
      token,
      isValidPassword,
      passwordsMatch,
      canSubmit,
      handleSubmit,
      goToLogin,
      goToForgotPassword,
    };
  },

  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo/Branding -->
        <div class="text-center">
          <h1 class="text-4xl font-bold text-blue-600">WIT</h1>
          <p class="mt-1 text-gray-500">Where Is It?</p>
        </div>

        <h2 class="mt-6 text-center text-2xl font-bold text-gray-900">
          Set new password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <!-- Success State -->
          <div v-if="success" class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Password reset complete</h3>
            <p class="text-sm text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <button @click="goToLogin" class="btn-primary w-full">
              Sign In
            </button>
          </div>

          <!-- Form State -->
          <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Error Message -->
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div class="flex items-start">
                <svg class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <div>
                  <span>{{ error }}</span>
                  <button
                    v-if="error.includes('expired')"
                    @click="goToForgotPassword"
                    class="block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Request a new reset link
                  </button>
                </div>
              </div>
            </div>

            <!-- No Token Warning -->
            <div v-if="!token" class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              <p class="text-sm">Invalid reset link. Please use the link from your email.</p>
            </div>

            <!-- Password Field -->
            <div>
              <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div class="relative">
                <input
                  id="new-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :class="[
                    'input pr-10',
                    password && !isValidPassword ? 'border-red-500' : ''
                  ]"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  @click="showPassword = !showPassword"
                >
                  <span v-if="showPassword">Hide</span>
                  <span v-else>Show</span>
                </button>
              </div>
              <p v-if="password && !isValidPassword" class="mt-1 text-sm text-red-600">
                Password must be at least 8 characters
              </p>
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :class="[
                  'input',
                  confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                ]"
                placeholder="Confirm your password"
              />
              <p v-if="confirmPassword && !passwordsMatch" class="mt-1 text-sm text-red-600">
                Passwords do not match
              </p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="loading || !canSubmit"
              class="btn-primary w-full flex justify-center items-center"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
              </span>
              <span v-else>Reset Password</span>
            </button>

            <!-- Back to Login -->
            <p class="text-center text-sm text-gray-600">
              Remember your password?
              <a href="/login" @click.prevent="goToLogin" class="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  `,
};
