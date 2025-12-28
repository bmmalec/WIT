/**
 * PrintLabelsDialog Component
 * Dialog for previewing and printing labels with QR codes
 */

export const PrintLabelsDialog = {
  name: 'PrintLabelsDialog',

  props: {
    show: {
      type: Boolean,
      default: false,
    },
    // Can be 'item', 'location', or 'batch'
    mode: {
      type: String,
      default: 'item',
    },
    // Single item/location for single mode
    item: {
      type: Object,
      default: null,
    },
    location: {
      type: Object,
      default: null,
    },
    // Array of items/locations for batch mode
    items: {
      type: Array,
      default: () => [],
    },
    locations: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['close'],

  setup(props, { emit }) {
    const { ref, computed, watch, onMounted } = Vue;

    // State
    const loading = ref(false);
    const error = ref(null);
    const labels = ref([]);
    const labelSize = ref('medium');
    const showQROnly = ref(false);
    const columns = ref(2);

    // Label size options
    const labelSizes = [
      { id: 'small', name: 'Small (1" x 1")', width: 25, height: 25 },
      { id: 'medium', name: 'Medium (2" x 1")', width: 50, height: 25 },
      { id: 'large', name: 'Large (2" x 2")', width: 50, height: 50 },
      { id: 'shelf', name: 'Shelf (4" x 2")', width: 100, height: 50 },
    ];

    // Column options
    const columnOptions = [1, 2, 3, 4];

    // Current label size config
    const currentSize = computed(() =>
      labelSizes.find(s => s.id === labelSize.value) || labelSizes[1]
    );

    // Title based on mode
    const title = computed(() => {
      if (props.mode === 'batch') {
        const count = labels.value.length;
        return `Print ${count} Label${count !== 1 ? 's' : ''}`;
      }
      return props.item ? 'Print Item Label' : 'Print Location Label';
    });

    // Fetch label data
    const fetchLabels = async () => {
      loading.value = true;
      error.value = null;
      labels.value = [];

      try {
        if (props.mode === 'item' && props.item) {
          const response = await window.api.labels.getItemLabel(props.item._id);
          labels.value = [response.data.label];
        } else if (props.mode === 'location' && props.location) {
          const response = await window.api.labels.getLocationLabel(props.location._id);
          labels.value = [response.data.label];
        } else if (props.mode === 'batch') {
          if (props.items.length > 0) {
            const itemIds = props.items.map(i => i._id);
            const response = await window.api.labels.getBatchItemLabels(itemIds);
            labels.value = response.data.labels;
          } else if (props.locations.length > 0) {
            const locationIds = props.locations.map(l => l._id);
            const response = await window.api.labels.getBatchLocationLabels(locationIds);
            labels.value = response.data.labels;
          }
        }
      } catch (err) {
        console.error('Failed to fetch labels:', err);
        error.value = err.message || 'Failed to generate labels';
      } finally {
        loading.value = false;
      }
    };

    // Watch for show changes
    watch(() => props.show, (show) => {
      if (show) {
        fetchLabels();
      }
    });

    // Print labels
    const handlePrint = () => {
      const printContent = document.getElementById('label-print-area');
      if (!printContent) return;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WIT Labels</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .label-grid {
              display: grid;
              grid-template-columns: repeat(${columns.value}, 1fr);
              gap: 10px;
              padding: 10px;
            }
            .label {
              border: 1px dashed #ccc;
              padding: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
              page-break-inside: avoid;
            }
            .label-qr { flex-shrink: 0; }
            .label-qr img { width: 60px; height: 60px; }
            .label-info { flex: 1; min-width: 0; }
            .label-name { font-weight: 600; font-size: 12px; margin-bottom: 2px; }
            .label-detail { font-size: 10px; color: #666; }
            .label-barcode { font-family: monospace; font-size: 9px; color: #888; }
            .qr-only .label { justify-content: center; padding: 4px; }
            .qr-only .label-info { display: none; }
            .qr-only .label-qr img { width: 80px; height: 80px; }
            @media print {
              .label { border: 1px solid #ddd; }
            }
          </style>
        </head>
        <body class="${showQROnly.value ? 'qr-only' : ''}">
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };

    // Close dialog
    const close = () => {
      error.value = null;
      labels.value = [];
      emit('close');
    };

    return {
      loading,
      error,
      labels,
      labelSize,
      labelSizes,
      showQROnly,
      columns,
      columnOptions,
      currentSize,
      title,
      handlePrint,
      close,
      fetchLabels,
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
        <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-3xl sm:w-full">
          <!-- Header -->
          <div class="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {{ title }}
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
            <!-- Options -->
            <div class="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-gray-200">
              <!-- Columns -->
              <div class="flex items-center gap-2">
                <label class="text-sm text-gray-600">Columns:</label>
                <select
                  v-model="columns"
                  class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option v-for="n in columnOptions" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>

              <!-- QR Only Toggle -->
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="showQROnly"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm text-gray-600">QR code only</span>
              </label>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-12">
              <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-8">
              <p class="text-red-600 mb-4">{{ error }}</p>
              <button @click="fetchLabels" class="text-blue-600 hover:text-blue-800">
                Try again
              </button>
            </div>

            <!-- Labels Preview -->
            <div v-else-if="labels.length > 0" class="max-h-96 overflow-y-auto">
              <div
                id="label-print-area"
                class="label-grid"
                :style="{ display: 'grid', gridTemplateColumns: 'repeat(' + columns + ', 1fr)', gap: '10px' }"
              >
                <div
                  v-for="label in labels"
                  :key="label.id"
                  class="label border border-dashed border-gray-300 rounded-lg p-3 flex items-center gap-3"
                  :class="{ 'justify-center': showQROnly }"
                >
                  <!-- QR Code -->
                  <div class="label-qr flex-shrink-0">
                    <img
                      :src="label.qrCode"
                      :alt="'QR code for ' + label.name"
                      :class="showQROnly ? 'w-20 h-20' : 'w-14 h-14'"
                    />
                  </div>

                  <!-- Label Info -->
                  <div v-if="!showQROnly" class="label-info flex-1 min-w-0">
                    <p class="label-name font-semibold text-sm text-gray-900 truncate">
                      {{ label.type === 'location' ? label.icon + ' ' : '' }}{{ label.name }}
                    </p>

                    <p v-if="label.type === 'item' && label.location" class="label-detail text-xs text-gray-500 truncate">
                      {{ label.location }}
                    </p>
                    <p v-else-if="label.type === 'location'" class="label-detail text-xs text-gray-500 truncate">
                      {{ label.itemCount }} item{{ label.itemCount !== 1 ? 's' : '' }}
                    </p>

                    <p v-if="label.barcode" class="label-barcode text-xs text-gray-400 font-mono truncate">
                      {{ label.barcode }}
                    </p>

                    <p v-if="label.expirationDate" class="label-detail text-xs text-orange-600">
                      Exp: {{ label.expirationDate }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8 text-gray-500">
              <p>No labels to display</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              @click="close"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="handlePrint"
              :disabled="loading || labels.length === 0"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};

export default PrintLabelsDialog;
