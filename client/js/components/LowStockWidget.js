/**
 * LowStockWidget Component
 * Dashboard widget showing items that are running low on stock
 */

const { ref, computed, onMounted } = Vue;

export default {
  name: 'LowStockWidget',

  emits: ['click', 'item-click'],

  setup(props, { emit }) {
    const loading = ref(true);
    const error = ref(null);
    const lowStockItems = ref([]);

    // Fetch low stock items
    const fetchLowStock = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.items.getLowStock();
        lowStockItems.value = response.data.items || [];
      } catch (err) {
        console.error('Failed to fetch low stock items:', err);
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

    // Get stock percentage for progress bar
    const getStockPercentage = (item) => {
      if (!item.quantity?.minAlert) return 0;
      // Show percentage relative to min alert (100% = at minimum, 0% = empty)
      const ratio = item.quantity.value / item.quantity.minAlert;
      return Math.min(ratio * 100, 100);
    };

    // Get urgency class based on stock level
    const getUrgencyClass = (item) => {
      if (!item.quantity?.minAlert) return 'bg-gray-200';
      const ratio = item.quantity.value / item.quantity.minAlert;
      if (ratio <= 0.25) return 'bg-red-500';
      if (ratio <= 0.5) return 'bg-orange-500';
      if (ratio <= 0.75) return 'bg-yellow-500';
      return 'bg-yellow-400';
    };

    onMounted(() => {
      fetchLowStock();
    });

    return {
      loading,
      error,
      lowStockItems,
      handleClick,
      handleItemClick,
      fetchLowStock,
      getStockPercentage,
      getUrgencyClass,
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
          <span class="text-lg">📦</span>
          Low Stock Items
        </h3>
        <span
          v-if="!loading && lowStockItems.length > 0"
          class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700"
        >
          {{ lowStockItems.length }}
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-4">
        <p class="text-sm text-red-600">{{ error }}</p>
        <button @click.stop="fetchLowStock" class="text-xs text-blue-600 hover:underline mt-1">
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="lowStockItems.length === 0" class="text-center py-4">
        <div class="text-2xl mb-2">✓</div>
        <p class="text-sm text-gray-500">All stocked up!</p>
        <p class="text-xs text-gray-400">No items below minimum levels</p>
      </div>

      <!-- Low Stock List -->
      <div v-else class="space-y-2">
        <div
          v-for="item in lowStockItems.slice(0, 5)"
          :key="item._id"
          @click.stop="handleItemClick(item)"
          class="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-900 truncate" :title="item.name">
              {{ item.name }}
            </span>
            <span class="text-xs font-medium text-red-600 flex-shrink-0 ml-2">
              {{ item.quantity?.value || 0 }}/{{ item.quantity?.minAlert }}
            </span>
          </div>
          <!-- Progress bar -->
          <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="getUrgencyClass(item)"
              :style="{ width: getStockPercentage(item) + '%' }"
            ></div>
          </div>
          <p v-if="item.locationId?.name" class="text-xs text-gray-400 mt-1 truncate">
            {{ item.locationId.name }}
          </p>
        </div>

        <!-- Show more indicator -->
        <p v-if="lowStockItems.length > 5" class="text-xs text-gray-400 text-center pt-1">
          +{{ lowStockItems.length - 5 }} more items
        </p>
      </div>

      <!-- Click hint -->
      <p class="text-xs text-gray-400 text-center mt-3">
        Click to view all
      </p>
    </div>
  `,
};
