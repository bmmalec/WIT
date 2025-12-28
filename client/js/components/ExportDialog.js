/**
 * ExportDialog Component
 * Dialog for exporting inventory data
 */

export const ExportDialog = {
  name: 'ExportDialog',

  props: {
    show: {
      type: Boolean,
      default: false,
    },
    locations: {
      type: Array,
      default: () => [],
    },
    categories: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['close'],

  setup(props, { emit }) {
    const { ref, computed, watch } = Vue;

    // Export type
    const exportType = ref('items'); // 'items', 'locations', 'backup', 'report'

    // Filters for items export
    const filters = ref({
      locationId: '',
      categoryId: '',
      expirationStatus: '',
      lowStock: false,
    });

    // State
    const loading = ref(false);
    const error = ref(null);
    const previewCount = ref(null);
    const previewLoading = ref(false);

    // Export type options
    const exportTypes = [
      {
        id: 'items',
        label: 'Items (CSV)',
        icon: '📦',
        description: 'Export all items with details like name, quantity, expiration dates, and values.',
      },
      {
        id: 'locations',
        label: 'Locations (CSV)',
        icon: '📍',
        description: 'Export all locations with their hierarchy and settings.',
      },
      {
        id: 'backup',
        label: 'Full Backup (JSON)',
        icon: '💾',
        description: 'Complete data backup including items, locations, and categories. Can be used for restoration.',
      },
      {
        id: 'report',
        label: 'Inventory Report',
        icon: '📊',
        description: 'Summary report with statistics by location, category, and expiration status.',
      },
    ];

    // Expiration status options
    const expirationOptions = [
      { value: '', label: 'All items' },
      { value: 'expired', label: 'Expired only' },
      { value: 'expiring_soon', label: 'Expiring this week' },
      { value: 'expiring_month', label: 'Expiring this month' },
      { value: 'no_expiration', label: 'No expiration date' },
    ];

    // Flatten location tree for select
    const flattenLocations = (nodes, depth = 0) => {
      let result = [];
      for (const node of nodes) {
        result.push({
          _id: node._id,
          name: '  '.repeat(depth) + node.name,
          icon: node.icon,
        });
        if (node.children && node.children.length > 0) {
          result = result.concat(flattenLocations(node.children, depth + 1));
        }
      }
      return result;
    };

    const flatLocations = computed(() => flattenLocations(props.locations));

    // Show filters only for items export
    const showFilters = computed(() => exportType.value === 'items');

    // Get preview count when filters change
    const updatePreview = async () => {
      if (exportType.value !== 'items') {
        previewCount.value = null;
        return;
      }

      previewLoading.value = true;
      try {
        const response = await window.api.dataExport.getPreview(filters.value);
        previewCount.value = response.data.itemCount;
      } catch (err) {
        console.error('Failed to get preview:', err);
        previewCount.value = null;
      } finally {
        previewLoading.value = false;
      }
    };

    // Watch for filter changes
    watch([() => filters.value.locationId, () => filters.value.categoryId, () => filters.value.expirationStatus, () => filters.value.lowStock], updatePreview);
    watch(() => exportType.value, updatePreview);
    watch(() => props.show, (show) => {
      if (show) {
        updatePreview();
      }
    });

    // Handle export
    const handleExport = async () => {
      loading.value = true;
      error.value = null;

      try {
        switch (exportType.value) {
          case 'items':
            await window.api.dataExport.exportItemsCSV(filters.value);
            break;
          case 'locations':
            await window.api.dataExport.exportLocationsCSV();
            break;
          case 'backup':
            await window.api.dataExport.exportBackup();
            break;
          case 'report':
            await window.api.dataExport.exportReport();
            break;
        }

        window.store?.success('Export downloaded successfully');
        emit('close');
      } catch (err) {
        console.error('Export failed:', err);
        error.value = err.message || 'Export failed. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Reset filters
    const resetFilters = () => {
      filters.value = {
        locationId: '',
        categoryId: '',
        expirationStatus: '',
        lowStock: false,
      };
    };

    // Close dialog
    const close = () => {
      error.value = null;
      resetFilters();
      emit('close');
    };

    return {
      exportType,
      exportTypes,
      filters,
      expirationOptions,
      flatLocations,
      showFilters,
      loading,
      error,
      previewCount,
      previewLoading,
      handleExport,
      resetFilters,
      close,
    };
  },

  template: `
    <div
      v-if="show"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="close"
    >
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <!-- Header -->
          <div class="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Data
              </h3>
              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="bg-white px-6 py-4">
            <!-- Export Type Selection -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Export Type</label>
              <div class="space-y-2">
                <div
                  v-for="type in exportTypes"
                  :key="type.id"
                  @click="exportType = type.id"
                  :class="[
                    'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    exportType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  <span class="text-2xl flex-shrink-0">{{ type.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <p :class="['font-medium', exportType === type.id ? 'text-blue-900' : 'text-gray-900']">
                      {{ type.label }}
                    </p>
                    <p :class="['text-sm', exportType === type.id ? 'text-blue-700' : 'text-gray-500']">
                      {{ type.description }}
                    </p>
                  </div>
                  <div class="flex-shrink-0">
                    <div
                      :class="[
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        exportType === type.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      ]"
                    >
                      <svg
                        v-if="exportType === type.id"
                        class="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filters (for items export) -->
            <div v-if="showFilters" class="mb-6 p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-gray-700">Filter Items</label>
                <button
                  @click="resetFilters"
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset filters
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- Location Filter -->
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Location</label>
                  <select
                    v-model="filters.locationId"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All locations</option>
                    <option
                      v-for="loc in flatLocations"
                      :key="loc._id"
                      :value="loc._id"
                    >
                      {{ loc.icon }} {{ loc.name }}
                    </option>
                  </select>
                </div>

                <!-- Category Filter -->
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    v-model="filters.categoryId"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All categories</option>
                    <option
                      v-for="cat in categories"
                      :key="cat._id"
                      :value="cat._id"
                    >
                      {{ cat.icon }} {{ cat.name }}
                    </option>
                  </select>
                </div>

                <!-- Expiration Filter -->
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Expiration</label>
                  <select
                    v-model="filters.expirationStatus"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option
                      v-for="opt in expirationOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Low Stock Filter -->
                <div class="flex items-end">
                  <label class="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      v-model="filters.lowStock"
                      class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700">Low stock only</span>
                  </label>
                </div>
              </div>

              <!-- Preview Count -->
              <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-gray-500">Items to export:</span>
                  <span v-if="previewLoading" class="text-gray-400">Loading...</span>
                  <span v-else-if="previewCount !== null" class="font-medium text-gray-900">
                    {{ previewCount }} item{{ previewCount !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              @click="close"
              :disabled="loading"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              @click="handleExport"
              :disabled="loading || (showFilters && previewCount === 0)"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {{ loading ? 'Exporting...' : 'Export' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};

export default ExportDialog;
