/**
 * Breadcrumb Component
 * Shows the full path to a location with clickable segments
 */

const { computed } = Vue;

export default {
  name: 'Breadcrumb',

  props: {
    // Array of ancestor locations [{ _id, name, type }, ...]
    ancestors: {
      type: Array,
      default: () => [],
    },
    // Current location (shown at the end, not clickable)
    current: {
      type: Object,
      default: null,
    },
    // Show home link at start
    showHome: {
      type: Boolean,
      default: true,
    },
    // Maximum number of items to show before collapsing
    maxItems: {
      type: Number,
      default: 4,
    },
  },

  emits: ['navigate', 'home'],

  setup(props, { emit }) {
    // Determine if we need to collapse middle items
    const shouldCollapse = computed(() => {
      const totalItems = props.ancestors.length + (props.current ? 1 : 0);
      return totalItems > props.maxItems;
    });

    // Get visible items (with collapse logic)
    const visibleItems = computed(() => {
      if (!shouldCollapse.value) {
        return props.ancestors.map((item, index) => ({
          ...item,
          isCollapsed: false,
          index,
        }));
      }

      // Show first item, ellipsis, and last (maxItems - 2) items
      const items = [];
      const ancestors = props.ancestors;

      if (ancestors.length > 0) {
        // First ancestor
        items.push({ ...ancestors[0], isCollapsed: false, index: 0 });

        // Collapsed indicator
        if (ancestors.length > 2) {
          items.push({
            _id: 'collapsed',
            name: '...',
            isCollapsed: true,
            collapsedItems: ancestors.slice(1, -1),
          });
        }

        // Last ancestors (excluding current)
        if (ancestors.length > 1) {
          items.push({
            ...ancestors[ancestors.length - 1],
            isCollapsed: false,
            index: ancestors.length - 1,
          });
        }
      }

      return items;
    });

    // Handle navigation to an ancestor
    const handleNavigate = (item) => {
      if (!item.isCollapsed) {
        emit('navigate', item);
      }
    };

    // Handle home click
    const handleHome = () => {
      emit('home');
    };

    return {
      shouldCollapse,
      visibleItems,
      handleNavigate,
      handleHome,
    };
  },

  template: `
    <nav class="flex items-center text-sm" aria-label="Breadcrumb">
      <ol class="flex items-center flex-wrap gap-1">
        <!-- Home Link -->
        <li v-if="showHome" class="flex items-center">
          <button
            @click="handleHome"
            class="text-gray-500 hover:text-blue-600 transition-colors flex items-center"
            title="Go to Dashboard"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </button>
        </li>

        <!-- Separator after Home -->
        <li v-if="showHome && (visibleItems.length > 0 || current)" class="flex items-center text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </li>

        <!-- Ancestor Items -->
        <template v-for="(item, idx) in visibleItems" :key="item._id">
          <li class="flex items-center">
            <!-- Collapsed indicator with dropdown -->
            <template v-if="item.isCollapsed">
              <div class="relative group">
                <button
                  class="px-2 py-0.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                  title="Show hidden locations"
                >
                  {{ item.name }}
                </button>
                <!-- Dropdown for collapsed items -->
                <div class="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[150px]">
                  <button
                    v-for="collapsed in item.collapsedItems"
                    :key="collapsed._id"
                    @click="handleNavigate(collapsed)"
                    class="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {{ collapsed.name }}
                  </button>
                </div>
              </div>
            </template>

            <!-- Regular ancestor link -->
            <template v-else>
              <button
                @click="handleNavigate(item)"
                class="px-2 py-0.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors truncate max-w-[150px]"
                :title="item.name"
              >
                {{ item.name }}
              </button>
            </template>
          </li>

          <!-- Separator -->
          <li class="flex items-center text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </li>
        </template>

        <!-- Current Location (not clickable) -->
        <li v-if="current" class="flex items-center">
          <span class="px-2 py-0.5 font-medium text-gray-900 truncate max-w-[200px]" :title="current.name">
            {{ current.name }}
          </span>
        </li>
      </ol>
    </nav>
  `,
};
