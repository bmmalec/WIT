/**
 * SearchFilters Component
 * Filter buttons for search results - location, category, expiration, storage
 */

const { ref, computed, onMounted, watch } = Vue;

// Expiration status options
const EXPIRATION_OPTIONS = [
  { value: null, label: 'All Items', icon: '📦' },
  { value: 'expired', label: 'Expired', icon: '🔴' },
  { value: 'expiring', label: 'Expiring Soon', icon: '🟡' },
  { value: 'fresh', label: 'Fresh', icon: '🟢' },
  { value: 'perishable', label: 'All Perishable', icon: '🍎' },
];

// Storage type options
const STORAGE_OPTIONS = [
  { value: null, label: 'All Storage', icon: '📍' },
  { value: 'pantry', label: 'Pantry', icon: '🏠' },
  { value: 'refrigerated', label: 'Fridge', icon: '❄️' },
  { value: 'frozen', label: 'Frozen', icon: '🧊' },
];

export default {
  name: 'SearchFilters',

  props: {
    locations: {
      type: Array,
      default: () => [],
    },
    categories: {
      type: Array,
      default: () => [],
    },
    filters: {
      type: Object,
      default: () => ({
        locationId: null,
        categoryId: null,
        expirationStatus: null,
        storageType: null,
      }),
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:filters', 'change'],

  setup(props, { emit }) {
    // Flatten categories for dropdown
    const flatCategories = computed(() => {
      const result = [{ _id: null, name: 'All Categories', icon: '📁' }];

      const flatten = (cats, depth = 0) => {
        for (const cat of cats) {
          result.push({
            ...cat,
            name: depth > 0 ? `${'  '.repeat(depth)}${cat.name}` : cat.name,
            depth,
          });
          if (cat.subcategories && cat.subcategories.length > 0) {
            flatten(cat.subcategories, depth + 1);
          }
        }
      };

      flatten(props.categories);
      return result;
    });

    // Flatten locations for dropdown
    const flatLocations = computed(() => {
      const result = [{ _id: null, name: 'All Locations', icon: '📍' }];

      const flatten = (locs, depth = 0) => {
        for (const loc of locs) {
          result.push({
            ...loc,
            name: depth > 0 ? `${'  '.repeat(depth)}${loc.name}` : loc.name,
            depth,
          });
          if (loc.children && loc.children.length > 0) {
            flatten(loc.children, depth + 1);
          }
        }
      };

      flatten(props.locations);
      return result;
    });

    // Active filters count
    const activeFiltersCount = computed(() => {
      let count = 0;
      if (props.filters.locationId) count++;
      if (props.filters.categoryId) count++;
      if (props.filters.expirationStatus) count++;
      if (props.filters.storageType) count++;
      return count;
    });

    // Update a single filter
    const updateFilter = (key, value) => {
      const newFilters = { ...props.filters, [key]: value };
      emit('update:filters', newFilters);
      emit('change', newFilters);
    };

    // Clear all filters
    const clearFilters = () => {
      const newFilters = {
        locationId: null,
        categoryId: null,
        expirationStatus: null,
        storageType: null,
      };
      emit('update:filters', newFilters);
      emit('change', newFilters);
    };

    // Get selected location name
    const selectedLocationName = computed(() => {
      if (!props.filters.locationId) return 'All Locations';
      const loc = flatLocations.value.find(l => l._id === props.filters.locationId);
      return loc?.name || 'All Locations';
    });

    // Get selected category name
    const selectedCategoryName = computed(() => {
      if (!props.filters.categoryId) return 'All Categories';
      const cat = flatCategories.value.find(c => c._id === props.filters.categoryId);
      return cat?.name || 'All Categories';
    });

    return {
      EXPIRATION_OPTIONS,
      STORAGE_OPTIONS,
      flatCategories,
      flatLocations,
      activeFiltersCount,
      updateFilter,
      clearFilters,
      selectedLocationName,
      selectedCategoryName,
    };
  },

  template: `
    <div :class="['flex flex-wrap gap-2', compact ? 'items-center' : 'items-start']">
      <!-- Location Filter -->
      <div class="relative">
        <select
          :value="filters.locationId || ''"
          @change="updateFilter('locationId', $event.target.value || null)"
          class="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 cursor-pointer hover:border-gray-400 transition-colors"
          :class="{ 'border-blue-500 bg-blue-50': filters.locationId }"
        >
          <option
            v-for="loc in flatLocations"
            :key="loc._id || 'all'"
            :value="loc._id || ''"
          >
            {{ loc.icon }} {{ loc.name }}
          </option>
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="relative">
        <select
          :value="filters.categoryId || ''"
          @change="updateFilter('categoryId', $event.target.value || null)"
          class="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 cursor-pointer hover:border-gray-400 transition-colors"
          :class="{ 'border-blue-500 bg-blue-50': filters.categoryId }"
        >
          <option
            v-for="cat in flatCategories"
            :key="cat._id || 'all'"
            :value="cat._id || ''"
          >
            {{ cat.icon }} {{ cat.name }}
          </option>
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>

      <!-- Expiration Status Filter -->
      <div class="flex items-center gap-1">
        <button
          v-for="opt in EXPIRATION_OPTIONS"
          :key="opt.value || 'all'"
          @click="updateFilter('expirationStatus', opt.value)"
          :class="[
            'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
            filters.expirationStatus === opt.value
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          ]"
          :title="opt.label"
        >
          <span class="hidden sm:inline">{{ opt.icon }} {{ opt.label }}</span>
          <span class="sm:hidden">{{ opt.icon }}</span>
        </button>
      </div>

      <!-- Storage Type Filter (only show if expiration filter is active) -->
      <div v-if="filters.expirationStatus" class="flex items-center gap-1">
        <span class="text-gray-400 text-xs mx-1">|</span>
        <button
          v-for="opt in STORAGE_OPTIONS"
          :key="opt.value || 'all'"
          @click="updateFilter('storageType', opt.value)"
          :class="[
            'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
            filters.storageType === opt.value
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          ]"
          :title="opt.label"
        >
          <span class="hidden sm:inline">{{ opt.icon }} {{ opt.label }}</span>
          <span class="sm:hidden">{{ opt.icon }}</span>
        </button>
      </div>

      <!-- Clear Filters -->
      <button
        v-if="activeFiltersCount > 0"
        @click="clearFilters"
        class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Clear ({{ activeFiltersCount }})
      </button>
    </div>
  `,
};
