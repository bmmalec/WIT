/**
 * ShareList Component
 * Displays list of shares for a location with management options
 */

const { ref, computed, onMounted, watch } = Vue;

// Permission level info
const PERMISSION_INFO = {
  viewer: { label: 'Viewer', icon: '👁️', color: 'gray' },
  contributor: { label: 'Contributor', icon: '➕', color: 'green' },
  editor: { label: 'Editor', icon: '✏️', color: 'blue' },
  manager: { label: 'Manager', icon: '👑', color: 'purple' },
};

// Status info
const STATUS_INFO = {
  pending: { label: 'Pending', color: 'yellow', icon: '⏳' },
  accepted: { label: 'Active', color: 'green', icon: '✓' },
  declined: { label: 'Declined', color: 'red', icon: '✗' },
  revoked: { label: 'Revoked', color: 'gray', icon: '🚫' },
};

export default {
  name: 'ShareList',

  props: {
    locationId: {
      type: String,
      required: true,
    },
    canManage: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['updated'],

  setup(props, { emit }) {
    const shares = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const revoking = ref(null); // Track which share is being revoked

    // Fetch shares
    const fetchShares = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.shares.getLocationShares(props.locationId);
        shares.value = response.data.shares || [];
      } catch (err) {
        console.error('Error fetching shares:', err);
        if (err.code !== 'FORBIDDEN') {
          error.value = err.message || 'Failed to load shares';
        }
      } finally {
        loading.value = false;
      }
    };

    // Watch for location changes
    watch(() => props.locationId, fetchShares, { immediate: true });

    // Revoke a share
    const revokeShare = async (share) => {
      if (!confirm(`Are you sure you want to revoke access for ${share.email || share.userId?.email}?`)) {
        return;
      }

      revoking.value = share._id;

      try {
        await window.api.shares.revoke(share._id);

        if (window.store) {
          window.store.success('Access revoked');
        }

        // Remove from list
        shares.value = shares.value.filter(s => s._id !== share._id);
        emit('updated');
      } catch (err) {
        console.error('Error revoking share:', err);
        if (window.store) {
          window.store.error(err.message || 'Failed to revoke access');
        }
      } finally {
        revoking.value = null;
      }
    };

    // Get permission badge classes
    const getPermissionClasses = (permission) => {
      const info = PERMISSION_INFO[permission] || PERMISSION_INFO.viewer;
      const colorMap = {
        gray: 'bg-gray-100 text-gray-700',
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
      };
      return colorMap[info.color] || colorMap.gray;
    };

    // Get status badge classes
    const getStatusClasses = (status) => {
      const info = STATUS_INFO[status] || STATUS_INFO.pending;
      const colorMap = {
        yellow: 'bg-yellow-100 text-yellow-700',
        green: 'bg-green-100 text-green-700',
        red: 'bg-red-100 text-red-700',
        gray: 'bg-gray-100 text-gray-500',
      };
      return colorMap[info.color] || colorMap.gray;
    };

    // Format relative time
    const formatRelativeTime = (date) => {
      if (!date) return '';
      const now = new Date();
      const then = new Date(date);
      const diffMs = now - then;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return then.toLocaleDateString();
    };

    // Active shares (pending or accepted)
    const activeShares = computed(() => {
      return shares.value.filter(s => s.status === 'pending' || s.status === 'accepted');
    });

    return {
      shares,
      activeShares,
      loading,
      error,
      revoking,
      PERMISSION_INFO,
      STATUS_INFO,
      fetchShares,
      revokeShare,
      getPermissionClasses,
      getStatusClasses,
      formatRelativeTime,
    };
  },

  template: `
    <div class="share-list">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-4">
        <svg class="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-sm text-red-600 py-2">
        {{ error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="activeShares.length === 0" class="text-center py-4 text-gray-500">
        <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <p class="text-sm">No one else has access</p>
      </div>

      <!-- Shares List -->
      <div v-else class="space-y-2">
        <div
          v-for="share in activeShares"
          :key="share._id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <!-- User Info -->
          <div class="flex items-center min-w-0">
            <!-- Avatar -->
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
              {{ (share.userId?.name || share.email || '?')[0].toUpperCase() }}
            </div>

            <div class="ml-3 min-w-0">
              <!-- Name or Email -->
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ share.userId?.name || share.email }}
              </p>
              <!-- Email if we have both name and email -->
              <p v-if="share.userId?.name && share.userId?.email" class="text-xs text-gray-500 truncate">
                {{ share.userId.email }}
              </p>
            </div>
          </div>

          <!-- Right side: badges and actions -->
          <div class="flex items-center gap-2 ml-2">
            <!-- Inherit badge -->
            <span
              v-if="share.inheritToChildren"
              class="text-xs text-gray-400"
              title="Applies to child locations"
            >
              ↓
            </span>

            <!-- Permission badge -->
            <span
              :class="['px-2 py-0.5 text-xs font-medium rounded-full', getPermissionClasses(share.permission)]"
            >
              {{ PERMISSION_INFO[share.permission]?.icon }} {{ PERMISSION_INFO[share.permission]?.label }}
            </span>

            <!-- Status badge (for pending) -->
            <span
              v-if="share.status === 'pending'"
              :class="['px-2 py-0.5 text-xs font-medium rounded-full', getStatusClasses(share.status)]"
            >
              {{ STATUS_INFO[share.status]?.icon }} Pending
            </span>

            <!-- Revoke button -->
            <button
              v-if="canManage"
              @click="revokeShare(share)"
              :disabled="revoking === share._id"
              class="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
              title="Revoke access"
            >
              <svg v-if="revoking === share._id" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Summary -->
        <p class="text-xs text-gray-500 text-right pt-1">
          {{ activeShares.length }} {{ activeShares.length === 1 ? 'person' : 'people' }} with access
        </p>
      </div>
    </div>
  `,
};

export { PERMISSION_INFO, STATUS_INFO };
