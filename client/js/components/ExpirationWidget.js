/**
 * ExpirationWidget Component
 * Dashboard widget showing expiration status overview
 */

import { getCurrentPeriod, getPeriodStyle } from '../utils/expirationPeriods.js';

const { ref, computed, onMounted } = Vue;

export default {
  name: 'ExpirationWidget',

  emits: ['click', 'filter'],

  setup(props, { emit }) {
    const loading = ref(true);
    const error = ref(null);
    const counts = ref({
      total: 0,
      expired: 0,
      current: 0,
      future: 0,
    });

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
      const settings = expirationSettings.value;
      return getCurrentPeriod(
        settings.startDate,
        settings.periodType,
        settings.colorScheme
      );
    });

    // Whether to use patterns
    const usePatterns = computed(() => {
      return expirationSettings.value.usePatterns || false;
    });

    // Get style for period indicator with optional pattern
    const currentPeriodStyle = computed(() => {
      if (!currentPeriod.value) return {};
      return getPeriodStyle(
        currentPeriod.value.index,
        expirationSettings.value.colorScheme,
        usePatterns.value
      );
    });

    // Fetch expiration counts
    const fetchCounts = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.items.getByExpirationStatus({
          status: 'all',
          currentPeriodIndex: currentPeriod.value.index,
        });

        counts.value = response.data.counts || { total: 0, expired: 0, current: 0, future: 0 };
      } catch (err) {
        console.error('Failed to fetch expiration counts:', err);
        error.value = err.message || 'Failed to load';
      } finally {
        loading.value = false;
      }
    };

    // Handle widget click
    const handleClick = () => {
      emit('click');
    };

    // Handle section click
    const handleSectionClick = (status) => {
      emit('filter', status);
    };

    onMounted(() => {
      fetchCounts();
    });

    return {
      loading,
      error,
      counts,
      currentPeriod,
      currentPeriodStyle,
      handleClick,
      handleSectionClick,
      fetchCounts,
    };
  },

  template: `
    <div
      class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
      @click="handleClick"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span class="text-lg">📅</span>
          Expiration Status
        </h3>
        <div
          v-if="currentPeriod"
          class="flex items-center gap-1.5 text-xs"
        >
          <div
            class="w-3 h-3 rounded-full"
            :style="currentPeriodStyle"
          ></div>
          <span class="text-gray-500">{{ currentPeriod.label }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-4">
        <p class="text-sm text-red-600">{{ error }}</p>
        <button @click.stop="fetchCounts" class="text-xs text-blue-600 hover:underline mt-1">
          Retry
        </button>
      </div>

      <!-- Stats -->
      <div v-else class="space-y-2">
        <!-- Expired -->
        <div
          @click.stop="handleSectionClick('expired')"
          class="flex items-center justify-between p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
        >
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-500"></div>
            <span class="text-sm font-medium text-red-700">Expired</span>
          </div>
          <span class="text-lg font-bold text-red-600">{{ counts.expired }}</span>
        </div>

        <!-- Expiring Soon (Current Period) -->
        <div
          @click.stop="handleSectionClick('current')"
          class="flex items-center justify-between p-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
        >
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span class="text-sm font-medium text-yellow-700">Expiring Soon</span>
          </div>
          <span class="text-lg font-bold text-yellow-600">{{ counts.current }}</span>
        </div>

        <!-- Fresh (Future) -->
        <div
          @click.stop="handleSectionClick('future')"
          class="flex items-center justify-between p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
        >
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            <span class="text-sm font-medium text-green-700">Fresh</span>
          </div>
          <span class="text-lg font-bold text-green-600">{{ counts.future }}</span>
        </div>

        <!-- Total -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          <span class="text-xs text-gray-500">Total Perishables</span>
          <span class="text-sm font-medium text-gray-700">{{ counts.total }}</span>
        </div>
      </div>

      <!-- Click hint -->
      <p class="text-xs text-gray-400 text-center mt-3">
        Click to view details
      </p>
    </div>
  `,
};
