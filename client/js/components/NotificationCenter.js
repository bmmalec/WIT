/**
 * NotificationCenter Component
 * Bell icon with dropdown showing notifications
 */

export const NotificationCenter = {
  name: 'NotificationCenter',

  props: {
    api: {
      type: Object,
      required: true,
    },
  },

  emits: ['navigate'],

  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted } = Vue;

    const isOpen = ref(false);
    const notifications = ref([]);
    const unreadCount = ref(0);
    const loading = ref(false);
    const error = ref(null);
    const pollInterval = ref(null);

    // Computed
    const hasUnread = computed(() => unreadCount.value > 0);
    const displayCount = computed(() => unreadCount.value > 99 ? '99+' : unreadCount.value);

    // Format relative time
    const formatTime = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };

    // Get icon for notification type
    const getIcon = (type) => {
      switch (type) {
        case 'expiration':
          return '⏰';
        case 'low_stock':
          return '📦';
        case 'shopping_reminder':
          return '🛒';
        case 'system':
          return '🔔';
        default:
          return '📢';
      }
    };

    // Get priority class
    const getPriorityClass = (priority) => {
      switch (priority) {
        case 'high':
          return 'border-l-4 border-red-500';
        case 'medium':
          return 'border-l-4 border-yellow-500';
        default:
          return 'border-l-4 border-gray-300';
      }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await props.api.notifications.getUnreadCount();
        if (response.success) {
          unreadCount.value = response.data.count;
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await props.api.notifications.getAll({ limit: 10 });
        if (response.success) {
          notifications.value = response.data.notifications;
          unreadCount.value = response.data.unreadCount;
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        error.value = 'Failed to load notifications';
      } finally {
        loading.value = false;
      }
    };

    // Toggle dropdown
    const toggleDropdown = async () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        await fetchNotifications();
      }
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('notification-dropdown');
      const button = document.getElementById('notification-button');
      if (dropdown && button && !dropdown.contains(event.target) && !button.contains(event.target)) {
        isOpen.value = false;
      }
    };

    // Mark notification as read
    const markAsRead = async (notification) => {
      if (notification.status === 'read') return;

      try {
        await props.api.notifications.markRead(notification._id);
        notification.status = 'read';
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    };

    // Dismiss notification
    const dismissNotification = async (notification, event) => {
      event.stopPropagation();

      try {
        await props.api.notifications.dismiss(notification._id);
        notifications.value = notifications.value.filter(n => n._id !== notification._id);
        if (notification.status === 'unread') {
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
      } catch (err) {
        console.error('Failed to dismiss notification:', err);
      }
    };

    // Mark all as read
    const markAllAsRead = async () => {
      try {
        await props.api.notifications.markAllRead();
        notifications.value.forEach(n => n.status = 'read');
        unreadCount.value = 0;
      } catch (err) {
        console.error('Failed to mark all as read:', err);
      }
    };

    // Navigate to related item
    const navigateToItem = (notification) => {
      markAsRead(notification);
      isOpen.value = false;

      // If there are related items, navigate to the first one's location
      if (notification.relatedItems && notification.relatedItems.length > 0) {
        const firstItem = notification.relatedItems[0];
        if (firstItem.locationId) {
          emit('navigate', 'location', firstItem.locationId);
        }
      }
    };

    // Lifecycle
    onMounted(() => {
      fetchUnreadCount();
      // Poll for new notifications every 60 seconds
      pollInterval.value = setInterval(fetchUnreadCount, 60000);
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      if (pollInterval.value) {
        clearInterval(pollInterval.value);
      }
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isOpen,
      notifications,
      unreadCount,
      loading,
      error,
      hasUnread,
      displayCount,
      toggleDropdown,
      formatTime,
      getIcon,
      getPriorityClass,
      markAsRead,
      dismissNotification,
      markAllAsRead,
      navigateToItem,
    };
  },

  template: `
    <div class="relative">
      <!-- Bell Button -->
      <button
        id="notification-button"
        @click="toggleDropdown"
        class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        :aria-label="hasUnread ? 'Notifications (' + unreadCount + ' unread)' : 'Notifications'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        <!-- Unread Badge -->
        <span
          v-if="hasUnread"
          class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px]"
        >
          {{ displayCount }}
        </span>
      </button>

      <!-- Dropdown -->
      <div
        v-if="isOpen"
        id="notification-dropdown"
        class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
          <button
            v-if="hasUnread"
            @click="markAllAsRead"
            class="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        </div>

        <!-- Content -->
        <div class="max-h-96 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="px-4 py-8 text-center">
            <p class="text-sm text-red-600">{{ error }}</p>
            <button
              @click="fetchNotifications"
              class="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="notifications.length === 0" class="px-4 py-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">No notifications</p>
          </div>

          <!-- Notification List -->
          <div v-else>
            <div
              v-for="notification in notifications"
              :key="notification._id"
              @click="navigateToItem(notification)"
              :class="[
                'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                getPriorityClass(notification.priority),
                notification.status === 'unread' ? 'bg-blue-50' : ''
              ]"
            >
              <div class="flex items-start gap-3">
                <!-- Icon -->
                <span class="text-xl flex-shrink-0 mt-0.5">{{ getIcon(notification.type) }}</span>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p :class="['text-sm', notification.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-700']">
                      {{ notification.title }}
                    </p>
                    <button
                      @click="dismissNotification(notification, $event)"
                      class="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Dismiss"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ notification.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatTime(notification.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            @click="$emit('navigate', 'settings'); isOpen = false"
            class="w-full text-center text-sm text-blue-600 hover:text-blue-800"
          >
            Notification Settings
          </button>
        </div>
      </div>
    </div>
  `,
};

export default NotificationCenter;
