/**
 * AnalyticsPage Component
 * Full analytics dashboard with charts and insights
 */

const { ref, computed, onMounted, watch } = Vue;

export default {
  name: 'AnalyticsPage',

  setup() {
    const loading = ref(true);
    const error = ref(null);
    const timeRange = ref(30); // Days to analyze

    // Analytics data
    const overview = ref(null);
    const byCategory = ref([]);
    const byLocation = ref([]);
    const expirationForecast = ref(null);
    const consumptionTrends = ref(null);
    const storageDistribution = ref([]);
    const valueDistribution = ref([]);

    // Fetch all analytics
    const fetchAnalytics = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.analytics.getAll(timeRange.value);
        const data = response.data;

        overview.value = data.overview;
        byCategory.value = data.byCategory;
        byLocation.value = data.byLocation;
        expirationForecast.value = data.expirationForecast;
        consumptionTrends.value = data.consumptionTrends;
        storageDistribution.value = data.storageDistribution;
        valueDistribution.value = data.valueDistribution;
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
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

    // Format date
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get max value for chart scaling
    const getMaxValue = (items, key) => {
      if (!items || items.length === 0) return 1;
      return Math.max(...items.map(item => item[key] || 0), 1);
    };

    // Get percentage width for bar
    const getBarWidth = (value, max) => {
      return Math.round((value / max) * 100);
    };

    // Navigate back to dashboard
    const goBack = () => {
      window.router?.push('/dashboard');
    };

    // Watch time range changes
    watch(timeRange, () => {
      fetchAnalytics();
    });

    onMounted(() => {
      fetchAnalytics();
    });

    return {
      loading,
      error,
      timeRange,
      overview,
      byCategory,
      byLocation,
      expirationForecast,
      consumptionTrends,
      storageDistribution,
      valueDistribution,
      formatCurrency,
      formatNumber,
      formatDate,
      getMaxValue,
      getBarWidth,
      goBack,
      fetchAnalytics,
    };
  },

  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center gap-4">
              <button
                @click="goBack"
                class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
                <p class="text-sm text-gray-500">Inventory insights and trends</p>
              </div>
            </div>

            <!-- Time Range Selector -->
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600">Time range:</label>
              <select
                v-model="timeRange"
                class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option :value="7">Last 7 days</option>
                <option :value="30">Last 30 days</option>
                <option :value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
          <p class="text-red-600 mb-4">{{ error }}</p>
          <button @click="fetchAnalytics" class="btn-primary">Try Again</button>
        </div>

        <!-- Analytics Dashboard -->
        <div v-else>
          <!-- Overview Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="p-3 bg-blue-100 rounded-lg">
                  <span class="text-2xl">📦</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ formatNumber(overview?.totalItems || 0) }}</p>
                  <p class="text-sm text-gray-500">Total Items</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="p-3 bg-green-100 rounded-lg">
                  <span class="text-2xl">💰</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(overview?.totalValue || 0) }}</p>
                  <p class="text-sm text-gray-500">Total Value</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="p-3 bg-purple-100 rounded-lg">
                  <span class="text-2xl">📍</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ formatNumber(overview?.locationCount || 0) }}</p>
                  <p class="text-sm text-gray-500">Locations</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="p-3 bg-amber-100 rounded-lg">
                  <span class="text-2xl">🍎</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ formatNumber(overview?.perishableCount || 0) }}</p>
                  <p class="text-sm text-gray-500">Perishables</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Alert Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <span class="text-2xl">📉</span>
                <div>
                  <p class="text-xl font-bold text-orange-700">{{ overview?.lowStockCount || 0 }}</p>
                  <p class="text-sm text-orange-600">Low Stock Items</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <span class="text-2xl">⏳</span>
                <div>
                  <p class="text-xl font-bold text-yellow-700">{{ overview?.expiringSoonCount || 0 }}</p>
                  <p class="text-sm text-yellow-600">Expiring This Week</p>
                </div>
              </div>
            </div>

            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <span class="text-2xl">⚠️</span>
                <div>
                  <p class="text-xl font-bold text-red-700">{{ overview?.expiredCount || 0 }}</p>
                  <p class="text-sm text-red-600">Expired Items</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Items by Category -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Items by Category</h3>
              <div v-if="byCategory.length === 0" class="text-center py-8 text-gray-500">
                <p>No category data available</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="cat in byCategory.slice(0, 8)"
                  :key="cat._id"
                  class="flex items-center gap-3"
                >
                  <span class="text-xl w-8 text-center">{{ cat.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-700 truncate">{{ cat.name }}</span>
                      <span class="text-sm text-gray-500 ml-2">{{ cat.count }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all"
                        :style="{
                          width: getBarWidth(cat.count, getMaxValue(byCategory, 'count')) + '%',
                          backgroundColor: cat.color || '#3B82F6'
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items by Location -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Items by Location</h3>
              <div v-if="byLocation.length === 0" class="text-center py-8 text-gray-500">
                <p>No location data available</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="loc in byLocation.slice(0, 8)"
                  :key="loc._id"
                  class="flex items-center gap-3"
                >
                  <span class="text-xl w-8 text-center">{{ loc.icon || '📍' }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-700 truncate">{{ loc.name }}</span>
                      <span class="text-sm text-gray-500 ml-2">{{ loc.count }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div
                        class="bg-purple-500 h-2 rounded-full transition-all"
                        :style="{ width: getBarWidth(loc.count, getMaxValue(byLocation, 'count')) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Consumption Trends -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Consumption Trends</h3>

            <div v-if="!consumptionTrends || consumptionTrends.daily.length === 0" class="text-center py-8 text-gray-500">
              <p>No consumption data available for this period</p>
            </div>

            <div v-else>
              <!-- Summary Stats -->
              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="text-center p-4 bg-green-50 rounded-lg">
                  <p class="text-2xl font-bold text-green-700">{{ consumptionTrends.totals.consumed }}</p>
                  <p class="text-sm text-green-600">Used</p>
                </div>
                <div class="text-center p-4 bg-red-50 rounded-lg">
                  <p class="text-2xl font-bold text-red-700">{{ consumptionTrends.totals.discarded }}</p>
                  <p class="text-sm text-red-600">Wasted</p>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                  <p class="text-2xl font-bold" :class="consumptionTrends.totals.wasteRate > 20 ? 'text-red-700' : 'text-gray-700'">
                    {{ consumptionTrends.totals.wasteRate }}%
                  </p>
                  <p class="text-sm text-gray-600">Waste Rate</p>
                </div>
              </div>

              <!-- Daily Chart (simple bar representation) -->
              <div class="relative h-40 flex items-end gap-1 overflow-x-auto pb-6">
                <div
                  v-for="day in consumptionTrends.daily.slice(-14)"
                  :key="day.date"
                  class="flex flex-col items-center min-w-[40px]"
                >
                  <div class="flex items-end gap-0.5 h-24">
                    <!-- Consumed bar -->
                    <div
                      class="w-3 bg-green-500 rounded-t"
                      :style="{
                        height: Math.max((day.consumed / Math.max(...consumptionTrends.daily.map(d => d.consumed + d.discarded), 1)) * 96, day.consumed > 0 ? 4 : 0) + 'px'
                      }"
                      :title="'Used: ' + day.consumed"
                    ></div>
                    <!-- Discarded bar -->
                    <div
                      class="w-3 bg-red-500 rounded-t"
                      :style="{
                        height: Math.max((day.discarded / Math.max(...consumptionTrends.daily.map(d => d.consumed + d.discarded), 1)) * 96, day.discarded > 0 ? 4 : 0) + 'px'
                      }"
                      :title="'Wasted: ' + day.discarded"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                    {{ formatDate(day.date) }}
                  </span>
                </div>
              </div>

              <!-- Legend -->
              <div class="flex items-center justify-center gap-6 mt-4 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-green-500 rounded"></div>
                  <span class="text-gray-600">Used</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-red-500 rounded"></div>
                  <span class="text-gray-600">Wasted</span>
                </div>
              </div>

              <!-- Top Categories -->
              <div v-if="consumptionTrends.topCategories.length > 0" class="mt-6 pt-6 border-t">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Most Used Categories</h4>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="cat in consumptionTrends.topCategories"
                    :key="cat._id"
                    class="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1"
                  >
                    <span>{{ cat.icon }}</span>
                    <span class="text-sm text-gray-700">{{ cat.name }}</span>
                    <span class="text-xs text-gray-500">({{ cat.count }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Storage & Value Distribution -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Storage Distribution -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Storage Types</h3>
              <div v-if="storageDistribution.length === 0" class="text-center py-8 text-gray-500">
                <p>No perishable items</p>
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="storage in storageDistribution"
                  :key="storage.type"
                  class="flex items-center gap-4"
                >
                  <div
                    class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    :style="{ backgroundColor: storage.color + '20' }"
                  >
                    {{ storage.icon }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-medium text-gray-700">{{ storage.name }}</span>
                      <span class="text-gray-500">{{ storage.count }} items</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-3">
                      <div
                        class="h-3 rounded-full transition-all"
                        :style="{
                          width: getBarWidth(storage.count, getMaxValue(storageDistribution, 'count')) + '%',
                          backgroundColor: storage.color
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Value by Location -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Value by Location</h3>
              <div v-if="valueDistribution.length === 0" class="text-center py-8 text-gray-500">
                <p>No value data available</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="loc in valueDistribution.slice(0, 6)"
                  :key="loc.locationId"
                  class="flex items-center gap-3"
                >
                  <span class="text-xl w-8 text-center">{{ loc.icon || '📍' }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-700 truncate">{{ loc.name }}</span>
                      <span class="text-sm font-medium text-green-600 ml-2">{{ formatCurrency(loc.totalValue) }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                      <div
                        class="bg-green-500 h-2 rounded-full transition-all"
                        :style="{ width: getBarWidth(loc.totalValue, getMaxValue(valueDistribution, 'totalValue')) + '%' }"
                      ></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{{ loc.itemCount }} items</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Expiration Forecast -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Expiration Forecast</h3>

            <div v-if="!expirationForecast" class="text-center py-8 text-gray-500">
              <p>No expiration data available</p>
            </div>

            <div v-else>
              <!-- Summary -->
              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="text-center p-4 bg-red-50 rounded-lg">
                  <p class="text-2xl font-bold text-red-700">{{ expirationForecast.summary.expiredCount }}</p>
                  <p class="text-sm text-red-600">Already Expired</p>
                </div>
                <div class="text-center p-4 bg-yellow-50 rounded-lg">
                  <p class="text-2xl font-bold text-yellow-700">{{ expirationForecast.summary.expiringThisWeek }}</p>
                  <p class="text-sm text-yellow-600">Expiring This Week</p>
                </div>
                <div class="text-center p-4 bg-orange-50 rounded-lg">
                  <p class="text-2xl font-bold text-orange-700">{{ expirationForecast.summary.expiringThisMonth }}</p>
                  <p class="text-sm text-orange-600">Expiring This Month</p>
                </div>
              </div>

              <!-- Expired Items List -->
              <div v-if="expirationForecast.expired.length > 0" class="mt-6">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Recently Expired Items</h4>
                <div class="space-y-2">
                  <div
                    v-for="item in expirationForecast.expired.slice(0, 5)"
                    :key="item._id"
                    class="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <span class="text-red-500">⚠️</span>
                      <div>
                        <p class="font-medium text-gray-900">{{ item.name }}</p>
                        <p class="text-xs text-gray-500">{{ item.locationId?.name || 'Unknown location' }}</p>
                      </div>
                    </div>
                    <span class="text-sm text-red-600">{{ formatDate(item.expirationDate) }}</span>
                  </div>
                </div>
              </div>

              <!-- Upcoming Expirations Calendar -->
              <div v-if="expirationForecast.forecast.length > 0" class="mt-6">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Upcoming Expirations</h4>
                <div class="grid grid-cols-7 gap-2">
                  <div
                    v-for="day in expirationForecast.forecast.slice(0, 14)"
                    :key="day._id"
                    class="text-center p-2 rounded-lg"
                    :class="day.count > 0 ? 'bg-yellow-100' : 'bg-gray-50'"
                  >
                    <p class="text-xs text-gray-500">{{ formatDate(day._id) }}</p>
                    <p
                      class="text-lg font-bold"
                      :class="day.count > 0 ? 'text-yellow-700' : 'text-gray-300'"
                    >{{ day.count }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
};
