/**
 * ItemCard Component
 * Displays an item in a card format
 */

const { ref, computed } = Vue;

export default {
  name: 'ItemCard',

  props: {
    item: {
      type: Object,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['click', 'edit', 'delete', 'adjust-quantity'],

  setup(props, { emit }) {
    const adjusting = ref(false);

    // Get primary image or placeholder
    const imageUrl = computed(() => {
      if (props.item.images && props.item.images.length > 0) {
        const primary = props.item.images.find(img => img.isPrimary);
        return primary?.thumbnailUrl || primary?.url || props.item.images[0].thumbnailUrl || props.item.images[0].url;
      }
      return null;
    });

    // Get category info
    const categoryInfo = computed(() => {
      return props.item.categoryId || null;
    });

    // Format quantity display
    const quantityDisplay = computed(() => {
      const qty = props.item.quantity || { value: 1, unit: 'each' };
      if (qty.unit === 'each' && qty.value === 1) {
        return '';
      }
      return `${qty.value} ${qty.unit}`;
    });

    // Check if low stock
    const isLowStock = computed(() => {
      const qty = props.item.quantity;
      if (!qty || !qty.minAlert) return false;
      return qty.value <= qty.minAlert;
    });

    // Format currency
    const formatCurrency = (value, currency = 'USD') => {
      if (!value && value !== 0) return null;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(value);
    };

    // Handle quantity adjustment
    const adjustQuantity = async (delta) => {
      if (adjusting.value) return;
      adjusting.value = true;

      try {
        await window.api.items.adjustQuantity(props.item._id, delta);
        emit('adjust-quantity', { item: props.item, delta });
      } catch (err) {
        console.error('Failed to adjust quantity:', err);
        window.store?.error(err.message || 'Failed to adjust quantity');
      } finally {
        adjusting.value = false;
      }
    };

    return {
      imageUrl,
      categoryInfo,
      quantityDisplay,
      isLowStock,
      formatCurrency,
      adjustQuantity,
      adjusting,
    };
  },

  template: `
    <div
      class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      @click="$emit('click', item)"
    >
      <!-- Image or Placeholder -->
      <div class="aspect-square bg-gray-100 relative overflow-hidden">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="item.name"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-4xl text-gray-300">
          <span v-if="categoryInfo?.icon">{{ categoryInfo.icon }}</span>
          <span v-else>📦</span>
        </div>

        <!-- Category Badge -->
        <div
          v-if="categoryInfo"
          class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-gray-700"
        >
          {{ categoryInfo.icon }} {{ categoryInfo.name }}
        </div>

        <!-- Low Stock Badge -->
        <div
          v-if="isLowStock"
          class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
        >
          Low Stock
        </div>

        <!-- Quick Actions (visible on hover) -->
        <div
          v-if="canEdit"
          class="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop
        >
          <button
            @click="$emit('edit', item)"
            class="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
            title="Edit"
          >
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
          <button
            @click="$emit('delete', item)"
            class="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50"
            title="Delete"
          >
            <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-3">
        <!-- Name -->
        <h3 class="font-medium text-gray-900 truncate" :title="item.name">
          {{ item.name }}
        </h3>

        <!-- Brand/Model -->
        <p v-if="item.brand || item.model" class="text-sm text-gray-500 truncate">
          {{ [item.brand, item.model].filter(Boolean).join(' ') }}
        </p>

        <!-- Quantity and Value -->
        <div class="mt-2 flex items-center justify-between">
          <!-- Quantity -->
          <div class="flex items-center gap-1">
            <template v-if="canEdit && item.quantity">
              <button
                @click.stop="adjustQuantity(-1)"
                :disabled="adjusting || item.quantity.value <= 0"
                class="p-0.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                </svg>
              </button>
            </template>
            <span
              v-if="quantityDisplay"
              :class="['text-sm font-medium', isLowStock ? 'text-red-600' : 'text-gray-700']"
            >
              {{ quantityDisplay }}
            </span>
            <template v-if="canEdit && item.quantity">
              <button
                @click.stop="adjustQuantity(1)"
                :disabled="adjusting"
                class="p-0.5 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </template>
          </div>

          <!-- Value -->
          <span v-if="item.value?.currentValue" class="text-sm font-medium text-green-600">
            {{ formatCurrency(item.value.currentValue, item.value.currency) }}
          </span>
        </div>

        <!-- Tags -->
        <div v-if="item.tags && item.tags.length > 0" class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="tag in item.tags.slice(0, 3)"
            :key="tag"
            class="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
          >
            {{ tag }}
          </span>
          <span v-if="item.tags.length > 3" class="text-xs text-gray-400">
            +{{ item.tags.length - 3 }}
          </span>
        </div>
      </div>
    </div>
  `,
};
