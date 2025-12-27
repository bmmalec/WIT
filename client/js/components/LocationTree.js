/**
 * LocationTree Component
 * Displays locations in a hierarchical tree structure
 */

import LocationTreeNode from './LocationTreeNode.js';

const { ref, reactive, computed, onMounted, watch } = Vue;

export default {
  name: 'LocationTree',

  components: {
    LocationTreeNode,
  },

  props: {
    // Pre-loaded tree data (optional, will fetch if not provided)
    tree: {
      type: Array,
      default: null,
    },
    // Currently selected location ID
    selectedId: {
      type: String,
      default: null,
    },
    // Show loading state
    loading: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['select', 'edit', 'delete', 'add-child', 'refresh'],

  setup(props, { emit }) {
    // Internal tree data (used when tree prop is not provided)
    const internalTree = ref([]);
    const internalLoading = ref(false);
    const error = ref(null);

    // Track expanded nodes
    const expandedIds = reactive(new Set());

    // Use provided tree or internal tree
    const treeData = computed(() => {
      return props.tree || internalTree.value;
    });

    // Combined loading state
    const isLoading = computed(() => {
      return props.loading || internalLoading.value;
    });

    // Fetch tree data
    const fetchTree = async () => {
      if (props.tree) return; // Don't fetch if tree is provided

      internalLoading.value = true;
      error.value = null;

      try {
        const response = await window.api.locations.tree();
        internalTree.value = response.data.tree;
      } catch (err) {
        console.error('Failed to fetch location tree:', err);
        error.value = err.message || 'Failed to load locations';
      } finally {
        internalLoading.value = false;
      }
    };

    // Toggle node expansion
    const handleToggle = (nodeId) => {
      if (expandedIds.has(nodeId)) {
        expandedIds.delete(nodeId);
      } else {
        expandedIds.add(nodeId);
      }
    };

    // Handle node selection
    const handleSelect = (node) => {
      emit('select', node);
    };

    // Handle edit
    const handleEdit = (node) => {
      emit('edit', node);
    };

    // Handle delete
    const handleDelete = (node) => {
      emit('delete', node);
    };

    // Handle add child
    const handleAddChild = (parentNode) => {
      emit('add-child', parentNode);
    };

    // Expand all nodes
    const expandAll = () => {
      const addAllIds = (nodes) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            expandedIds.add(node._id);
            addAllIds(node.children);
          }
        });
      };
      addAllIds(treeData.value);
    };

    // Collapse all nodes
    const collapseAll = () => {
      expandedIds.clear();
    };

    // Expand to show a specific node
    const expandToNode = (nodeId) => {
      const findAndExpand = (nodes, targetId) => {
        for (const node of nodes) {
          if (node._id === targetId) {
            return true;
          }
          if (node.children && node.children.length > 0) {
            if (findAndExpand(node.children, targetId)) {
              expandedIds.add(node._id);
              return true;
            }
          }
        }
        return false;
      };
      findAndExpand(treeData.value, nodeId);
    };

    // Refresh tree
    const refresh = () => {
      fetchTree();
      emit('refresh');
    };

    // Count total locations
    const totalCount = computed(() => {
      const count = (nodes) => {
        return nodes.reduce((acc, node) => {
          return acc + 1 + (node.children ? count(node.children) : 0);
        }, 0);
      };
      return count(treeData.value);
    });

    // Watch for external tree changes
    watch(() => props.tree, (newTree) => {
      if (newTree) {
        internalTree.value = [];
      }
    });

    // Fetch on mount if no tree provided
    onMounted(() => {
      if (!props.tree) {
        fetchTree();
      }
    });

    return {
      treeData,
      isLoading,
      error,
      expandedIds,
      totalCount,
      handleToggle,
      handleSelect,
      handleEdit,
      handleDelete,
      handleAddChild,
      expandAll,
      collapseAll,
      expandToNode,
      refresh,
      fetchTree,
    };
  },

  template: `
    <div class="location-tree">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3 px-2">
        <div class="text-sm text-gray-500">
          {{ totalCount }} location{{ totalCount !== 1 ? 's' : '' }}
        </div>
        <div class="flex gap-1">
          <button
            @click="expandAll"
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Expand all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
          </button>
          <button
            @click="collapseAll"
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Collapse all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
            </svg>
          </button>
          <button
            @click="refresh"
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-600 text-sm mb-2">{{ error }}</p>
        <button @click="fetchTree" class="text-sm text-blue-600 hover:underline">
          Try again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="treeData.length === 0" class="text-center py-8 text-gray-500">
        <div class="text-3xl mb-2">🏠</div>
        <p class="text-sm">No locations yet</p>
      </div>

      <!-- Tree -->
      <div v-else class="space-y-0.5">
        <LocationTreeNode
          v-for="node in treeData"
          :key="node._id"
          :node="node"
          :depth="0"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          @select="handleSelect"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @add-child="handleAddChild"
        />
      </div>
    </div>
  `,
};
