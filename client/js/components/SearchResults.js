/**
 * SearchResults Component
 * Displays search results with item details and location path
 */

const { ref, computed } = Vue;

export default {
  name: 'SearchResults',

  props: {
    results: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    query: {
      type: String,
      default: '',
    },
    show: {
      type: Boolean,
      default: false,
    },
    suggestions: {
      type: Array,
      default: () => [],
    },
    fuzzyMatches: {
      type: Number,
      default: 0,
    },
    synonymsUsed: {
      type: Array,
      default: () => [],
    },
    searchMethod: {
      type: String,
      default: 'text',
    },
  },

  emits: ['select', 'close', 'search'],

  setup(props, { emit }) {
    const selectedIndex = ref(-1);

    // Get item type icon
    const getItemTypeIcon = (itemType) => {
      const icons = {
        tool: '🔧',
        supply: '📦',
        part: '⚙️',
        consumable: '🧴',
        equipment: '🖥️',
        other: '📋',
      };
      return icons[itemType] || '📋';
    };

    // Get storage type icon
    const getStorageIcon = (storageType) => {
      const icons = {
        pantry: '🏠',
        refrigerated: '❄️',
        frozen: '🧊',
      };
      return icons[storageType] || null;
    };

    // Format quantity display
    const formatQuantity = (item) => {
      if (!item.quantity) return '';
      const value = item.quantity.value ?? 1;
      const unit = item.quantity.unit || 'each';
      if (unit === 'each' && value === 1) return '';
      return `${value} ${unit}`;
    };

    // Check if item is low stock
    const isLowStock = (item) => {
      if (!item.quantity?.minAlert) return false;
      return item.quantity.value <= item.quantity.minAlert;
    };

    // Handle item selection
    const handleSelect = (item) => {
      emit('select', item);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
      emit('search', suggestion);
    };

    // Handle keyboard navigation
    const handleKeydown = (e) => {
      if (!props.show || props.results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndex.value = Math.min(selectedIndex.value + 1, props.results.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex.value >= 0) {
            handleSelect(props.results[selectedIndex.value]);
          }
          break;
        case 'Escape':
          emit('close');
          break;
      }
    };

    return {
      selectedIndex,
      getItemTypeIcon,
      getStorageIcon,
      formatQuantity,
      isLowStock,
      handleSelect,
      handleSuggestionClick,
      handleKeydown,
    };
  },

  template: `
    <div
      v-if="show"
      class="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden z-50"
      @keydown="handleKeydown"
    >
      <!-- Loading State -->
      <div v-if="loading" class="p-4 flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-500">Searching...</span>
      </div>

      <!-- No Results -->
      <div v-else-if="results.length === 0 && query" class="p-6 text-center">
        <div class="text-3xl mb-2">🔍</div>
        <p class="text-gray-600 font-medium">No items found</p>
        <p class="text-sm text-gray-500 mt-1">
          Try different keywords or check spelling
        </p>

        <!-- Did you mean? suggestions -->
        <div v-if="suggestions.length > 0" class="mt-4 pt-4 border-t">
          <p class="text-sm text-gray-500 mb-2">Did you mean?</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              @click="handleSuggestionClick(suggestion)"
              class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- Results List -->
      <div v-else class="overflow-y-auto max-h-80">
        <div class="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
          <div class="flex items-center justify-between">
            <span>
              {{ results.length }} result{{ results.length !== 1 ? 's' : '' }} for "{{ query }}"
            </span>
            <span v-if="fuzzyMatches > 0" class="text-blue-600">
              +{{ fuzzyMatches }} similar match{{ fuzzyMatches !== 1 ? 'es' : '' }}
            </span>
          </div>
          <div v-if="synonymsUsed.length > 0" class="mt-1 text-purple-600">
            Also searching: {{ synonymsUsed.slice(0, 5).join(', ') }}<span v-if="synonymsUsed.length > 5">...</span>
          </div>
        </div>

        <div
          v-for="(item, index) in results"
          :key="item._id"
          @click="handleSelect(item)"
          :class="[
            'flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors',
            index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
          ]"
        >
          <!-- Item Image or Icon -->
          <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              v-if="item.images && item.images.length > 0"
              :src="item.images.find(i => i.isPrimary)?.thumbnailUrl || item.images[0]?.thumbnailUrl || item.images[0]?.url"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-2xl">{{ getItemTypeIcon(item.itemType) }}</span>
          </div>

          <!-- Item Details -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h4 class="font-medium text-gray-900 truncate">{{ item.name }}</h4>
                <p class="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <span v-if="item.brand" class="truncate">{{ item.brand }}</span>
                  <span v-if="item.brand && item.model">·</span>
                  <span v-if="item.model" class="truncate">{{ item.model }}</span>
                </p>
              </div>

              <!-- Quantity Badge -->
              <div v-if="formatQuantity(item)" class="flex-shrink-0">
                <span
                  :class="[
                    'text-xs px-2 py-0.5 rounded-full',
                    isLowStock(item) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ formatQuantity(item) }}
                </span>
              </div>
            </div>

            <!-- Location Path -->
            <div class="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="truncate">
                <span v-if="item.locationId?.icon">{{ item.locationId.icon }}</span>
                {{ item.locationId?.name || 'Unknown location' }}
              </span>

              <!-- Storage Type -->
              <span v-if="item.perishable?.storageType" class="ml-1">
                {{ getStorageIcon(item.perishable.storageType) }}
              </span>

              <!-- Category -->
              <span v-if="item.categoryId" class="ml-1 text-gray-400">
                · {{ item.categoryId.icon }} {{ item.categoryId.name }}
              </span>
            </div>

            <!-- Tags Preview -->
            <div v-if="item.tags && item.tags.length > 0" class="flex items-center gap-1 mt-1.5">
              <span
                v-for="tag in item.tags.slice(0, 3)"
                :key="tag"
                class="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded"
              >
                {{ tag }}
              </span>
              <span v-if="item.tags.length > 3" class="text-xs text-gray-400">
                +{{ item.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="results.length > 0" class="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
        <span>
          <kbd class="px-1 py-0.5 bg-white border rounded text-xs">↑</kbd>
          <kbd class="px-1 py-0.5 bg-white border rounded text-xs ml-1">↓</kbd>
          to navigate
        </span>
        <span>
          <kbd class="px-1 py-0.5 bg-white border rounded text-xs">Enter</kbd>
          to select
        </span>
      </div>
    </div>
  `,
};
