/**
 * LocationForm Component
 * Form for creating/editing locations
 */

const { ref, reactive, computed, watch } = Vue;

// Location type definitions with icons and labels
const LOCATION_TYPES = [
  // Properties - top-level locations
  { value: 'house', label: 'House', icon: '🏠', category: 'property' },
  { value: 'apartment', label: 'Apartment', icon: '🏢', category: 'property' },
  { value: 'warehouse', label: 'Warehouse', icon: '🏭', category: 'property' },
  { value: 'storage_unit', label: 'Storage Unit', icon: '📦', category: 'property' },
  { value: 'office', label: 'Office', icon: '🏢', category: 'property' },
  { value: 'vehicle', label: 'Vehicle', icon: '🚗', category: 'property' },
  { value: 'boat', label: 'Boat', icon: '⛵', category: 'property' },
  { value: 'rv', label: 'RV/Camper', icon: '🚐', category: 'property' },
  // Rooms - inside properties
  { value: 'garage', label: 'Garage', icon: '🚙', category: 'room' },
  { value: 'basement', label: 'Basement', icon: '🪜', category: 'room' },
  { value: 'attic', label: 'Attic', icon: '🏚️', category: 'room' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳', category: 'room' },
  { value: 'bedroom', label: 'Bedroom', icon: '🛏️', category: 'room' },
  { value: 'bathroom', label: 'Bathroom', icon: '🚿', category: 'room' },
  { value: 'living_room', label: 'Living Room', icon: '🛋️', category: 'room' },
  { value: 'dining_room', label: 'Dining Room', icon: '🍽️', category: 'room' },
  { value: 'office_room', label: 'Home Office', icon: '💻', category: 'room' },
  { value: 'laundry', label: 'Laundry Room', icon: '🧺', category: 'room' },
  { value: 'workshop', label: 'Workshop', icon: '🔧', category: 'room' },
  { value: 'utility', label: 'Utility Room', icon: '🔌', category: 'room' },
  { value: 'room', label: 'Other Room', icon: '🚪', category: 'room' },
  // Warehouse zones
  { value: 'zone', label: 'Zone', icon: '📍', category: 'zone' },
  { value: 'inbound', label: 'Inbound', icon: '📥', category: 'zone' },
  { value: 'outbound', label: 'Outbound', icon: '📤', category: 'zone' },
  { value: 'staging', label: 'Staging', icon: '⏳', category: 'zone' },
  { value: 'receiving', label: 'Receiving', icon: '📬', category: 'zone' },
  { value: 'shipping', label: 'Shipping', icon: '🚚', category: 'zone' },
  { value: 'racking', label: 'Racking', icon: '🏗️', category: 'zone' },
  { value: 'floor', label: 'Floor Area', icon: '⬜', category: 'zone' },
  { value: 'aisle', label: 'Aisle', icon: '↔️', category: 'zone' },
  // Containers - storage containers
  { value: 'closet', label: 'Closet', icon: '🚪', category: 'container' },
  { value: 'cabinet', label: 'Cabinet', icon: '🗄️', category: 'container' },
  { value: 'drawer', label: 'Drawer', icon: '🗃️', category: 'container' },
  { value: 'shelf', label: 'Shelf', icon: '📚', category: 'container' },
  { value: 'box', label: 'Box', icon: '📦', category: 'container' },
  { value: 'bin', label: 'Bin', icon: '🗑️', category: 'container' },
  { value: 'container', label: 'Container', icon: '📥', category: 'container' },
  { value: 'drawer_cabinet', label: 'Drawer Cabinet', icon: '🗄️', category: 'container' },
  { value: 'shelving', label: 'Shelving Unit', icon: '📚', category: 'container' },
  { value: 'bin_rack', label: 'Bin Rack', icon: '🗃️', category: 'container' },
  { value: 'tool_chest', label: 'Tool Chest', icon: '🧰', category: 'container' },
  { value: 'pegboard', label: 'Pegboard', icon: '📌', category: 'container' },
  { value: 'locker', label: 'Locker', icon: '🔐', category: 'container' },
  { value: 'safe', label: 'Safe', icon: '🔒', category: 'container' },
  { value: 'trunk', label: 'Trunk', icon: '📦', category: 'container' },
  { value: 'crate', label: 'Crate', icon: '📦', category: 'container' },
  { value: 'pallet', label: 'Pallet', icon: '🪵', category: 'container' },
  // Other/Custom
  { value: 'custom', label: 'Custom', icon: '✏️', category: 'other' },
];

export default {
  name: 'LocationForm',

  props: {
    location: {
      type: Object,
      default: null,
    },
    parentId: {
      type: String,
      default: null,
    },
  },

  emits: ['success', 'cancel'],

  setup(props, { emit }) {
    // Form state
    const loading = ref(false);
    const errors = reactive({
      name: '',
      type: '',
      description: '',
      customType: '',
      general: '',
    });

    // Form data
    const form = reactive({
      name: '',
      type: '',
      description: '',
      customType: '',
      icon: '',
      color: '#3B82F6',
      parentId: null,
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      },
      capacity: {
        type: 'unlimited',
        max: null,
        unit: '',
      },
    });

    // Show address section
    const showAddress = ref(false);

    // Show capacity section
    const showCapacity = ref(false);

    // Container types that support capacity configuration
    const CONTAINER_TYPES = [
      'closet', 'cabinet', 'drawer', 'shelf', 'box', 'bin', 'container',
      'drawer_cabinet', 'shelving', 'bin_rack', 'tool_chest', 'pegboard',
      'locker', 'safe', 'trunk', 'crate', 'pallet', 'storage_unit'
    ];

    // Check if current type is a container
    const isContainerType = computed(() => {
      return CONTAINER_TYPES.includes(form.type);
    });

    // Is edit mode
    const isEditMode = computed(() => !!props.location);

    // Initialize form
    const initForm = () => {
      if (props.location) {
        form.name = props.location.name || '';
        form.type = props.location.type || '';
        form.description = props.location.description || '';
        form.customType = props.location.customType || '';
        form.icon = props.location.icon || '';
        form.color = props.location.color || '#3B82F6';
        form.parentId = props.location.parentId || null;
        if (props.location.address) {
          form.address = { ...props.location.address };
          showAddress.value = Object.values(props.location.address).some(v => v);
        }
        if (props.location.capacity) {
          form.capacity = {
            type: props.location.capacity.type || 'unlimited',
            max: props.location.capacity.max || null,
            unit: props.location.capacity.unit || '',
          };
          showCapacity.value = props.location.capacity.type !== 'unlimited';
        }
      } else {
        form.parentId = props.parentId || null;
      }
    };

    // Watch for prop changes
    watch(() => props.location, initForm, { immediate: true });
    watch(() => props.parentId, (val) => {
      if (!props.location) {
        form.parentId = val;
      }
    });

    // Get type info
    const getTypeInfo = (typeValue) => {
      return LOCATION_TYPES.find(t => t.value === typeValue);
    };

    // Selected type info
    const selectedTypeInfo = computed(() => getTypeInfo(form.type));

    // Update icon when type changes
    watch(() => form.type, (newType) => {
      const typeInfo = getTypeInfo(newType);
      if (typeInfo && !form.icon) {
        form.icon = typeInfo.icon;
      }
    });

    // Grouped types for display
    const groupedTypes = computed(() => {
      const groups = {
        property: { label: 'Properties', types: [] },
        room: { label: 'Rooms', types: [] },
        container: { label: 'Containers', types: [] },
        other: { label: 'Other', types: [] },
      };
      LOCATION_TYPES.forEach(type => {
        groups[type.category].types.push(type);
      });
      return groups;
    });

    // Validation
    const validate = () => {
      let isValid = true;
      errors.name = '';
      errors.type = '';
      errors.description = '';
      errors.customType = '';
      errors.general = '';

      if (!form.name.trim()) {
        errors.name = 'Name is required';
        isValid = false;
      } else if (form.name.length > 100) {
        errors.name = 'Name cannot exceed 100 characters';
        isValid = false;
      }

      if (!form.type) {
        errors.type = 'Please select a type';
        isValid = false;
      }

      if (form.type === 'custom' && !form.customType.trim()) {
        errors.customType = 'Please specify the custom type';
        isValid = false;
      }

      if (form.description && form.description.length > 500) {
        errors.description = 'Description cannot exceed 500 characters';
        isValid = false;
      }

      return isValid;
    };

    // Submit form
    const handleSubmit = async () => {
      if (!validate()) return;

      loading.value = true;
      errors.general = '';

      try {
        const data = {
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim() || undefined,
          customType: form.type === 'custom' ? form.customType.trim() : undefined,
          icon: form.icon || undefined,
          color: form.color || undefined,
          parentId: form.parentId || undefined,
        };

        // Include address if any field is filled
        if (showAddress.value) {
          const hasAddress = Object.values(form.address).some(v => v && v.trim());
          if (hasAddress) {
            data.address = {};
            Object.entries(form.address).forEach(([key, value]) => {
              if (value && value.trim()) {
                data.address[key] = value.trim();
              }
            });
          }
        }

        // Include capacity for container types
        if (isContainerType.value && form.capacity.type !== 'unlimited') {
          data.capacity = {
            type: form.capacity.type,
            max: form.capacity.max ? parseInt(form.capacity.max, 10) : undefined,
          };
        } else if (isContainerType.value) {
          data.capacity = { type: 'unlimited' };
        }

        let response;
        if (isEditMode.value) {
          response = await window.api.locations.update(props.location._id, data);
        } else {
          response = await window.api.locations.create(data);
        }

        if (window.store) {
          window.store.success(isEditMode.value ? 'Location updated' : 'Location created');
        }

        emit('success', response.data.location);
      } catch (error) {
        console.error('Location form error:', error);
        if (error.code === 'VALIDATION_ERROR' && error.details) {
          error.details.forEach(detail => {
            if (errors.hasOwnProperty(detail.field)) {
              errors[detail.field] = detail.message;
            }
          });
        } else {
          errors.general = error.message || 'Failed to save location';
        }
      } finally {
        loading.value = false;
      }
    };

    // Cancel
    const handleCancel = () => {
      emit('cancel');
    };

    return {
      form,
      errors,
      loading,
      showAddress,
      showCapacity,
      isEditMode,
      isContainerType,
      selectedTypeInfo,
      groupedTypes,
      LOCATION_TYPES,
      getTypeInfo,
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

      <!-- Name Field -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Location Name *
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          :class="['input', errors.name ? 'border-red-500' : '']"
          placeholder="e.g., My House, Garage, Tool Cabinet"
        />
        <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
      </div>

      <!-- Type Selector -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Location Type *
        </label>
        <div class="space-y-4">
          <div v-for="(group, key) in groupedTypes" :key="key" class="space-y-2">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ group.label }}</p>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              <button
                v-for="type in group.types"
                :key="type.value"
                type="button"
                @click="form.type = type.value"
                :class="[
                  'p-2 rounded-lg border-2 text-center transition-all',
                  form.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <span class="text-xl block">{{ type.icon }}</span>
                <span class="text-xs text-gray-700">{{ type.label }}</span>
              </button>
            </div>
          </div>
        </div>
        <p v-if="errors.type" class="mt-1 text-sm text-red-600">{{ errors.type }}</p>
      </div>

      <!-- Custom Type (if custom selected) -->
      <div v-if="form.type === 'custom'">
        <label for="customType" class="block text-sm font-medium text-gray-700 mb-1">
          Custom Type Name *
        </label>
        <input
          id="customType"
          v-model="form.customType"
          type="text"
          :class="['input', errors.customType ? 'border-red-500' : '']"
          placeholder="e.g., Wine Cellar, Craft Room"
        />
        <p v-if="errors.customType" class="mt-1 text-sm text-red-600">{{ errors.customType }}</p>
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="2"
          :class="['input', errors.description ? 'border-red-500' : '']"
          placeholder="Optional description..."
        ></textarea>
        <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
        <p class="mt-1 text-xs text-gray-500">{{ form.description?.length || 0 }}/500</p>
      </div>

      <!-- Icon and Color Row -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Icon -->
        <div>
          <label for="icon" class="block text-sm font-medium text-gray-700 mb-1">
            Icon
          </label>
          <input
            id="icon"
            v-model="form.icon"
            type="text"
            class="input"
            placeholder="🏠"
          />
          <p class="mt-1 text-xs text-gray-500">Emoji or icon name</p>
        </div>

        <!-- Color -->
        <div>
          <label for="color" class="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div class="flex gap-2">
            <input
              id="color"
              v-model="form.color"
              type="color"
              class="h-10 w-14 rounded border border-gray-300 cursor-pointer"
            />
            <input
              v-model="form.color"
              type="text"
              class="input flex-1"
              placeholder="#3B82F6"
            />
          </div>
        </div>
      </div>

      <!-- Address Section (Collapsible) -->
      <div>
        <button
          type="button"
          @click="showAddress = !showAddress"
          class="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg
            :class="['w-4 h-4 mr-1 transition-transform', showAddress ? 'rotate-90' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          Address (optional)
        </button>

        <div v-if="showAddress" class="mt-3 space-y-3 pl-5 border-l-2 border-gray-200">
          <input
            v-model="form.address.street"
            type="text"
            class="input"
            placeholder="Street address"
          />
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="form.address.city"
              type="text"
              class="input"
              placeholder="City"
            />
            <input
              v-model="form.address.state"
              type="text"
              class="input"
              placeholder="State"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="form.address.zip"
              type="text"
              class="input"
              placeholder="ZIP code"
            />
            <input
              v-model="form.address.country"
              type="text"
              class="input"
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <!-- Capacity Configuration (for container types) -->
      <div v-if="isContainerType">
        <button
          type="button"
          @click="showCapacity = !showCapacity"
          class="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg
            :class="['w-4 h-4 mr-1 transition-transform', showCapacity ? 'rotate-90' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          Capacity Configuration
        </button>

        <div v-if="showCapacity" class="mt-3 space-y-4 pl-5 border-l-2 border-gray-200">
          <!-- Capacity Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Capacity Type</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                @click="form.capacity.type = 'unlimited'"
                :class="[
                  'p-2 rounded-lg border-2 text-center transition-all text-sm',
                  form.capacity.type === 'unlimited'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <span class="block text-lg">∞</span>
                <span class="text-xs">Unlimited</span>
              </button>
              <button
                type="button"
                @click="form.capacity.type = 'slots'"
                :class="[
                  'p-2 rounded-lg border-2 text-center transition-all text-sm',
                  form.capacity.type === 'slots'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <span class="block text-lg">🔢</span>
                <span class="text-xs">Slots</span>
              </button>
              <button
                type="button"
                @click="form.capacity.type = 'volume'"
                :class="[
                  'p-2 rounded-lg border-2 text-center transition-all text-sm',
                  form.capacity.type === 'volume'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <span class="block text-lg">📦</span>
                <span class="text-xs">Volume</span>
              </button>
            </div>
          </div>

          <!-- Max Capacity (only for slots/volume) -->
          <div v-if="form.capacity.type !== 'unlimited'" class="grid grid-cols-2 gap-3">
            <div>
              <label for="capacityMax" class="block text-sm font-medium text-gray-700 mb-1">
                Maximum Capacity
              </label>
              <input
                id="capacityMax"
                v-model.number="form.capacity.max"
                type="number"
                min="1"
                class="input"
                :placeholder="form.capacity.type === 'slots' ? 'e.g., 10' : 'e.g., 100'"
              />
            </div>
            <div>
              <label for="capacityUnit" class="block text-sm font-medium text-gray-700 mb-1">
                Unit (optional)
              </label>
              <input
                id="capacityUnit"
                v-model="form.capacity.unit"
                type="text"
                class="input"
                :placeholder="form.capacity.type === 'slots' ? 'e.g., drawers' : 'e.g., cubic ft'"
              />
            </div>
          </div>

          <!-- Capacity Description -->
          <p class="text-xs text-gray-500">
            <span v-if="form.capacity.type === 'unlimited'">
              This container has no capacity limit.
            </span>
            <span v-else-if="form.capacity.type === 'slots'">
              Track fixed number of slots (e.g., drawer slots, shelf spaces).
            </span>
            <span v-else>
              Track by volume or size (e.g., cubic feet, liters).
            </span>
          </p>
        </div>
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
            Saving...
          </span>
          <span v-else>{{ isEditMode ? 'Update Location' : 'Create Location' }}</span>
        </button>
      </div>
    </form>
  `,
};

export { LOCATION_TYPES };
