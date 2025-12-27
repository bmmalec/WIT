/**
 * LocationCard Component
 * Displays a location card with type icon, name, and counts
 */

const { computed } = Vue;

// Default icons for location types
const TYPE_ICONS = {
  house: '🏠',
  warehouse: '🏭',
  storage_unit: '📦',
  office: '🏢',
  vehicle: '🚗',
  garage: '🚙',
  basement: '🪜',
  attic: '🏚️',
  kitchen: '🍳',
  bedroom: '🛏️',
  bathroom: '🚿',
  workshop: '🔧',
  living_room: '🛋️',
  room: '🚪',
  closet: '🚪',
  cabinet: '🗄️',
  drawer: '🗃️',
  shelf: '📚',
  box: '📦',
  bin: '🗑️',
  container: '📥',
  zone: '📍',
  custom: '✏️',
};

export default {
  name: 'LocationCard',

  props: {
    location: {
      type: Object,
      required: true,
    },
  },

  emits: ['click', 'edit', 'delete'],

  setup(props, { emit }) {
    // Get display icon
    const icon = computed(() => {
      return props.location.icon || TYPE_ICONS[props.location.type] || '📍';
    });

    // Get display type label
    const typeLabel = computed(() => {
      if (props.location.type === 'custom' && props.location.customType) {
        return props.location.customType;
      }
      // Convert snake_case to Title Case
      return props.location.type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });

    // Background color style
    const colorStyle = computed(() => {
      if (props.location.color) {
        return {
          borderLeftColor: props.location.color,
          borderLeftWidth: '4px',
        };
      }
      return {};
    });

    // Handle card click
    const handleClick = () => {
      emit('click', props.location);
    };

    // Handle edit
    const handleEdit = (e) => {
      e.stopPropagation();
      emit('edit', props.location);
    };

    // Handle delete
    const handleDelete = (e) => {
      e.stopPropagation();
      emit('delete', props.location);
    };

    return {
      icon,
      typeLabel,
      colorStyle,
      handleClick,
      handleEdit,
      handleDelete,
    };
  },

  template: `
    <div
      @click="handleClick"
      :style="colorStyle"
      class="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 overflow-hidden group"
    >
      <div class="p-4">
        <!-- Header Row -->
        <div class="flex items-start justify-between mb-3">
          <!-- Icon and Name -->
          <div class="flex items-center min-w-0">
            <span class="text-2xl mr-3 flex-shrink-0">{{ icon }}</span>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ location.name }}</h3>
              <p class="text-xs text-gray-500">{{ typeLabel }}</p>
            </div>
          </div>

          <!-- Actions (visible on hover) -->
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="handleEdit"
              class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              @click="handleDelete"
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Description -->
        <p v-if="location.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
          {{ location.description }}
        </p>

        <!-- Stats Row -->
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <!-- Child Locations -->
          <div v-if="location.childCount > 0" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span>{{ location.childCount }} sub-locations</span>
          </div>

          <!-- Items -->
          <div v-if="location.itemCount > 0" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <span>{{ location.itemCount }} items</span>
          </div>

          <!-- Empty state -->
          <div v-if="location.childCount === 0 && location.itemCount === 0" class="text-gray-400">
            Empty
          </div>
        </div>
      </div>

      <!-- Address (if present) -->
      <div v-if="location.address?.city" class="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {{ location.address.city }}<span v-if="location.address.state">, {{ location.address.state }}</span>
        </span>
      </div>
    </div>
  `,
};

export { TYPE_ICONS };
