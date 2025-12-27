/**
 * LoginForm Component
 * Handles user login with email/password
 */

const { ref, reactive, computed } = Vue;

export default {
  name: 'LoginForm',

  emits: ['success', 'error'],

  setup(props, { emit }) {
    // Form data
    const form = reactive({
      email: '',
      password: '',
      rememberMe: false,
    });

    // Form state
    const loading = ref(false);
    const errors = reactive({
      email: '',
      password: '',
      general: '',
    });

    // Password visibility
    const showPassword = ref(false);

    // Check if form is valid
    const isValid = computed(() => {
      return form.email && form.password;
    });

    // Validate email format
    const validateEmail = (email) => {
      if (!email) return 'Email is required';
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(email)) return 'Please enter a valid email';
      return '';
    };

    // Handle field blur for validation
    const handleBlur = (field) => {
      if (field === 'email') {
        errors.email = validateEmail(form.email);
      }
    };

    // Clear all errors
    const clearErrors = () => {
      errors.email = '';
      errors.password = '';
      errors.general = '';
    };

    // Submit form
    const handleSubmit = async () => {
      if (!isValid.value) return;

      // Validate email before submit
      errors.email = validateEmail(form.email);
      if (errors.email) return;

      loading.value = true;
      clearErrors();

      try {
        const response = await window.api.auth.login({
          email: form.email,
          password: form.password,
        });

        // Success
        emit('success', response.data.user);

        // Update store
        if (window.store) {
          window.store.setUser(response.data.user);
          window.store.success('Welcome back!');
        }
      } catch (error) {
        console.error('Login error:', error);

        // Handle specific error codes
        if (error.code === 'INVALID_CREDENTIALS') {
          errors.general = 'Invalid email or password';
        } else if (error.code === 'ACCOUNT_LOCKED') {
          errors.general = 'Account is locked due to too many failed attempts. Please try again in 2 hours.';
        } else if (error.code === 'VALIDATION_ERROR' && error.details) {
          // Map validation errors to form fields
          error.details.forEach((detail) => {
            if (errors.hasOwnProperty(detail.field)) {
              errors[detail.field] = detail.message;
            }
          });
        } else if (error.code === 'RATE_LIMITED') {
          errors.general = 'Too many login attempts. Please wait a few minutes and try again.';
        } else {
          errors.general = error.message || 'Login failed. Please try again.';
        }

        emit('error', error);
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      errors,
      loading,
      showPassword,
      isValid,
      handleBlur,
      handleSubmit,
    };
  },

  template: `
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- General Error -->
      <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div class="flex items-start">
          <svg class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <span>{{ errors.general }}</span>
        </div>
      </div>

      <!-- Email Field -->
      <div>
        <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          id="login-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          :class="[
            'input',
            errors.email ? 'border-red-500 focus:ring-red-500' : ''
          ]"
          placeholder="you@example.com"
          @blur="handleBlur('email')"
        />
        <p v-if="errors.email" class="mt-1 text-sm text-red-600">
          {{ errors.email }}
        </p>
      </div>

      <!-- Password Field -->
      <div>
        <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div class="relative">
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            :class="[
              'input pr-10',
              errors.password ? 'border-red-500 focus:ring-red-500' : ''
            ]"
            placeholder="Your password"
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
        <p v-if="errors.password" class="mt-1 text-sm text-red-600">
          {{ errors.password }}
        </p>
      </div>

      <!-- Remember Me & Forgot Password -->
      <div class="flex items-center justify-between">
        <label class="flex items-center">
          <input
            type="checkbox"
            v-model="form.rememberMe"
            class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        <a href="#" class="text-sm text-blue-600 hover:text-blue-800">
          Forgot password?
        </a>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading || !isValid"
        class="btn-primary w-full flex justify-center items-center"
      >
        <span v-if="loading" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </span>
        <span v-else>Sign In</span>
      </button>

      <!-- Register Link -->
      <p class="text-center text-sm text-gray-600">
        Don't have an account?
        <a href="/register" @click.prevent="window.router?.push('/register')" class="text-blue-600 hover:text-blue-800 font-medium">
          Create one
        </a>
      </p>
    </form>
  `,
};
