/**
 * AnalyticsWidget Component
 * Dashboard widget showing key inventory statistics
 */

const { ref, computed, onMounted } = Vue;

export default {
  name: 'AnalyticsWidget',

  emits: ['view-details'],

  setup(props, { emit }) {
    const loading = ref(true);
    const error = ref(null);
    const overview = ref(null);

    // Fetch overview stats
    const fetchOverview = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.analytics.getOverview();
        overview.value = response.data.overview;
      } catch (err) {
        console.error('Failed to fetch analytics overview:', err);
        error.value = err.message || 'Failed to load analytics';
      } finally {
        loading.value = false;
      }
    };

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // Format number with commas
    const formatNumber = (num) => {
      return new Intl.NumberFormat('en-US').format(num);
    };

    // View full analytics
    const viewDetails = () => {
      emit('view-details');
    };

    onMounted(() => {
      fetchOverview();
    });

    return {
      loading,
      error,
      overview,
      formatCurrency,
      formatNumber,
      viewDetails,
      fetchOverview,
    };
  },

  template: `
    <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xl">📊</span>
          <h3 class="font-semibold text-gray-900">Inventory Overview</h3>
        </div>
        <button
          @click="viewDetails"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-6">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-4">
        <p class="text-red-600 text-sm mb-2">{{ error }}</p>
        <button @click="fetchOverview" class="text-sm text-blue-600 hover:underline">
          Try again
        </button>
      </div>

      <!-- Stats Grid -->
      <div v-else-if="overview" class="grid grid-cols-2 gap-3">
        <!-- Total Items -->
        <div class="bg-blue-50 rounded-lg p-3">
          <p class="text-2xl font-bold text-blue-700">{{ formatNumber(overview.totalItems) }}</p>
          <p class="text-xs text-blue-600">Total Items</p>
        </div>

        <!-- Total Value -->
        <div class="bg-green-50 rounded-lg p-3">
          <p class="text-2xl font-bold text-green-700">{{ formatCurrency(overview.totalValue) }}</p>
          <p class="text-xs text-green-600">Total Value</p>
        </div>

        <!-- Locations -->
        <div class="bg-purple-50 rounded-lg p-3">
          <p class="text-2xl font-bold text-purple-700">{{ formatNumber(overview.locationCount) }}</p>
          <p class="text-xs text-purple-600">Locations</p>
        </div>

        <!-- Perishables -->
        <div class="bg-amber-50 rounded-lg p-3">
          <p class="text-2xl font-bold text-amber-700">{{ formatNumber(overview.perishableCount) }}</p>
          <p class="text-xs text-amber-600">Perishables</p>
        </div>
      </div>

      <!-- Quick Stats Bar -->
      <div v-if="overview" class="mt-4 flex items-center justify-between text-xs">
        <div class="flex items-center gap-1" :class="overview.lowStockCount > 0 ? 'text-orange-600' : 'text-gray-500'">
          <span>📉</span>
          <span>{{ overview.lowStockCount }} low stock</span>
        </div>
        <div class="flex items-center gap-1" :class="overview.expiringSoonCount > 0 ? 'text-yellow-600' : 'text-gray-500'">
          <span>⏳</span>
          <span>{{ overview.expiringSoonCount }} expiring soon</span>
        </div>
        <div class="flex items-center gap-1" :class="overview.expiredCount > 0 ? 'text-red-600' : 'text-gray-500'">
          <span>⚠️</span>
          <span>{{ overview.expiredCount }} expired</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-6 text-gray-500">
        <p class="text-sm">No inventory data yet</p>
        <p class="text-xs mt-1">Add items to see statistics</p>
      </div>
    </div>
  `,
};
