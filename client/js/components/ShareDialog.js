/**
 * ShareDialog Component
 * Modal dialog for inviting users to share a location
 */

const { ref, reactive, computed, watch } = Vue;

// Permission level definitions
const PERMISSION_LEVELS = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view location and items',
    icon: '👁️'
  },
  {
    value: 'contributor',
    label: 'Contributor',
    description: 'Can add items to location',
    icon: '➕'
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Can add, edit, and remove items',
    icon: '✏️'
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Full access including sharing',
    icon: '👑'
  },
];

export default {
  name: 'ShareDialog',

  props: {
    show: {
      type: Boolean,
      default: false,
    },
    location: {
      type: Object,
      required: true,
    },
  },

  emits: ['close', 'invited'],

  setup(props, { emit }) {
    // Form state
    const loading = ref(false);
    const errors = reactive({
      email: '',
      permission: '',
      general: '',
    });

    // Form data
    const form = reactive({
      email: '',
      permission: 'viewer',
      inheritToChildren: true,
    });

    // Reset form when dialog opens
    watch(() => props.show, (isOpen) => {
      if (isOpen) {
        form.email = '';
        form.permission = 'viewer';
        form.inheritToChildren = true;
        errors.email = '';
        errors.permission = '';
        errors.general = '';
      }
    });

    // Validate email
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // Validation
    const validate = () => {
      let isValid = true;
      errors.email = '';
      errors.permission = '';
      errors.general = '';

      if (!form.email.trim()) {
        errors.email = 'Email is required';
        isValid = false;
      } else if (!validateEmail(form.email.trim())) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }

      if (!form.permission) {
        errors.permission = 'Please select a permission level';
        isValid = false;
      }

      return isValid;
    };

    // Submit invitation
    const handleSubmit = async () => {
      if (!validate()) return;

      loading.value = true;
      errors.general = '';

      try {
        const response = await window.api.shares.invite(props.location._id, {
          email: form.email.trim().toLowerCase(),
          permission: form.permission,
          inheritToChildren: form.inheritToChildren,
        });

        if (window.store) {
          window.store.success('Invitation sent successfully');
        }

        emit('invited', response.data.share);
        emit('close');
      } catch (error) {
        console.error('Share invite error:', error);

        // Handle specific error codes
        if (error.code === 'ALREADY_SHARED') {
          errors.email = 'This user already has access to this location';
        } else if (error.code === 'INVITE_PENDING') {
          errors.email = 'An invitation is already pending for this email';
        } else if (error.code === 'SELF_INVITE') {
          errors.email = 'You cannot invite yourself';
        } else if (error.code === 'OWNER_INVITE') {
          errors.email = 'Cannot invite the location owner';
        } else if (error.code === 'VALIDATION_ERROR' && error.details) {
          error.details.forEach(detail => {
            if (errors.hasOwnProperty(detail.field)) {
              errors[detail.field] = detail.message;
            }
          });
        } else {
          errors.general = error.message || 'Failed to send invitation';
        }
      } finally {
        loading.value = false;
      }
    };

    // Close dialog
    const handleClose = () => {
      emit('close');
    };

    // Get permission info
    const getPermissionInfo = (value) => {
      return PERMISSION_LEVELS.find(p => p.value === value);
    };

    // Selected permission info
    const selectedPermission = computed(() => getPermissionInfo(form.permission));

    return {
      form,
      errors,
      loading,
      PERMISSION_LEVELS,
      selectedPermission,
      handleSubmit,
      handleClose,
    };
  },

  template: `
    <!-- Modal Backdrop -->
    <div
      v-if="show"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="handleClose"
    >
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <!-- Backdrop overlay -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="handleClose"
        ></div>

        <!-- Modal panel -->
        <div
          class="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
          @click.stop
        >
          <!-- Header -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="text-2xl mr-3">{{ location.icon || '📍' }}</span>
                <div>
                  <h3 class="text-lg font-medium text-gray-900">Share Location</h3>
                  <p class="text-sm text-gray-500">{{ location.name }}</p>
                </div>
              </div>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-4">
            <!-- General Error -->
            <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ errors.general }}
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                :class="['input', errors.email ? 'border-red-500' : '']"
                placeholder="colleague@example.com"
                :disabled="loading"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
            </div>

            <!-- Permission Level -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Permission Level *
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="perm in PERMISSION_LEVELS"
                  :key="perm.value"
                  type="button"
                  @click="form.permission = perm.value"
                  :disabled="loading"
                  :class="[
                    'p-3 rounded-lg border-2 text-left transition-all',
                    form.permission === perm.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  <div class="flex items-center">
                    <span class="text-lg mr-2">{{ perm.icon }}</span>
                    <span class="font-medium text-sm text-gray-900">{{ perm.label }}</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ perm.description }}</p>
                </button>
              </div>
              <p v-if="errors.permission" class="mt-1 text-sm text-red-600">{{ errors.permission }}</p>
            </div>

            <!-- Inherit to Children -->
            <div class="flex items-start">
              <input
                id="inheritToChildren"
                v-model="form.inheritToChildren"
                type="checkbox"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded mt-0.5"
                :disabled="loading"
              />
              <div class="ml-2">
                <label for="inheritToChildren" class="text-sm font-medium text-gray-700">
                  Apply to child locations
                </label>
                <p class="text-xs text-gray-500">
                  User will automatically have access to all sub-locations
                </p>
              </div>
            </div>

            <!-- Info Box -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex">
                <svg class="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm text-blue-800">
                  An email invitation will be sent. The link expires in 7 days.
                </p>
              </div>
            </div>
          </form>

          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              @click="handleClose"
              class="btn-secondary"
              :disabled="loading"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="handleSubmit"
              :disabled="loading"
              class="btn-primary flex items-center"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
              <span v-else class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Send Invitation
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};

export { PERMISSION_LEVELS };
