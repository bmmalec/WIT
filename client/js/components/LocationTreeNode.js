/**
 * LocationTreeNode Component
 * A single node in the location tree with expand/collapse and actions
 */

const { ref, computed } = Vue;

// Default icons for location types
const TYPE_ICONS = {
  // Properties
  house: '🏠',
  apartment: '🏢',
  warehouse: '🏭',
  storage_unit: '📦',
  office: '🏢',
  vehicle: '🚗',
  boat: '⛵',
  rv: '🚐',
  // Rooms
  garage: '🚙',
  basement: '🪜',
  attic: '🏚️',
  kitchen: '🍳',
  bedroom: '🛏️',
  bathroom: '🚿',
  living_room: '🛋️',
  dining_room: '🍽️',
  office_room: '💻',
  laundry: '🧺',
  workshop: '🔧',
  utility: '🔌',
  room: '🚪',
  // Zones
  zone: '📍',
  inbound: '📥',
  outbound: '📤',
  staging: '⏳',
  receiving: '📬',
  shipping: '🚚',
  racking: '🏗️',
  floor: '⬜',
  aisle: '↔️',
  // Containers
  closet: '🚪',
  cabinet: '🗄️',
  drawer: '🗃️',
  shelf: '📚',
  box: '📦',
  bin: '🗑️',
  container: '📥',
  drawer_cabinet: '🗄️',
  shelving: '📚',
  bin_rack: '🗃️',
  tool_chest: '🧰',
  pegboard: '📌',
  locker: '🔐',
  safe: '🔒',
  trunk: '📦',
  crate: '📦',
  pallet: '🪵',
  // Other
  custom: '✏️',
};

export default {
  name: 'LocationTreeNode',

  props: {
    node: {
      type: Object,
      required: true,
    },
    depth: {
      type: Number,
      default: 0,
    },
    selectedId: {
      type: String,
      default: null,
    },
    expandedIds: {
      type: Set,
      default: () => new Set(),
    },
  },

  emits: ['select', 'toggle', 'edit', 'delete', 'add-child'],

  setup(props, { emit }) {
    // Check if node has children
    const hasChildren = computed(() => {
      return props.node.children && props.node.children.length > 0;
    });

    // Check if node is expanded
    const isExpanded = computed(() => {
      return props.expandedIds.has(props.node._id);
    });

    // Check if node is selected
    const isSelected = computed(() => {
      return props.selectedId === props.node._id;
    });

    // Get icon for location type
    const icon = computed(() => {
      return props.node.icon || TYPE_ICONS[props.node.type] || '📍';
    });

    // Calculate indentation
    const indentStyle = computed(() => {
      return {
        paddingLeft: `${props.depth * 1.5}rem`,
      };
    });

    // Handle node click
    const handleClick = () => {
      emit('select', props.node);
    };

    // Handle expand/collapse toggle
    const handleToggle = (e) => {
      e.stopPropagation();
      emit('toggle', props.node._id);
    };

    // Handle edit
    const handleEdit = (e) => {
      e.stopPropagation();
      emit('edit', props.node);
    };

    // Handle delete
    const handleDelete = (e) => {
      e.stopPropagation();
      emit('delete', props.node);
    };

    // Handle add child
    const handleAddChild = (e) => {
      e.stopPropagation();
      emit('add-child', props.node);
    };

    return {
      hasChildren,
      isExpanded,
      isSelected,
      icon,
      indentStyle,
      handleClick,
      handleToggle,
      handleEdit,
      handleDelete,
      handleAddChild,
    };
  },

  template: `
    <div class="select-none">
      <!-- Node Row -->
      <div
        @click="handleClick"
        :style="indentStyle"
        :class="[
          'flex items-center py-2 px-2 rounded-lg cursor-pointer group transition-colors',
          isSelected
            ? 'bg-blue-100 text-blue-900'
            : 'hover:bg-gray-100'
        ]"
      >
        <!-- Expand/Collapse Button -->
        <button
          v-if="hasChildren"
          @click="handleToggle"
          class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-1"
        >
          <svg
            :class="['w-4 h-4 transition-transform', isExpanded ? 'rotate-90' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div v-else class="w-6 h-6 mr-1"></div>

        <!-- Icon -->
        <span class="text-lg mr-2 flex-shrink-0">{{ icon }}</span>

        <!-- Name -->
        <span class="flex-1 truncate font-medium text-sm">{{ node.name }}</span>

        <!-- Counts -->
        <div class="flex items-center gap-2 text-xs text-gray-500 mr-2">
          <span v-if="node.childCount > 0" class="flex items-center gap-0.5" title="Sub-locations">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            {{ node.childCount }}
          </span>
          <span v-if="node.itemCount > 0" class="flex items-center gap-0.5" title="Items">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            {{ node.itemCount }}
          </span>
        </div>

        <!-- Actions (visible on hover) -->
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="handleAddChild"
            class="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
            title="Add sub-location"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
          <button
            @click="handleEdit"
            class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button
            @click="handleDelete"
            class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Children (recursive) -->
      <div v-if="hasChildren && isExpanded">
        <LocationTreeNode
          v-for="child in node.children"
          :key="child._id"
          :node="child"
          :depth="depth + 1"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @add-child="$emit('add-child', $event)"
        />
      </div>
    </div>
  `,
};
