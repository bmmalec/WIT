/**
 * ForgotPasswordPage Component
 * Request password reset via email
 */

const { ref, reactive, computed } = Vue;

export default {
  name: 'ForgotPasswordPage',

  setup() {
    const email = ref('');
    const loading = ref(false);
    const submitted = ref(false);
    const error = ref('');

    // For dev mode - show reset link
    const resetInfo = ref(null);

    const isValidEmail = computed(() => {
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      return emailRegex.test(email.value);
    });

    const handleSubmit = async () => {
      if (!isValidEmail.value) {
        error.value = 'Please enter a valid email address';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        const response = await window.api.auth.forgotPassword({ email: email.value });
        submitted.value = true;

        // In dev mode, show the reset link
        if (response.data?.resetUrl) {
          resetInfo.value = response.data;
        }
      } catch (err) {
        console.error('Forgot password error:', err);
        error.value = err.message || 'Failed to send reset email. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    const goToLogin = () => {
      window.router?.push('/login');
    };

    const goToResetPage = () => {
      if (resetInfo.value?.resetUrl) {
        window.router?.push(resetInfo.value.resetUrl);
      }
    };

    return {
      email,
      loading,
      submitted,
      error,
      resetInfo,
      isValidEmail,
      handleSubmit,
      goToLogin,
      goToResetPage,
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
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <!-- Success State -->
          <div v-if="submitted" class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
            <p class="text-sm text-gray-600 mb-6">
              If an account with that email exists, we've sent a password reset link.
            </p>

            <!-- Dev mode: Show reset link -->
            <div v-if="resetInfo" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <p class="text-xs text-yellow-800 font-medium mb-2">Development Mode</p>
              <p class="text-sm text-yellow-700 mb-2">Reset link (would be emailed in production):</p>
              <button
                @click="goToResetPage"
                class="text-sm text-blue-600 hover:text-blue-800 underline break-all"
              >
                {{ resetInfo.resetUrl }}
              </button>
            </div>

            <button @click="goToLogin" class="btn-primary w-full">
              Back to Login
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
                <span>{{ error }}</span>
              </div>
            </div>

            <!-- Email Field -->
            <div>
              <label for="reset-email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="reset-email"
                v-model="email"
                type="email"
                autocomplete="email"
                class="input"
                placeholder="you@example.com"
              />
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="loading || !email"
              class="btn-primary w-full flex justify-center items-center"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
              <span v-else>Send Reset Link</span>
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
