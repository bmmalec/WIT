/**
 * LoginPage Component
 * Login page with branding and form
 */

import LoginForm from '../components/LoginForm.js';

export default {
  name: 'LoginPage',

  components: {
    LoginForm,
  },

  setup() {
    const handleSuccess = (user) => {
      // Check for return URL (e.g., from invitation page)
      const returnUrl = sessionStorage.getItem('returnUrl');
      sessionStorage.removeItem('returnUrl');

      const destination = returnUrl || '/dashboard';

      if (window.router) {
        window.router.push(destination);
      } else {
        window.location.href = destination;
      }
    };

    const handleError = (error) => {
      // Error is already handled in the form
      console.error('Login failed:', error);
    };

    return {
      handleSuccess,
      handleError,
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
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Access your inventory from anywhere
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <LoginForm
            @success="handleSuccess"
            @error="handleError"
          />
        </div>
      </div>
    </div>
  `,
};
