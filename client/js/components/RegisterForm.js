/**
 * RegisterForm Component
 * Handles user registration with validation
 */

const { ref, reactive, computed } = Vue;

export default {
  name: 'RegisterForm',

  emits: ['success', 'error'],

  setup(props, { emit }) {
    // Form data
    const form = reactive({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    });

    // Form state
    const loading = ref(false);
    const errors = reactive({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      general: '',
    });

    // Password visibility
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);

    // Validation rules
    const validateEmail = (email) => {
      if (!email) return 'Email is required';
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(email)) return 'Please enter a valid email';
      return '';
    };

    const validatePassword = (password) => {
      if (!password) return 'Password is required';
      if (password.length < 8) return 'Password must be at least 8 characters';
      return '';
    };

    const validateConfirmPassword = (confirmPassword) => {
      if (!confirmPassword) return 'Please confirm your password';
      if (confirmPassword !== form.password) return 'Passwords do not match';
      return '';
    };

    const validateName = (name) => {
      if (!name) return 'Name is required';
      if (name.length > 100) return 'Name cannot exceed 100 characters';
      return '';
    };

    // Validate all fields
    const validateForm = () => {
      errors.email = validateEmail(form.email);
      errors.password = validatePassword(form.password);
      errors.confirmPassword = validateConfirmPassword(form.confirmPassword);
      errors.name = validateName(form.name);
      errors.general = '';

      return !errors.email && !errors.password && !errors.confirmPassword && !errors.name;
    };

    // Check if form is valid
    const isValid = computed(() => {
      return (
        form.email &&
        form.password &&
        form.confirmPassword &&
        form.name &&
        form.password === form.confirmPassword &&
        form.password.length >= 8
      );
    });

    // Handle field blur for validation
    const handleBlur = (field) => {
      switch (field) {
        case 'email':
          errors.email = validateEmail(form.email);
          break;
        case 'password':
          errors.password = validatePassword(form.password);
          if (form.confirmPassword) {
            errors.confirmPassword = validateConfirmPassword(form.confirmPassword);
          }
          break;
        case 'confirmPassword':
          errors.confirmPassword = validateConfirmPassword(form.confirmPassword);
          break;
        case 'name':
          errors.name = validateName(form.name);
          break;
      }
    };

    // Submit form
    const handleSubmit = async () => {
      if (!validateForm()) {
        return;
      }

      loading.value = true;
      errors.general = '';

      try {
        const response = await window.api.auth.register({
          email: form.email,
          password: form.password,
          name: form.name,
        });

        // Success
        emit('success', response.data.user);

        // Update store
        if (window.store) {
          window.store.setUser(response.data.user);
          window.store.success('Registration successful! Welcome to WIT.');
        }
      } catch (error) {
        console.error('Registration error:', error);

        // Handle specific error codes
        if (error.code === 'DUPLICATE_EMAIL') {
          errors.email = 'This email is already registered';
        } else if (error.code === 'VALIDATION_ERROR' && error.details) {
          // Map validation errors to form fields
          error.details.forEach((detail) => {
            if (errors.hasOwnProperty(detail.field)) {
              errors[detail.field] = detail.message;
            }
          });
        } else {
          errors.general = error.message || 'Registration failed. Please try again.';
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
      showConfirmPassword,
      isValid,
      handleBlur,
      handleSubmit,
    };
  },

  template: `
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- General Error -->
      <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ errors.general }}
      </div>

      <!-- Name Field -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          autocomplete="name"
          :class="[
            'input',
            errors.name ? 'border-red-500 focus:ring-red-500' : ''
          ]"
          placeholder="John Doe"
          @blur="handleBlur('name')"
        />
        <p v-if="errors.name" class="mt-1 text-sm text-red-600">
          {{ errors.name }}
        </p>
      </div>

      <!-- Email Field -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          id="email"
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
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div class="relative">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :class="[
              'input pr-10',
              errors.password ? 'border-red-500 focus:ring-red-500' : ''
            ]"
            placeholder="Min. 8 characters"
            @blur="handleBlur('password')"
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

      <!-- Confirm Password Field -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <div class="relative">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :class="[
              'input pr-10',
              errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
            ]"
            placeholder="Confirm your password"
            @blur="handleBlur('confirmPassword')"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <span v-if="showConfirmPassword">Hide</span>
            <span v-else>Show</span>
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">
          {{ errors.confirmPassword }}
        </p>
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
          Creating account...
        </span>
        <span v-else>Create Account</span>
      </button>

      <!-- Login Link -->
      <p class="text-center text-sm text-gray-600">
        Already have an account?
        <a href="/login" @click.prevent="$router?.push('/login') || (window.location.href = '/login')" class="text-blue-600 hover:text-blue-800 font-medium">
          Sign in
        </a>
      </p>
    </form>
  `,
};
