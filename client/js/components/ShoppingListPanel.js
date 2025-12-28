/**
 * ShoppingListPanel Component
 * Slide-out panel for managing shopping list
 */

const { ref, computed, onMounted, watch } = Vue;

export default {
  name: 'ShoppingListPanel',

  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['close'],

  setup(props, { emit }) {
    const loading = ref(true);
    const error = ref(null);
    const list = ref(null);
    const suggestions = ref({ consumed: [], lowStock: [], expired: [] });
    const showSuggestions = ref(false);
    const newItemName = ref('');
    const addingItem = ref(false);

    // Pending items
    const pendingItems = computed(() => {
      if (!list.value?.items) return [];
      return list.value.items
        .filter(item => item.status === 'pending')
        .sort((a, b) => a.priority - b.priority);
    });

    // Purchased items
    const purchasedItems = computed(() => {
      if (!list.value?.items) return [];
      return list.value.items.filter(item => item.status === 'purchased');
    });

    // Estimated total
    const estimatedTotal = computed(() => {
      return pendingItems.value
        .filter(item => item.estimatedPrice)
        .reduce((sum, item) => sum + (item.estimatedPrice * (item.quantity?.value || 1)), 0);
    });

    // Fetch shopping list
    const fetchList = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.shoppingList.getList();
        list.value = response.data.list;
      } catch (err) {
        console.error('Failed to fetch shopping list:', err);
        error.value = err.message || 'Failed to load shopping list';
      } finally {
        loading.value = false;
      }
    };

    // Fetch suggestions
    const fetchSuggestions = async () => {
      try {
        const response = await window.api.shoppingList.getSuggestions();
        suggestions.value = response.data.suggestions;
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };

    // Add new item
    const addItem = async () => {
      if (!newItemName.value.trim() || addingItem.value) return;

      addingItem.value = true;
      try {
        const response = await window.api.shoppingList.addItem({
          name: newItemName.value.trim(),
        });
        list.value = response.data.list;
        newItemName.value = '';
      } catch (err) {
        console.error('Failed to add item:', err);
        window.store?.error(err.message || 'Failed to add item');
      } finally {
        addingItem.value = false;
      }
    };

    // Add item from suggestion
    const addFromSuggestion = async (item, source) => {
      try {
        const response = await window.api.shoppingList.addFromSuggestion(item._id, source);
        list.value = response.data.list;
        window.store?.success(`Added "${item.name}" to shopping list`);
      } catch (err) {
        console.error('Failed to add suggestion:', err);
        window.store?.error(err.message || 'Failed to add item');
      }
    };

    // Mark item as purchased
    const markPurchased = async (item) => {
      try {
        const response = await window.api.shoppingList.markPurchased(item._id);
        list.value = response.data.list;
      } catch (err) {
        console.error('Failed to mark as purchased:', err);
        window.store?.error(err.message || 'Failed to update item');
      }
    };

    // Remove item
    const removeItem = async (item) => {
      try {
        const response = await window.api.shoppingList.removeItem(item._id);
        list.value = response.data.list;
      } catch (err) {
        console.error('Failed to remove item:', err);
        window.store?.error(err.message || 'Failed to remove item');
      }
    };

    // Clear purchased items
    const clearPurchased = async () => {
      try {
        const response = await window.api.shoppingList.clearPurchased();
        list.value = response.data.list;
        window.store?.success('Purchased items cleared');
      } catch (err) {
        console.error('Failed to clear purchased:', err);
        window.store?.error(err.message || 'Failed to clear items');
      }
    };

    // Close panel
    const close = () => {
      emit('close');
    };

    // Toggle suggestions
    const toggleSuggestions = () => {
      showSuggestions.value = !showSuggestions.value;
      if (showSuggestions.value && suggestions.value.consumed.length === 0) {
        fetchSuggestions();
      }
    };

    // Get priority label
    const getPriorityLabel = (priority) => {
      const labels = { 1: 'High', 2: 'Medium', 3: 'Low' };
      return labels[priority] || 'Medium';
    };

    // Get priority class
    const getPriorityClass = (priority) => {
      const classes = {
        1: 'bg-red-100 text-red-700',
        2: 'bg-yellow-100 text-yellow-700',
        3: 'bg-gray-100 text-gray-600',
      };
      return classes[priority] || classes[2];
    };

    // Get source label
    const getSourceLabel = (source) => {
      const labels = {
        manual: 'Added manually',
        consumed: 'Recently used',
        low_stock: 'Low stock',
        expired: 'Expired',
      };
      return labels[source] || source;
    };

    // Format currency
    const formatCurrency = (value) => {
      if (!value && value !== 0) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    };

    // Total suggestion count
    const totalSuggestions = computed(() => {
      return suggestions.value.consumed.length +
        suggestions.value.lowStock.length +
        suggestions.value.expired.length;
    });

    // Watch for show changes
    watch(() => props.show, (newVal) => {
      if (newVal) {
        fetchList();
        fetchSuggestions();
      }
    });

    // Initial fetch if already showing
    onMounted(() => {
      if (props.show) {
        fetchList();
        fetchSuggestions();
      }
    });

    return {
      loading,
      error,
      list,
      suggestions,
      showSuggestions,
      newItemName,
      addingItem,
      pendingItems,
      purchasedItems,
      estimatedTotal,
      totalSuggestions,
      fetchList,
      fetchSuggestions,
      addItem,
      addFromSuggestion,
      markPurchased,
      removeItem,
      clearPurchased,
      close,
      toggleSuggestions,
      getPriorityLabel,
      getPriorityClass,
      getSourceLabel,
      formatCurrency,
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
        <div class="w-screen max-w-md">
          <div class="h-full flex flex-col bg-white shadow-xl">
            <!-- Header -->
            <div class="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">🛒</span>
                  <h2 class="text-lg font-semibold text-white">Shopping List</h2>
                </div>
                <button
                  @click="close"
                  class="text-white/80 hover:text-white transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Quick add -->
              <div class="mt-3 flex gap-2">
                <input
                  v-model="newItemName"
                  @keyup.enter="addItem"
                  type="text"
                  placeholder="Add item..."
                  class="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  @click="addItem"
                  :disabled="!newItemName.trim() || addingItem"
                  class="px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto">
              <!-- Loading State -->
              <div v-if="loading" class="flex justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>

              <!-- Error State -->
              <div v-else-if="error" class="p-4 text-center">
                <p class="text-red-600 mb-2">{{ error }}</p>
                <button @click="fetchList" class="text-sm text-blue-600 hover:underline">
                  Retry
                </button>
              </div>

              <div v-else class="p-4 space-y-4">
                <!-- Suggestions Banner -->
                <div
                  v-if="totalSuggestions > 0"
                  @click="toggleSuggestions"
                  class="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">💡</span>
                      <span class="text-sm font-medium text-blue-700">
                        {{ totalSuggestions }} suggested items
                      </span>
                    </div>
                    <svg
                      :class="['w-5 h-5 text-blue-600 transition-transform', showSuggestions ? 'rotate-180' : '']"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>

                  <!-- Suggestions List -->
                  <div v-if="showSuggestions" class="mt-3 space-y-3" @click.stop>
                    <!-- Consumed Items -->
                    <div v-if="suggestions.consumed.length > 0">
                      <p class="text-xs font-medium text-blue-600 mb-1">Recently Used</p>
                      <div class="space-y-1">
                        <div
                          v-for="item in suggestions.consumed.slice(0, 5)"
                          :key="item._id"
                          class="flex items-center justify-between p-2 bg-white rounded"
                        >
                          <span class="text-sm text-gray-700">{{ item.name }}</span>
                          <button
                            @click="addFromSuggestion(item, 'consumed')"
                            class="text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Low Stock Items -->
                    <div v-if="suggestions.lowStock.length > 0">
                      <p class="text-xs font-medium text-orange-600 mb-1">Low Stock</p>
                      <div class="space-y-1">
                        <div
                          v-for="item in suggestions.lowStock.slice(0, 5)"
                          :key="item._id"
                          class="flex items-center justify-between p-2 bg-white rounded"
                        >
                          <span class="text-sm text-gray-700">{{ item.name }}</span>
                          <button
                            @click="addFromSuggestion(item, 'low_stock')"
                            class="text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Expired Items -->
                    <div v-if="suggestions.expired.length > 0">
                      <p class="text-xs font-medium text-red-600 mb-1">Expired (Need Replacement)</p>
                      <div class="space-y-1">
                        <div
                          v-for="item in suggestions.expired.slice(0, 5)"
                          :key="item._id"
                          class="flex items-center justify-between p-2 bg-white rounded"
                        >
                          <span class="text-sm text-gray-700">{{ item.name }}</span>
                          <button
                            @click="addFromSuggestion(item, 'expired')"
                            class="text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Pending Items -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-gray-700">
                      To Buy ({{ pendingItems.length }})
                    </h3>
                    <span v-if="estimatedTotal > 0" class="text-sm text-gray-500">
                      Est. {{ formatCurrency(estimatedTotal) }}
                    </span>
                  </div>

                  <div v-if="pendingItems.length === 0" class="text-center py-6 text-gray-500">
                    <div class="text-3xl mb-2">✓</div>
                    <p class="text-sm">Shopping list is empty</p>
                    <p class="text-xs text-gray-400">Add items above or from suggestions</p>
                  </div>

                  <div v-else class="space-y-2">
                    <div
                      v-for="item in pendingItems"
                      :key="item._id"
                      class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                    >
                      <!-- Checkbox -->
                      <button
                        @click="markPurchased(item)"
                        class="w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-colors"
                      >
                        <svg class="w-3 h-3 text-transparent group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>

                      <!-- Item info -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-gray-900">{{ item.name }}</span>
                          <span
                            v-if="item.priority !== 2"
                            :class="['text-xs px-1.5 py-0.5 rounded', getPriorityClass(item.priority)]"
                          >
                            {{ getPriorityLabel(item.priority) }}
                          </span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                          <span v-if="item.quantity?.value > 1">
                            {{ item.quantity.value }} {{ item.quantity.unit }}
                          </span>
                          <span v-if="item.targetLocationId?.name">
                            → {{ item.targetLocationId.name }}
                          </span>
                          <span v-if="item.estimatedPrice" class="text-green-600">
                            {{ formatCurrency(item.estimatedPrice) }}
                          </span>
                        </div>
                      </div>

                      <!-- Remove button -->
                      <button
                        @click="removeItem(item)"
                        class="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Purchased Items -->
                <div v-if="purchasedItems.length > 0" class="pt-4 border-t border-gray-200">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-gray-500">
                      Purchased ({{ purchasedItems.length }})
                    </h3>
                    <button
                      @click="clearPurchased"
                      class="text-xs text-red-500 hover:text-red-600"
                    >
                      Clear all
                    </button>
                  </div>

                  <div class="space-y-1">
                    <div
                      v-for="item in purchasedItems"
                      :key="item._id"
                      class="flex items-center gap-3 p-2 opacity-60"
                    >
                      <div class="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <span class="text-sm text-gray-500 line-through">{{ item.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                @click="close"
                class="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
