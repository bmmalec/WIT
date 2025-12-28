/**
 * ConsumptionHistoryWidget Component
 * Dashboard widget showing recently consumed and discarded items
 */

const { ref, computed, onMounted } = Vue;

export default {
  name: 'ConsumptionHistoryWidget',

  emits: ['click', 'item-click'],

  setup(props, { emit }) {
    const loading = ref(true);
    const error = ref(null);
    const items = ref([]);
    const stats = ref({ consumed: 0, discarded: 0, total: 0, days: 30 });
    const filter = ref('all'); // 'all', 'consumed', 'discarded'

    // Fetch consumption history
    const fetchHistory = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.items.getConsumptionHistory({
          type: filter.value,
          limit: 10,
          days: 30,
        });
        items.value = response.data.items || [];
        stats.value = response.data.stats || { consumed: 0, discarded: 0, total: 0, days: 30 };
      } catch (err) {
        console.error('Failed to fetch consumption history:', err);
        error.value = err.message || 'Failed to load';
      } finally {
        loading.value = false;
      }
    };

    // Handle widget click
    const handleClick = () => {
      emit('click');
    };

    // Handle item click
    const handleItemClick = (item) => {
      emit('item-click', item);
    };

    // Change filter
    const setFilter = (newFilter) => {
      filter.value = newFilter;
      fetchHistory();
    };

    // Format relative date
    const formatRelativeDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    };

    // Get icon for history type
    const getTypeIcon = (type) => {
      return type === 'consumed' ? '✓' : '✗';
    };

    // Get color class for history type
    const getTypeClass = (type) => {
      return type === 'consumed'
        ? 'bg-green-100 text-green-700'
        : 'bg-orange-100 text-orange-700';
    };

    onMounted(() => {
      fetchHistory();
    });

    return {
      loading,
      error,
      items,
      stats,
      filter,
      handleClick,
      handleItemClick,
      fetchHistory,
      setFilter,
      formatRelativeDate,
      getTypeIcon,
      getTypeClass,
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
          <span class="text-lg">📊</span>
          Recent Activity
        </h3>
        <span class="text-xs text-gray-400">Last {{ stats.days }} days</span>
      </div>

      <!-- Stats Summary -->
      <div class="flex gap-2 mb-3" @click.stop>
        <button
          @click="setFilter('all')"
          :class="[
            'flex-1 py-1 px-2 rounded text-xs font-medium transition-colors',
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          ]"
        >
          All ({{ stats.total }})
        </button>
        <button
          @click="setFilter('consumed')"
          :class="[
            'flex-1 py-1 px-2 rounded text-xs font-medium transition-colors',
            filter === 'consumed'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          ]"
        >
          Used ({{ stats.consumed }})
        </button>
        <button
          @click="setFilter('discarded')"
          :class="[
            'flex-1 py-1 px-2 rounded text-xs font-medium transition-colors',
            filter === 'discarded'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          ]"
        >
          Waste ({{ stats.discarded }})
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-4">
        <p class="text-sm text-red-600">{{ error }}</p>
        <button @click.stop="fetchHistory" class="text-xs text-blue-600 hover:underline mt-1">
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="items.length === 0" class="text-center py-4">
        <div class="text-2xl mb-2">📋</div>
        <p class="text-sm text-gray-500">No activity yet</p>
        <p class="text-xs text-gray-400">Items you use or discard will appear here</p>
      </div>

      <!-- History List -->
      <div v-else class="space-y-2">
        <div
          v-for="item in items.slice(0, 5)"
          :key="item._id"
          @click.stop="handleItemClick(item)"
          class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <!-- Type indicator -->
          <div
            :class="[
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              getTypeClass(item.historyType)
            ]"
          >
            {{ getTypeIcon(item.historyType) }}
          </div>

          <!-- Item info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate" :title="item.name">
              {{ item.name }}
            </p>
            <p class="text-xs text-gray-400 truncate">
              {{ formatRelativeDate(item.historyDate) }}
              <span v-if="item.locationId?.name"> · {{ item.locationId.name }}</span>
            </p>
          </div>
        </div>

        <!-- Show more indicator -->
        <p v-if="items.length > 5" class="text-xs text-gray-400 text-center pt-1">
          +{{ items.length - 5 }} more items
        </p>
      </div>

      <!-- Waste ratio indicator (if there's enough data) -->
      <div v-if="!loading && stats.total >= 5" class="mt-3 pt-3 border-t border-gray-100">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">Waste ratio</span>
          <span :class="stats.discarded / stats.total > 0.3 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'">
            {{ Math.round((stats.discarded / stats.total) * 100) }}%
          </span>
        </div>
        <div class="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div class="h-full bg-green-500 rounded-full" :style="{ width: (stats.consumed / stats.total * 100) + '%' }"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>Used</span>
          <span>Wasted</span>
        </div>
      </div>
    </div>
  `,
};
