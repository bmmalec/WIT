/**
 * MoveItemDialog Component
 * Modal dialog for moving an item to a different location
 */

const { ref, computed, onMounted, watch } = Vue;

export default {
  name: 'MoveItemDialog',

  props: {
    show: {
      type: Boolean,
      default: false,
    },
    item: {
      type: Object,
      required: true,
    },
  },

  emits: ['close', 'moved'],

  setup(props, { emit }) {
    const loading = ref(false);
    const loadingTree = ref(false);
    const error = ref('');
    const locationTree = ref([]);
    const selectedLocationId = ref(null);
    const expandedIds = ref(new Set());

    // Fetch location tree when dialog opens
    watch(() => props.show, async (newShow) => {
      if (newShow) {
        await fetchLocationTree();
        // Pre-select current location
        selectedLocationId.value = props.item.locationId?._id || props.item.locationId;
        error.value = '';
      }
    });

    // Fetch location tree
    const fetchLocationTree = async () => {
      loadingTree.value = true;
      try {
        const response = await window.api.locations.tree();
        locationTree.value = response.data.tree || [];
        // Expand all nodes by default for easier navigation
        expandAllNodes(locationTree.value);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        error.value = 'Failed to load locations';
      } finally {
        loadingTree.value = false;
      }
    };

    // Expand all nodes recursively
    const expandAllNodes = (nodes) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          expandedIds.value.add(node._id);
          expandAllNodes(node.children);
        }
      });
    };

    // Toggle node expansion
    const toggleNode = (nodeId) => {
      if (expandedIds.value.has(nodeId)) {
        expandedIds.value.delete(nodeId);
      } else {
        expandedIds.value.add(nodeId);
      }
      // Force reactivity
      expandedIds.value = new Set(expandedIds.value);
    };

    // Check if node is expanded
    const isExpanded = (nodeId) => {
      return expandedIds.value.has(nodeId);
    };

    // Select a location
    const selectLocation = (locationId) => {
      selectedLocationId.value = locationId;
    };

    // Check if location is the current location
    const isCurrentLocation = (locationId) => {
      const currentId = props.item.locationId?._id || props.item.locationId;
      return locationId === currentId;
    };

    // Handle move
    const handleMove = async () => {
      if (!selectedLocationId.value) {
        error.value = 'Please select a destination location';
        return;
      }

      const currentLocationId = props.item.locationId?._id || props.item.locationId;
      if (selectedLocationId.value === currentLocationId) {
        error.value = 'Item is already in this location';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        await window.api.items.move(props.item._id, selectedLocationId.value);
        window.store?.success('Item moved successfully');
        emit('moved', { item: props.item, newLocationId: selectedLocationId.value });
        emit('close');
      } catch (err) {
        console.error('Failed to move item:', err);
        error.value = err.message || 'Failed to move item';
      } finally {
        loading.value = false;
      }
    };

    // Handle close
    const handleClose = () => {
      if (!loading.value) {
        emit('close');
      }
    };

    return {
      loading,
      loadingTree,
      error,
      locationTree,
      selectedLocationId,
      expandedIds,
      toggleNode,
      isExpanded,
      selectLocation,
      isCurrentLocation,
      handleMove,
      handleClose,
    };
  },

  template: `
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleClose"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <!-- Header -->
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">
                Move Item
              </h3>
              <button
                @click="handleClose"
                :disabled="loading"
                class="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Item being moved -->
            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600">Moving:</p>
              <p class="font-medium text-gray-900">{{ item.name }}</p>
            </div>

            <!-- Error -->
            <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ error }}
            </div>

            <!-- Location Tree -->
            <div class="mb-4">
              <p class="text-sm font-medium text-gray-700 mb-2">Select destination:</p>

              <!-- Loading State -->
              <div v-if="loadingTree" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>

              <!-- Empty State -->
              <div v-else-if="locationTree.length === 0" class="text-center py-8 text-gray-500">
                <p>No locations available</p>
              </div>

              <!-- Tree -->
              <div v-else class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <div class="p-2">
                  <template v-for="node in locationTree" :key="node._id">
                    <div class="location-node">
                      <!-- Node Item -->
                      <div
                        @click="selectLocation(node._id)"
                        :class="[
                          'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer',
                          selectedLocationId === node._id
                            ? 'bg-blue-100 text-blue-800'
                            : 'hover:bg-gray-100',
                          isCurrentLocation(node._id) ? 'opacity-50' : ''
                        ]"
                      >
                        <!-- Expand/Collapse -->
                        <button
                          v-if="node.children && node.children.length > 0"
                          @click.stop="toggleNode(node._id)"
                          class="p-0.5 hover:bg-gray-200 rounded"
                        >
                          <svg
                            :class="['w-4 h-4 text-gray-500 transition-transform', isExpanded(node._id) ? 'rotate-90' : '']"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                        <span v-else class="w-5"></span>

                        <!-- Icon -->
                        <span class="text-lg">{{ node.icon || '📍' }}</span>

                        <!-- Name -->
                        <span class="flex-1 truncate text-sm">{{ node.name }}</span>

                        <!-- Current indicator -->
                        <span v-if="isCurrentLocation(node._id)" class="text-xs text-gray-500">(current)</span>
                      </div>

                      <!-- Children -->
                      <div v-if="node.children && node.children.length > 0 && isExpanded(node._id)" class="ml-6">
                        <template v-for="child in node.children" :key="child._id">
                          <div class="location-node">
                            <div
                              @click="selectLocation(child._id)"
                              :class="[
                                'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer',
                                selectedLocationId === child._id
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'hover:bg-gray-100',
                                isCurrentLocation(child._id) ? 'opacity-50' : ''
                              ]"
                            >
                              <button
                                v-if="child.children && child.children.length > 0"
                                @click.stop="toggleNode(child._id)"
                                class="p-0.5 hover:bg-gray-200 rounded"
                              >
                                <svg
                                  :class="['w-4 h-4 text-gray-500 transition-transform', isExpanded(child._id) ? 'rotate-90' : '']"
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                              </button>
                              <span v-else class="w-5"></span>
                              <span class="text-lg">{{ child.icon || '📍' }}</span>
                              <span class="flex-1 truncate text-sm">{{ child.name }}</span>
                              <span v-if="isCurrentLocation(child._id)" class="text-xs text-gray-500">(current)</span>
                            </div>

                            <!-- Grandchildren -->
                            <div v-if="child.children && child.children.length > 0 && isExpanded(child._id)" class="ml-6">
                              <template v-for="grandchild in child.children" :key="grandchild._id">
                                <div
                                  @click="selectLocation(grandchild._id)"
                                  :class="[
                                    'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer',
                                    selectedLocationId === grandchild._id
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'hover:bg-gray-100',
                                    isCurrentLocation(grandchild._id) ? 'opacity-50' : ''
                                  ]"
                                >
                                  <span class="w-5"></span>
                                  <span class="text-lg">{{ grandchild.icon || '📍' }}</span>
                                  <span class="flex-1 truncate text-sm">{{ grandchild.name }}</span>
                                  <span v-if="isCurrentLocation(grandchild._id)" class="text-xs text-gray-500">(current)</span>
                                </div>
                              </template>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              @click="handleMove"
              :disabled="loading || !selectedLocationId || isCurrentLocation(selectedLocationId)"
              class="w-full sm:w-auto btn-primary flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Moving...
              </span>
              <span v-else>Move Item</span>
            </button>
            <button
              @click="handleClose"
              :disabled="loading"
              class="w-full sm:w-auto btn-secondary mt-2 sm:mt-0"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
