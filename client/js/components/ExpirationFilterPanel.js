/**
 * ExpirationFilterPanel Component
 * Displays items grouped by expiration status with color-coded period indicators
 */

import { getCurrentPeriod, getPeriodConfig, generatePeriodSchedule, formatPeriodLabel, formatDateRange, getPeriodStyle } from '../utils/expirationPeriods.js';

const { ref, computed, onMounted, watch } = Vue;

// Storage types
const STORAGE_TYPES = [
  { value: 'pantry', label: 'Pantry', icon: '🏠' },
  { value: 'refrigerated', label: 'Fridge', icon: '❄️' },
  { value: 'frozen', label: 'Frozen', icon: '🧊' },
];

export default {
  name: 'ExpirationFilterPanel',

  props: {
    show: {
      type: Boolean,
      default: false,
    },
    initialFilter: {
      type: String,
      default: null, // 'expired', 'current', 'future', or null for 'all'
    },
  },

  emits: ['close', 'item-click'],

  setup(props, { emit }) {
    const loading = ref(true);
    const error = ref(null);
    const items = ref([]);
    const counts = ref({ total: 0, expired: 0, current: 0, future: 0 });
    const selectedFilter = ref('all'); // 'all', 'expired', 'current', 'future', or period index
    const selectedPeriodIndex = ref(null);
    const selectedStorageType = ref(null); // 'pantry', 'refrigerated', 'frozen', or null for all
    const processingAction = ref(null); // Item ID being processed

    // Get user settings
    const user = computed(() => window.store?.state?.user);
    const expirationSettings = computed(() => user.value?.settings?.expirationPeriod || {
      periodType: 'quarterly',
      startDate: new Date(new Date().getFullYear(), 0, 1),
      colorScheme: [
        { color: '#EF4444', name: 'Red' },
        { color: '#F97316', name: 'Orange' },
        { color: '#EAB308', name: 'Yellow' },
        { color: '#22C55E', name: 'Green' },
        { color: '#3B82F6', name: 'Blue' },
        { color: '#8B5CF6', name: 'Purple' },
      ],
    });

    // Current period info
    const currentPeriod = computed(() => {
      return getCurrentPeriod(expirationSettings.value);
    });

    // Whether to use patterns
    const usePatterns = computed(() => {
      return expirationSettings.value.usePatterns || false;
    });

    // Get style for current period indicator
    const currentPeriodStyleObj = computed(() => {
      if (!currentPeriod.value) return {};
      return getPeriodStyle(
        currentPeriod.value.index,
        expirationSettings.value.colorScheme,
        usePatterns.value
      );
    });

    // Period schedule
    const periodSchedule = computed(() => {
      return generatePeriodSchedule(expirationSettings.value, 12);
    });

    // Filtered items based on selection
    const filteredItems = computed(() => {
      let result = items.value;

      // Filter by storage type first
      if (selectedStorageType.value) {
        result = result.filter(item =>
          item.perishable?.storageType === selectedStorageType.value
        );
      }

      // Then filter by status/period
      if (selectedFilter.value === 'all' && selectedPeriodIndex.value === null) {
        return result;
      }

      if (selectedPeriodIndex.value !== null) {
        return result.filter(item =>
          item.perishable?.expirationPeriodIndex === selectedPeriodIndex.value
        );
      }

      return result.filter(item => item.expirationStatus === selectedFilter.value);
    });

    // Get period color for item
    const getItemPeriodColor = (item) => {
      const idx = item.perishable?.expirationPeriodIndex;
      if (idx === null || idx === undefined) return '#9CA3AF';
      const colorIdx = idx % expirationSettings.value.colorScheme.length;
      return expirationSettings.value.colorScheme[colorIdx]?.color || '#9CA3AF';
    };

    // Get period style for item (with pattern support)
    const getItemPeriodStyle = (item) => {
      const idx = item.perishable?.expirationPeriodIndex;
      if (idx === null || idx === undefined) {
        return { backgroundColor: '#9CA3AF' };
      }
      return getPeriodStyle(
        idx,
        expirationSettings.value.colorScheme,
        usePatterns.value
      );
    };

    // Get period button style
    const getPeriodButtonStyle = (periodIndex) => {
      return getPeriodStyle(
        periodIndex,
        expirationSettings.value.colorScheme,
        usePatterns.value
      );
    };

    // Fetch expiring items
    const fetchItems = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.items.getByExpirationStatus({
          status: 'all',
          currentPeriodIndex: currentPeriod.value.index,
        });

        items.value = response.data.items || [];
        counts.value = response.data.counts || { total: 0, expired: 0, current: 0, future: 0 };
      } catch (err) {
        console.error('Failed to fetch expiring items:', err);
        error.value = err.message || 'Failed to load expiring items';
      } finally {
        loading.value = false;
      }
    };

    // Filter by status
    const filterByStatus = (status) => {
      selectedFilter.value = status;
      selectedPeriodIndex.value = null;
    };

    // Filter by period index
    const filterByPeriod = (index) => {
      selectedPeriodIndex.value = index;
      selectedFilter.value = 'period';
    };

    // Filter by storage type
    const filterByStorageType = (type) => {
      selectedStorageType.value = selectedStorageType.value === type ? null : type;
    };

    // Handle item click
    const handleItemClick = (item) => {
      emit('item-click', item);
    };

    // Mark item as consumed
    const handleConsume = async (item) => {
      if (processingAction.value) return;

      processingAction.value = item._id;
      try {
        await window.api.items.consume(item._id);
        window.store?.success(`"${item.name}" marked as consumed`);
        // Refresh the list
        await fetchItems();
      } catch (err) {
        console.error('Failed to consume item:', err);
        window.store?.error(err.message || 'Failed to mark item as consumed');
      } finally {
        processingAction.value = null;
      }
    };

    // Mark item as discarded
    const handleDiscard = async (item) => {
      if (processingAction.value) return;

      processingAction.value = item._id;
      try {
        await window.api.items.discard(item._id);
        window.store?.success(`"${item.name}" marked as discarded`);
        // Refresh the list
        await fetchItems();
      } catch (err) {
        console.error('Failed to discard item:', err);
        window.store?.error(err.message || 'Failed to mark item as discarded');
      } finally {
        processingAction.value = null;
      }
    };

    // Close panel
    const close = () => {
      emit('close');
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
      const classes = {
        expired: 'bg-red-100 text-red-800',
        current: 'bg-yellow-100 text-yellow-800',
        future: 'bg-green-100 text-green-800',
        unknown: 'bg-gray-100 text-gray-800',
      };
      return classes[status] || classes.unknown;
    };

    // Get status label
    const getStatusLabel = (status) => {
      const labels = {
        expired: 'Expired',
        current: 'Current Period',
        future: 'Future',
        unknown: 'Unknown',
      };
      return labels[status] || status;
    };

    // Watch for show changes to fetch data and apply initial filter
    watch(() => props.show, (newVal) => {
      if (newVal) {
        // Apply initial filter if provided
        if (props.initialFilter) {
          selectedFilter.value = props.initialFilter;
          selectedPeriodIndex.value = null;
        } else {
          selectedFilter.value = 'all';
          selectedPeriodIndex.value = null;
        }
        selectedStorageType.value = null; // Reset storage type filter
        fetchItems();
      }
    }, { immediate: true });

    return {
      loading,
      error,
      items,
      counts,
      selectedFilter,
      selectedPeriodIndex,
      selectedStorageType,
      processingAction,
      currentPeriod,
      currentPeriodStyleObj,
      periodSchedule,
      filteredItems,
      expirationSettings,
      STORAGE_TYPES,
      getItemPeriodColor,
      getItemPeriodStyle,
      getPeriodButtonStyle,
      filterByStatus,
      filterByPeriod,
      filterByStorageType,
      handleItemClick,
      handleConsume,
      handleDiscard,
      close,
      getStatusBadgeClass,
      getStatusLabel,
      formatPeriodLabel,
      formatDateRange,
    };
  },

  template: `
    <div
      v-if="show"
      class="fixed inset-0 z-50 overflow-hidden"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-gray-500 bg-opacity-50 transition-opacity"
        @click="close"
      ></div>

      <!-- Panel -->
      <div class="absolute inset-y-0 right-0 max-w-full flex">
        <div class="w-screen max-w-lg">
          <div class="h-full flex flex-col bg-white shadow-xl">
            <!-- Header -->
            <div class="px-4 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Expiring Items</h2>
                <button
                  @click="close"
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Current Period Info -->
              <div class="mt-3 p-3 rounded-lg" :style="{ backgroundColor: currentPeriod.color + '20' }">
                <div class="flex items-center gap-2">
                  <div
                    class="w-4 h-4 rounded-full"
                    :style="currentPeriodStyleObj"
                  ></div>
                  <span class="font-medium" :style="{ color: currentPeriod.color }">
                    Current Period: {{ currentPeriod.label }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{{ currentPeriod.dateRange }}</p>
              </div>
            </div>

            <!-- Filter Tabs -->
            <div class="px-4 py-3 border-b border-gray-200">
              <div class="flex flex-wrap gap-2">
                <button
                  @click="filterByStatus('all')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedFilter === 'all' && selectedPeriodIndex === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  All ({{ counts.total }})
                </button>
                <button
                  @click="filterByStatus('expired')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedFilter === 'expired'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  ]"
                >
                  Expired ({{ counts.expired }})
                </button>
                <button
                  @click="filterByStatus('current')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedFilter === 'current'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  ]"
                >
                  Current ({{ counts.current }})
                </button>
                <button
                  @click="filterByStatus('future')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedFilter === 'future'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  ]"
                >
                  Future ({{ counts.future }})
                </button>
              </div>

              <!-- Period Color Selector -->
              <div class="mt-3">
                <p class="text-xs text-gray-500 mb-2">Filter by period color:</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="period in periodSchedule.slice(0, 12)"
                    :key="period.index"
                    @click="filterByPeriod(period.index)"
                    :class="[
                      'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-xs font-medium',
                      selectedPeriodIndex === period.index
                        ? 'border-gray-900 scale-110 shadow-lg'
                        : 'border-transparent hover:scale-105'
                    ]"
                    :style="getPeriodButtonStyle(period.index)"
                    :title="period.label + ' (' + period.dateRange + ')'"
                  >
                    <span v-if="period.index === currentPeriod.index" class="text-white">*</span>
                  </button>
                </div>
              </div>

              <!-- Storage Type Filter -->
              <div class="mt-3">
                <p class="text-xs text-gray-500 mb-2">Filter by storage type:</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="type in STORAGE_TYPES"
                    :key="type.value"
                    @click="filterByStorageType(type.value)"
                    :class="[
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                      selectedStorageType === type.value
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    ]"
                  >
                    <span>{{ type.icon }}</span>
                    <span>{{ type.label }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4">
              <!-- Loading -->
              <div v-if="loading" class="flex justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>

              <!-- Error -->
              <div v-else-if="error" class="text-center py-12">
                <p class="text-red-600 mb-4">{{ error }}</p>
                <button @click="fetchItems" class="btn-primary">Try Again</button>
              </div>

              <!-- Empty State -->
              <div v-else-if="filteredItems.length === 0" class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-4">📅</div>
                <p class="mb-2">No items found</p>
                <p class="text-sm">
                  {{ selectedFilter === 'all'
                    ? 'No perishable items with expiration periods assigned.'
                    : 'No items match the selected filter.'
                  }}
                </p>
              </div>

              <!-- Items List -->
              <div v-else class="space-y-3">
                <div
                  v-for="item in filteredItems"
                  :key="item._id"
                  @click="handleItemClick(item)"
                  class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div class="flex items-start gap-3">
                    <!-- Period Color Indicator -->
                    <div
                      class="w-3 h-full min-h-[4rem] rounded-full flex-shrink-0"
                      :style="getItemPeriodStyle(item)"
                    ></div>

                    <!-- Item Image/Icon -->
                    <div class="flex-shrink-0">
                      <div
                        v-if="item.images && item.images.length > 0"
                        class="w-12 h-12 rounded-lg bg-cover bg-center"
                        :style="{ backgroundImage: 'url(' + (item.images[0].thumbnailUrl || item.images[0].url) + ')' }"
                      ></div>
                      <div v-else class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xl">
                        📦
                      </div>
                    </div>

                    <!-- Item Details -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between">
                        <h4 class="font-medium text-gray-900 truncate">{{ item.name }}</h4>
                        <span
                          :class="['text-xs px-2 py-0.5 rounded-full ml-2', getStatusBadgeClass(item.expirationStatus)]"
                        >
                          {{ getStatusLabel(item.expirationStatus) }}
                        </span>
                      </div>

                      <p v-if="item.locationId" class="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <span>{{ item.locationId.icon || '📍' }}</span>
                        <span class="truncate">{{ item.locationId.name }}</span>
                      </p>

                      <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span v-if="item.perishable?.storageType" class="flex items-center gap-1">
                          {{ STORAGE_TYPES.find(t => t.value === item.perishable.storageType)?.icon }}
                          {{ STORAGE_TYPES.find(t => t.value === item.perishable.storageType)?.label }}
                        </span>
                        <span v-if="item.quantity?.value" class="flex items-center gap-1">
                          Qty: {{ item.quantity.value }} {{ item.quantity.unit }}
                        </span>
                        <span v-if="item.perishable?.expirationDate">
                          Exp: {{ new Date(item.perishable.expirationDate).toLocaleDateString() }}
                        </span>
                      </div>

                      <!-- Quick Actions -->
                      <div class="flex items-center gap-2 mt-3">
                        <button
                          @click.stop="handleConsume(item)"
                          :disabled="processingAction === item._id"
                          class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          <svg v-if="processingAction === item._id" class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                          </svg>
                          Consume
                        </button>
                        <button
                          @click.stop="handleDiscard(item)"
                          :disabled="processingAction === item._id"
                          class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          <svg v-if="processingAction === item._id" class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p class="text-xs text-gray-500 text-center">
                Click an item to view details, or use quick actions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
