/**
 * ChangePasswordForm Component
 * Form for changing user password
 */

const { ref, reactive, computed } = Vue;

export default {
  name: 'ChangePasswordForm',

  emits: ['success', 'cancel'],

  setup(props, { emit }) {
    // Form data
    const form = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    // Form state
    const loading = ref(false);
    const errors = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    });

    // Password visibility toggles
    const showCurrentPassword = ref(false);
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);

    // Password strength indicator
    const passwordStrength = computed(() => {
      const password = form.newPassword;
      if (!password) return { score: 0, label: '', color: '' };

      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++;

      const levels = [
        { score: 0, label: '', color: '' },
        { score: 1, label: 'Weak', color: 'bg-red-500' },
        { score: 2, label: 'Fair', color: 'bg-orange-500' },
        { score: 3, label: 'Good', color: 'bg-yellow-500' },
        { score: 4, label: 'Strong', color: 'bg-green-500' },
        { score: 5, label: 'Very Strong', color: 'bg-green-600' },
      ];

      return levels[Math.min(score, 5)];
    });

    // Validation
    const validateCurrentPassword = () => {
      if (!form.currentPassword) {
        errors.currentPassword = 'Current password is required';
        return false;
      }
      errors.currentPassword = '';
      return true;
    };

    const validateNewPassword = () => {
      if (!form.newPassword) {
        errors.newPassword = 'New password is required';
        return false;
      }
      if (form.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
        return false;
      }
      if (form.newPassword === form.currentPassword) {
        errors.newPassword = 'New password must be different from current password';
        return false;
      }
      errors.newPassword = '';
      return true;
    };

    const validateConfirmPassword = () => {
      if (!form.confirmPassword) {
        errors.confirmPassword = 'Please confirm your new password';
        return false;
      }
      if (form.confirmPassword !== form.newPassword) {
        errors.confirmPassword = 'Passwords do not match';
        return false;
      }
      errors.confirmPassword = '';
      return true;
    };

    // Clear form
    const clearForm = () => {
      form.currentPassword = '';
      form.newPassword = '';
      form.confirmPassword = '';
      errors.currentPassword = '';
      errors.newPassword = '';
      errors.confirmPassword = '';
      errors.general = '';
    };

    // Submit form
    const handleSubmit = async () => {
      // Validate all fields
      const isCurrentValid = validateCurrentPassword();
      const isNewValid = validateNewPassword();
      const isConfirmValid = validateConfirmPassword();
      errors.general = '';

      if (!isCurrentValid || !isNewValid || !isConfirmValid) {
        return;
      }

      loading.value = true;

      try {
        await window.api.auth.changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });

        // Show success message
        if (window.store) {
          window.store.success('Password changed successfully');
        }

        clearForm();
        emit('success');
      } catch (error) {
        console.error('Change password error:', error);

        if (error.code === 'INVALID_PASSWORD') {
          errors.currentPassword = 'Current password is incorrect';
        } else if (error.code === 'VALIDATION_ERROR' && error.details) {
          error.details.forEach((detail) => {
            if (detail.field === 'currentPassword') {
              errors.currentPassword = detail.message;
            } else if (detail.field === 'newPassword') {
              errors.newPassword = detail.message;
            }
          });
        } else {
          errors.general = error.message || 'Failed to change password';
        }
      } finally {
        loading.value = false;
      }
    };

    // Cancel
    const handleCancel = () => {
      clearForm();
      emit('cancel');
    };

    return {
      form,
      errors,
      loading,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      passwordStrength,
      validateCurrentPassword,
      validateNewPassword,
      validateConfirmPassword,
      handleSubmit,
      handleCancel,
    };
  },

  template: `
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- General Error -->
      <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ errors.general }}
      </div>

      <!-- Current Password -->
      <div>
        <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <div class="relative">
          <input
            id="currentPassword"
            v-model="form.currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            :class="[
              'input pr-10',
              errors.currentPassword ? 'border-red-500' : ''
            ]"
            placeholder="Enter your current password"
            @blur="validateCurrentPassword"
          />
          <button
            type="button"
            @click="showCurrentPassword = !showCurrentPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg v-if="showCurrentPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.currentPassword" class="mt-1 text-sm text-red-600">
          {{ errors.currentPassword }}
        </p>
      </div>

      <!-- New Password -->
      <div>
        <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <div class="relative">
          <input
            id="newPassword"
            v-model="form.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            :class="[
              'input pr-10',
              errors.newPassword ? 'border-red-500' : ''
            ]"
            placeholder="Enter your new password"
            @blur="validateNewPassword"
          />
          <button
            type="button"
            @click="showNewPassword = !showNewPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg v-if="showNewPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.newPassword" class="mt-1 text-sm text-red-600">
          {{ errors.newPassword }}
        </p>

        <!-- Password Strength Indicator -->
        <div v-if="form.newPassword" class="mt-2">
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                :class="['h-full transition-all duration-300', passwordStrength.color]"
                :style="{ width: (passwordStrength.score / 5 * 100) + '%' }"
              ></div>
            </div>
            <span class="text-xs text-gray-500">{{ passwordStrength.label }}</span>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            Use 8+ characters with uppercase, lowercase, numbers, and symbols.
          </p>
        </div>
      </div>

      <!-- Confirm Password -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password
        </label>
        <div class="relative">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            :class="[
              'input pr-10',
              errors.confirmPassword ? 'border-red-500' : ''
            ]"
            placeholder="Confirm your new password"
            @blur="validateConfirmPassword"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-4">
        <button
          type="button"
          @click="handleCancel"
          class="flex-1 btn-secondary"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="flex-1 btn-primary flex justify-center items-center"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Changing...
          </span>
          <span v-else>Change Password</span>
        </button>
      </div>
    </form>
  `,
};
