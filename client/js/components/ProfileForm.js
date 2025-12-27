/**
 * ProfileForm Component
 * Form for editing user profile (name, avatar)
 */

const { ref, reactive, computed, onMounted } = Vue;

export default {
  name: 'ProfileForm',

  props: {
    user: {
      type: Object,
      required: true,
    },
  },

  emits: ['success', 'cancel'],

  setup(props, { emit }) {
    // Form data
    const form = reactive({
      name: '',
      avatar: '',
    });

    // Form state
    const loading = ref(false);
    const errors = reactive({
      name: '',
      avatar: '',
      general: '',
    });

    // Avatar preview
    const avatarPreview = ref('');

    // Initialize form with user data
    onMounted(() => {
      form.name = props.user?.name || '';
      form.avatar = props.user?.avatar || '';
      avatarPreview.value = props.user?.avatar || '';
    });

    // Check if form has changes
    const hasChanges = computed(() => {
      return (
        form.name !== (props.user?.name || '') ||
        form.avatar !== (props.user?.avatar || '')
      );
    });

    // Validate name
    const validateName = (name) => {
      if (!name || !name.trim()) return 'Name is required';
      if (name.length > 100) return 'Name cannot exceed 100 characters';
      return '';
    };

    // Validate avatar URL
    const validateAvatar = (url) => {
      if (!url) return ''; // Avatar is optional
      try {
        new URL(url);
        return '';
      } catch {
        return 'Please enter a valid URL';
      }
    };

    // Handle avatar URL change
    const handleAvatarChange = () => {
      errors.avatar = validateAvatar(form.avatar);
      if (!errors.avatar && form.avatar) {
        avatarPreview.value = form.avatar;
      } else if (!form.avatar) {
        avatarPreview.value = '';
      }
    };

    // Clear avatar
    const clearAvatar = () => {
      form.avatar = '';
      avatarPreview.value = '';
      errors.avatar = '';
    };

    // Get initials for avatar placeholder
    const initials = computed(() => {
      if (!form.name) return '?';
      return form.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    });

    // Submit form
    const handleSubmit = async () => {
      // Validate
      errors.name = validateName(form.name);
      errors.avatar = validateAvatar(form.avatar);
      errors.general = '';

      if (errors.name || errors.avatar) {
        return;
      }

      loading.value = true;

      try {
        const response = await window.api.auth.updateProfile({
          name: form.name.trim(),
          avatar: form.avatar || null,
        });

        // Update store
        if (window.store) {
          window.store.setUser(response.data.user);
          window.store.success('Profile updated successfully');
        }

        emit('success', response.data.user);
      } catch (error) {
        console.error('Update profile error:', error);

        if (error.code === 'VALIDATION_ERROR' && error.details) {
          error.details.forEach((detail) => {
            if (errors.hasOwnProperty(detail.field)) {
              errors[detail.field] = detail.message;
            }
          });
        } else {
          errors.general = error.message || 'Failed to update profile';
        }
      } finally {
        loading.value = false;
      }
    };

    // Cancel editing
    const handleCancel = () => {
      emit('cancel');
    };

    return {
      form,
      errors,
      loading,
      avatarPreview,
      hasChanges,
      initials,
      handleAvatarChange,
      clearAvatar,
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

      <!-- Avatar Section -->
      <div class="flex flex-col items-center">
        <label class="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>

        <!-- Avatar Preview -->
        <div class="mb-4">
          <div v-if="avatarPreview" class="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
            <img
              :src="avatarPreview"
              alt="Avatar preview"
              class="w-full h-full object-cover"
              @error="avatarPreview = ''"
            />
          </div>
          <div v-else class="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 border-4 border-gray-200">
            {{ initials }}
          </div>
        </div>

        <!-- Avatar URL Input -->
        <div class="w-full max-w-md">
          <label for="avatar" class="block text-sm text-gray-600 mb-1">
            Avatar URL
          </label>
          <div class="flex gap-2">
            <input
              id="avatar"
              v-model="form.avatar"
              type="url"
              :class="[
                'input flex-1',
                errors.avatar ? 'border-red-500' : ''
              ]"
              placeholder="https://example.com/avatar.jpg"
              @input="handleAvatarChange"
              @blur="handleAvatarChange"
            />
            <button
              v-if="form.avatar"
              type="button"
              @click="clearAvatar"
              class="px-3 py-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Remove avatar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <p v-if="errors.avatar" class="mt-1 text-sm text-red-600">
            {{ errors.avatar }}
          </p>
          <p class="mt-1 text-xs text-gray-500">
            Enter a URL to an image. Leave empty to use initials.
          </p>
        </div>
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
          :class="[
            'input',
            errors.name ? 'border-red-500' : ''
          ]"
          placeholder="Your full name"
        />
        <p v-if="errors.name" class="mt-1 text-sm text-red-600">
          {{ errors.name }}
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
          :disabled="loading || !hasChanges"
          class="flex-1 btn-primary flex justify-center items-center"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </form>
  `,
};
