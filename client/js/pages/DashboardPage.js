/**
 * DashboardPage Component
 * Main dashboard with location management
 */

import LocationCard from '../components/LocationCard.js';
import LocationForm from '../components/LocationForm.js';
import LocationTree from '../components/LocationTree.js';
import Breadcrumb from '../components/Breadcrumb.js';
import ShareDialog from '../components/ShareDialog.js';
import ShareList from '../components/ShareList.js';
import ItemCard from '../components/ItemCard.js';
import ItemForm from '../components/ItemForm.js';
import MoveItemDialog from '../components/MoveItemDialog.js';
import ExpirationFilterPanel from '../components/ExpirationFilterPanel.js';
import ExpirationWidget from '../components/ExpirationWidget.js';
import LowStockWidget from '../components/LowStockWidget.js';
import ConsumptionHistoryWidget from '../components/ConsumptionHistoryWidget.js';
import SearchBar from '../components/SearchBar.js';
import SearchResults from '../components/SearchResults.js';
import SearchFilters from '../components/SearchFilters.js';
import BulkImportModal from '../components/BulkImportModal.js';
import ShoppingListPanel from '../components/ShoppingListPanel.js';
import AnalyticsWidget from '../components/AnalyticsWidget.js';
import NotificationCenter from '../components/NotificationCenter.js';

const { ref, computed, onMounted, watch } = Vue;

export default {
  name: 'DashboardPage',

  components: {
    LocationCard,
    LocationForm,
    LocationTree,
    Breadcrumb,
    ShareDialog,
    ShareList,
    ItemCard,
    ItemForm,
    MoveItemDialog,
    ExpirationFilterPanel,
    ExpirationWidget,
    LowStockWidget,
    ConsumptionHistoryWidget,
    SearchBar,
    SearchResults,
    SearchFilters,
    BulkImportModal,
    ShoppingListPanel,
    AnalyticsWidget,
    NotificationCenter,
  },

  setup() {
    const user = computed(() => window.store?.state?.user);
    const locations = ref([]);
    const locationTree = ref([]);
    const loading = ref(true);
    const error = ref(null);

    // View mode: 'grid' or 'tree'
    const viewMode = ref(window.store?.state?.user?.settings?.defaultView || 'grid');

    // Modal state
    const showCreateModal = ref(false);
    const editingLocation = ref(null);
    const parentLocation = ref(null); // For adding sub-locations
    const showDeleteConfirm = ref(false);
    const deletingLocation = ref(null);
    const deleting = ref(false);
    const cascadeDelete = ref(false);

    // Selected location detail panel
    const selectedLocation = ref(null);
    const selectedAncestors = ref([]);
    const loadingDetail = ref(false);
    const showDetailPanel = ref(false);

    // Share dialog state
    const showShareDialog = ref(false);
    const shareListKey = ref(0); // For refreshing share list

    // Pending invites and shared locations
    const pendingInvites = ref([]);
    const sharedLocations = ref([]);
    const loadingInvites = ref(false);
    const processingInvite = ref(null);
    const leavingShare = ref(null);

    // Items state
    const items = ref([]);
    const loadingItems = ref(false);
    const showItemForm = ref(false);
    const editingItem = ref(null);
    const categories = ref([]);
    const showDeleteItemConfirm = ref(false);
    const deletingItem = ref(null);
    const deletingItemLoading = ref(false);
    const showMoveDialog = ref(false);
    const movingItem = ref(null);

    // Bulk import state
    const activeBulkSession = ref(null);
    const showBulkImport = ref(false);

    // Shopping list panel
    const showShoppingList = ref(false);

    // Expiration filter panel
    const showExpirationPanel = ref(false);
    const expirationPanelFilter = ref(null); // Initial filter when opening panel

    // Search state
    const searchQuery = ref('');
    const searchResults = ref([]);
    const searchLoading = ref(false);
    const showSearchResults = ref(false);
    const searchSuggestions = ref([]);
    const searchFuzzyMatches = ref(0);
    const searchSynonymsUsed = ref([]);
    const searchMethod = ref('text');
    const searchFilters = ref({
      locationId: null,
      categoryId: null,
      expirationStatus: null,
      storageType: null,
    });

    // Fetch locations (both flat and tree)
    const fetchLocations = async () => {
      loading.value = true;
      error.value = null;

      try {
        // Fetch both views in parallel
        const [listResponse, treeResponse] = await Promise.all([
          window.api.locations.list(),
          window.api.locations.tree(),
        ]);
        // Filter to only top-level locations for grid view
        locations.value = listResponse.data.locations.filter(loc => !loc.parentId);
        // Store tree data for tree view
        locationTree.value = treeResponse.data.tree;
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        error.value = err.message || 'Failed to load locations';
      } finally {
        loading.value = false;
      }
    };

    // Toggle view mode
    const toggleViewMode = () => {
      viewMode.value = viewMode.value === 'grid' ? 'tree' : 'grid';
    };

    // Fetch pending invites and shared locations
    const fetchInvitesAndShares = async () => {
      loadingInvites.value = true;
      try {
        const [invitesRes, sharesRes] = await Promise.all([
          window.api.shares.getPendingInvites(),
          window.api.shares.getMyShares(),
        ]);
        pendingInvites.value = invitesRes.data.invites || [];
        sharedLocations.value = sharesRes.data.shares || [];
      } catch (err) {
        console.error('Failed to fetch invites/shares:', err);
      } finally {
        loadingInvites.value = false;
      }
    };

    // Accept pending invite
    const acceptInvite = async (invite) => {
      processingInvite.value = invite._id;
      try {
        await window.api.shares.acceptInvite(invite.inviteToken);
        window.store?.success('Invitation accepted!');
        // Refresh data
        await Promise.all([fetchLocations(), fetchInvitesAndShares()]);
      } catch (err) {
        console.error('Failed to accept invite:', err);
        window.store?.error(err.message || 'Failed to accept invitation');
      } finally {
        processingInvite.value = null;
      }
    };

    // Decline pending invite
    const declineInvite = async (invite) => {
      processingInvite.value = invite._id;
      try {
        await window.api.shares.declineInvite(invite.inviteToken);
        window.store?.info('Invitation declined');
        // Remove from list
        pendingInvites.value = pendingInvites.value.filter(i => i._id !== invite._id);
      } catch (err) {
        console.error('Failed to decline invite:', err);
        window.store?.error(err.message || 'Failed to decline invitation');
      } finally {
        processingInvite.value = null;
      }
    };

    // Get permission label
    const getPermissionLabel = (permission) => {
      const labels = {
        viewer: 'Viewer',
        contributor: 'Contributor',
        editor: 'Editor',
        manager: 'Manager',
      };
      return labels[permission] || permission;
    };

    // Leave a shared location
    const leaveShare = async (share) => {
      if (!confirm(`Are you sure you want to leave "${share.locationId?.name}"? You will lose access to this location.`)) {
        return;
      }

      leavingShare.value = share._id;
      try {
        await window.api.shares.leave(share._id);
        window.store?.success('You have left the shared location');
        // Remove from list
        sharedLocations.value = sharedLocations.value.filter(s => s._id !== share._id);
        // Refresh locations in case they were visible
        await fetchLocations();
      } catch (err) {
        console.error('Failed to leave share:', err);
        window.store?.error(err.message || 'Failed to leave shared location');
      } finally {
        leavingShare.value = null;
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await window.api.categories.getAll();
        categories.value = response.data.categories || [];
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    // Fetch items for selected location
    const fetchItems = async (locationId) => {
      if (!locationId) return;

      loadingItems.value = true;
      try {
        const response = await window.api.items.getByLocation(locationId);
        items.value = response.data.items || [];
      } catch (err) {
        console.error('Failed to fetch items:', err);
        items.value = [];
      } finally {
        loadingItems.value = false;
      }
    };

    // Open item form for creating
    const openItemForm = (location = null) => {
      editingItem.value = null;
      if (location) {
        selectedLocation.value = location;
        showItemForm.value = true;
      } else if (selectedLocation.value) {
        // Use already selected location
        showItemForm.value = true;
      } else if (locations.value.length > 0) {
        // No location selected - show message
        window.store?.info('Please select a location first to add an item');
      }
    };

    // Open item form for editing
    const openEditItemForm = (item) => {
      editingItem.value = item;
      showItemForm.value = true;
    };

    // Close item form
    const closeItemForm = () => {
      showItemForm.value = false;
      editingItem.value = null;
    };

    // Handle item form success
    const handleItemFormSuccess = async () => {
      closeItemForm();
      if (selectedLocation.value) {
        await fetchItems(selectedLocation.value._id);
      }
      window.store?.success(editingItem.value ? 'Item updated' : 'Item created');
    };

    // Open delete item confirmation
    const openDeleteItemConfirm = (item) => {
      deletingItem.value = item;
      showDeleteItemConfirm.value = true;
    };

    // Close delete item confirmation
    const closeDeleteItemConfirm = () => {
      showDeleteItemConfirm.value = false;
      deletingItem.value = null;
    };

    // Handle item delete
    const handleDeleteItem = async () => {
      if (!deletingItem.value) return;

      deletingItemLoading.value = true;
      try {
        await window.api.items.delete(deletingItem.value._id);
        window.store?.success('Item deleted');
        closeDeleteItemConfirm();
        if (selectedLocation.value) {
          await fetchItems(selectedLocation.value._id);
        }
      } catch (err) {
        console.error('Failed to delete item:', err);
        window.store?.error(err.message || 'Failed to delete item');
      } finally {
        deletingItemLoading.value = false;
      }
    };

    // Handle item quantity adjustment
    const handleQuantityAdjust = async ({ item, delta }) => {
      // Refresh items to get updated quantity
      if (selectedLocation.value) {
        await fetchItems(selectedLocation.value._id);
      }
    };

    // Open move item dialog
    const openMoveDialog = (item) => {
      movingItem.value = item;
      showMoveDialog.value = true;
    };

    // Close move item dialog
    const closeMoveDialog = () => {
      showMoveDialog.value = false;
      movingItem.value = null;
    };

    // Handle item moved
    const handleItemMoved = async ({ item, newLocationId }) => {
      closeMoveDialog();
      // Refresh items in current location (item was moved away)
      if (selectedLocation.value) {
        await fetchItems(selectedLocation.value._id);
      }
      // Refresh locations to update item counts
      await fetchLocations();
    };

    // Handle item consumed
    const handleItemConsumed = async (item) => {
      // Refresh items in current location (item is now inactive)
      if (selectedLocation.value) {
        await fetchItems(selectedLocation.value._id);
      }
      // Refresh locations to update item counts
      await fetchLocations();
    };

    // Handle item discarded
    const handleItemDiscarded = async (item) => {
      // Refresh items in current location (item is now inactive)
      if (selectedLocation.value) {
        await fetchItems(selectedLocation.value._id);
      }
      // Refresh locations to update item counts
      await fetchLocations();
    };

    // Handle low stock item click
    const handleLowStockItemClick = async (item) => {
      // Navigate to the item's location and open the item for editing
      if (item.locationId) {
        try {
          const locId = item.locationId._id || item.locationId;
          const response = await window.api.locations.get(locId);
          selectedLocation.value = response.data.location;
          showDetailPanel.value = true;

          // Fetch breadcrumb and items
          const [breadcrumbRes] = await Promise.all([
            window.api.locations.getBreadcrumb(selectedLocation.value._id),
            fetchItems(selectedLocation.value._id),
          ]);
          selectedAncestors.value = breadcrumbRes.data.ancestors || [];

          // Open item for editing
          editingItem.value = item;
          showItemForm.value = true;
        } catch (err) {
          console.error('Failed to navigate to item:', err);
          // Just open the item form directly
          editingItem.value = item;
          showItemForm.value = true;
        }
      } else {
        // Just open the item form
        editingItem.value = item;
        showItemForm.value = true;
      }
    };

    // Open expiration panel
    const openExpirationPanel = (filter = null) => {
      expirationPanelFilter.value = filter;
      showExpirationPanel.value = true;
    };

    // Close expiration panel
    const closeExpirationPanel = () => {
      showExpirationPanel.value = false;
      expirationPanelFilter.value = null;
    };

    // Handle widget filter click
    const handleWidgetFilter = (status) => {
      openExpirationPanel(status);
    };

    // Handle item click from expiration panel
    const handleExpirationItemClick = (item) => {
      // Close expiration panel and open item for editing
      closeExpirationPanel();
      editingItem.value = item;
      showItemForm.value = true;
    };

    // Search items
    const handleSearch = async (query) => {
      searchQuery.value = query;
      searchLoading.value = true;
      showSearchResults.value = true;

      try {
        const response = await window.api.items.search(query, {
          limit: 20,
          ...searchFilters.value,
        });
        searchResults.value = response.data.items || [];
        searchSuggestions.value = response.data.suggestions || [];
        searchFuzzyMatches.value = response.data.fuzzyMatches || 0;
        searchSynonymsUsed.value = response.data.synonymsUsed || [];
        searchMethod.value = response.data.searchMethod || 'text';
      } catch (err) {
        console.error('Search failed:', err);
        searchResults.value = [];
        searchSuggestions.value = [];
        searchFuzzyMatches.value = 0;
        searchSynonymsUsed.value = [];
      } finally {
        searchLoading.value = false;
      }
    };

    // Handle filter change - re-search if query exists
    const handleFilterChange = async (newFilters) => {
      searchFilters.value = newFilters;
      if (searchQuery.value && searchQuery.value.length >= 2) {
        await handleSearch(searchQuery.value);
      }
    };

    // Clear search
    const handleSearchClear = () => {
      searchQuery.value = '';
      searchResults.value = [];
      searchSuggestions.value = [];
      searchFuzzyMatches.value = 0;
      searchSynonymsUsed.value = [];
      showSearchResults.value = false;
    };

    // Handle suggestion click from search results
    const handleSearchSuggestion = (suggestion) => {
      handleSearch(suggestion);
    };

    // Handle search result selection
    const handleSearchSelect = async (item) => {
      showSearchResults.value = false;
      searchQuery.value = '';
      searchResults.value = [];

      // Find and select the location, then open item for editing
      if (item.locationId) {
        try {
          const response = await window.api.locations.getById(item.locationId._id || item.locationId);
          selectedLocation.value = response.data.location;
          showDetailPanel.value = true;

          // Fetch breadcrumb and items
          const [breadcrumbRes] = await Promise.all([
            window.api.locations.getBreadcrumb(selectedLocation.value._id),
            fetchItems(selectedLocation.value._id),
          ]);
          selectedAncestors.value = breadcrumbRes.data.ancestors || [];

          // Open item for editing
          editingItem.value = item;
          showItemForm.value = true;
        } catch (err) {
          console.error('Failed to navigate to item:', err);
          // Just open the item form directly
          editingItem.value = item;
          showItemForm.value = true;
        }
      } else {
        // Just open the item form
        editingItem.value = item;
        showItemForm.value = true;
      }
    };

    // Handle search focus
    const handleSearchFocus = () => {
      if (searchResults.value.length > 0) {
        showSearchResults.value = true;
      }
    };

    // Handle search blur (with delay for click handling)
    const handleSearchBlur = () => {
      setTimeout(() => {
        showSearchResults.value = false;
      }, 200);
    };

    // Handle logout
    const handleLogout = async () => {
      try {
        await window.api.auth.logout();
        window.store?.clearUser();
        window.store?.success('Logged out successfully');
        window.router?.push('/login');
      } catch (err) {
        console.error('Logout error:', err);
        window.store?.clearUser();
        window.router?.push('/login');
      }
    };

    // Navigate to profile
    const goToProfile = () => {
      window.router?.push('/profile');
    };

    // Open create modal
    const openCreateModal = () => {
      editingLocation.value = null;
      parentLocation.value = null;
      showCreateModal.value = true;
    };

    // Open create modal with parent (for sub-locations)
    const openCreateWithParent = (parent) => {
      editingLocation.value = null;
      parentLocation.value = parent;
      showCreateModal.value = true;
    };

    // Open edit modal
    const openEditModal = (location) => {
      editingLocation.value = location;
      parentLocation.value = null;
      showCreateModal.value = true;
    };

    // Close modal
    const closeModal = () => {
      showCreateModal.value = false;
      editingLocation.value = null;
      parentLocation.value = null;
    };

    // Handle form success
    const handleFormSuccess = (location) => {
      closeModal();
      fetchLocations();
    };

    // Handle location click (show detail panel with breadcrumb)
    const handleLocationClick = async (location) => {
      selectedLocation.value = location;
      showDetailPanel.value = true;
      loadingDetail.value = true;
      items.value = []; // Clear items while loading

      try {
        // Fetch breadcrumb and items in parallel
        const [breadcrumbRes] = await Promise.all([
          window.api.locations.getBreadcrumb(location._id),
          fetchItems(location._id),
        ]);
        selectedAncestors.value = breadcrumbRes.data.ancestors || [];
      } catch (err) {
        console.error('Failed to fetch breadcrumb:', err);
        selectedAncestors.value = [];
      } finally {
        loadingDetail.value = false;
      }
    };

    // Close detail panel
    const closeDetailPanel = () => {
      showDetailPanel.value = false;
      selectedLocation.value = null;
      selectedAncestors.value = [];
      items.value = [];
    };

    // Handle breadcrumb navigation
    const handleBreadcrumbNavigate = (item) => {
      handleLocationClick(item);
    };

    // Handle breadcrumb home
    const handleBreadcrumbHome = () => {
      closeDetailPanel();
    };

    // Open share dialog
    const openShareDialog = () => {
      showShareDialog.value = true;
    };

    // Close share dialog
    const closeShareDialog = () => {
      showShareDialog.value = false;
    };

    // Handle successful invite
    const handleShareInvited = () => {
      shareListKey.value++; // Refresh share list
    };

    // Open delete confirmation
    const openDeleteConfirm = (location) => {
      deletingLocation.value = location;
      showDeleteConfirm.value = true;
    };

    // Close delete confirmation
    const closeDeleteConfirm = () => {
      showDeleteConfirm.value = false;
      deletingLocation.value = null;
      cascadeDelete.value = false;
    };

    // Handle delete
    const handleDelete = async () => {
      if (!deletingLocation.value) return;

      // If has children and cascade not enabled, show error
      if (deletingLocation.value.childCount > 0 && !cascadeDelete.value) {
        window.store?.error('Please enable "Delete all sub-locations" to delete this location.');
        return;
      }

      deleting.value = true;

      try {
        await window.api.locations.delete(deletingLocation.value._id, {
          cascade: cascadeDelete.value,
        });
        const message = cascadeDelete.value
          ? 'Location and all sub-locations deleted'
          : 'Location deleted';
        window.store?.success(message);
        closeDeleteConfirm();
        fetchLocations();
      } catch (err) {
        console.error('Delete error:', err);
        if (err.code === 'HAS_CHILDREN') {
          window.store?.error('Location has sub-locations. Enable cascade delete to remove them.');
        } else {
          window.store?.error(err.message || 'Failed to delete location');
        }
      } finally {
        deleting.value = false;
      }
    };

    // Check for active bulk import session
    const checkActiveBulkSession = async () => {
      try {
        const response = await window.api.bulkSessions.getActive();
        activeBulkSession.value = response.data.session;
      } catch (err) {
        console.error('Failed to check bulk session:', err);
      }
    };

    // Start bulk import
    const startBulkImport = () => {
      if (activeBulkSession.value) {
        // Resume existing session
        showBulkImport.value = true;
      } else if (locations.value.length > 0) {
        // Start new session with first location as target
        showBulkImport.value = true;
      }
    };

    // Close bulk import modal
    const closeBulkImport = () => {
      showBulkImport.value = false;
    };

    // Handle bulk session started
    const handleBulkSessionStarted = (session) => {
      activeBulkSession.value = session;
    };

    // Handle bulk session committed
    const handleBulkSessionCommitted = (result) => {
      activeBulkSession.value = null;
      // Refresh items if we're viewing a location
      if (selectedLocation.value) {
        fetchItems(selectedLocation.value._id);
      }
    };

    // Handle bulk session cancelled
    const handleBulkSessionCancelled = () => {
      activeBulkSession.value = null;
    };

    // Open shopping list panel
    const openShoppingList = () => {
      showShoppingList.value = true;
    };

    // Close shopping list panel
    const closeShoppingList = () => {
      showShoppingList.value = false;
    };

    // Navigate to analytics page
    const goToAnalytics = () => {
      window.router?.push('/analytics');
    };

    // Handle notification navigation
    const handleNotificationNavigate = async (type, id) => {
      if (type === 'settings') {
        window.router?.push('/settings');
      } else if (type === 'location' && id) {
        // Find and open the location
        try {
          const response = await window.api.locations.get(id);
          if (response.success && response.data.location) {
            handleLocationClick(response.data.location);
          }
        } catch (err) {
          console.error('Failed to navigate to location:', err);
        }
      }
    };

    onMounted(() => {
      fetchLocations();
      fetchInvitesAndShares();
      fetchCategories();
      checkActiveBulkSession();
    });

    return {
      user,
      locations,
      locationTree,
      loading,
      error,
      viewMode,
      showCreateModal,
      editingLocation,
      parentLocation,
      showDeleteConfirm,
      deletingLocation,
      deleting,
      cascadeDelete,
      selectedLocation,
      selectedAncestors,
      loadingDetail,
      showDetailPanel,
      showShareDialog,
      shareListKey,
      pendingInvites,
      sharedLocations,
      loadingInvites,
      processingInvite,
      // Items
      items,
      loadingItems,
      showItemForm,
      editingItem,
      categories,
      showDeleteItemConfirm,
      deletingItem,
      deletingItemLoading,
      handleLogout,
      goToProfile,
      openCreateModal,
      openCreateWithParent,
      openEditModal,
      closeModal,
      handleFormSuccess,
      handleLocationClick,
      closeDetailPanel,
      handleBreadcrumbNavigate,
      handleBreadcrumbHome,
      openShareDialog,
      closeShareDialog,
      handleShareInvited,
      openDeleteConfirm,
      closeDeleteConfirm,
      handleDelete,
      fetchLocations,
      toggleViewMode,
      fetchInvitesAndShares,
      acceptInvite,
      declineInvite,
      getPermissionLabel,
      leaveShare,
      leavingShare,
      // Item methods
      openItemForm,
      openEditItemForm,
      closeItemForm,
      handleItemFormSuccess,
      openDeleteItemConfirm,
      closeDeleteItemConfirm,
      handleDeleteItem,
      handleQuantityAdjust,
      fetchItems,
      // Move dialog
      showMoveDialog,
      movingItem,
      openMoveDialog,
      closeMoveDialog,
      handleItemMoved,
      // Consume/Discard handlers
      handleItemConsumed,
      handleItemDiscarded,
      // Low stock handler
      handleLowStockItemClick,
      // Expiration panel
      showExpirationPanel,
      expirationPanelFilter,
      openExpirationPanel,
      closeExpirationPanel,
      handleExpirationItemClick,
      handleWidgetFilter,
      // Search
      searchQuery,
      searchResults,
      searchLoading,
      showSearchResults,
      searchSuggestions,
      searchFuzzyMatches,
      searchSynonymsUsed,
      searchMethod,
      searchFilters,
      handleSearch,
      handleSearchClear,
      handleSearchSelect,
      handleSearchSuggestion,
      handleSearchFocus,
      handleSearchBlur,
      handleFilterChange,
      activeBulkSession,
      showBulkImport,
      startBulkImport,
      closeBulkImport,
      handleBulkSessionStarted,
      handleBulkSessionCommitted,
      handleBulkSessionCancelled,
      // Shopping list
      showShoppingList,
      openShoppingList,
      closeShoppingList,
      // Analytics
      goToAnalytics,
      // Notifications
      handleNotificationNavigate,
    };
  },

  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-blue-600">WIT</h1>
            </div>

            <div class="flex items-center gap-4">
              <!-- Notification Center -->
              <NotificationCenter
                :api="window.api"
                @navigate="handleNotificationNavigate"
              />

              <button
                @click="goToProfile"
                class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>{{ user?.name }}</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
              <button @click="handleLogout" class="btn-secondary text-sm">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Welcome Section -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            Welcome, {{ user?.name }}!
          </h2>
          <p class="text-gray-600">
            Manage your locations and items. Start by creating your first location.
          </p>
        </div>

        <!-- Pending Invitations Banner -->
        <div v-if="pendingInvites.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-blue-800">
                You have {{ pendingInvites.length }} pending invitation{{ pendingInvites.length > 1 ? 's' : '' }}
              </h3>
              <div class="mt-3 space-y-2">
                <div
                  v-for="invite in pendingInvites"
                  :key="invite._id"
                  class="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                >
                  <div class="flex items-center min-w-0">
                    <span class="text-xl mr-2">{{ invite.locationId?.icon || '📍' }}</span>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ invite.locationId?.name }}</p>
                      <p class="text-xs text-gray-500">
                        From {{ invite.invitedBy?.name }} · {{ getPermissionLabel(invite.permission) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <button
                      @click="declineInvite(invite)"
                      :disabled="processingInvite === invite._id"
                      class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Decline
                    </button>
                    <button
                      @click="acceptInvite(invite)"
                      :disabled="processingInvite === invite._id"
                      class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <span v-if="processingInvite === invite._id">...</span>
                      <span v-else>Accept</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Shared With Me Section -->
        <div v-if="sharedLocations.length > 0" class="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Shared With Me
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="share in sharedLocations"
              :key="share._id"
              class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group relative"
            >
              <div
                @click="handleLocationClick(share.locationId)"
                class="flex items-start cursor-pointer"
              >
                <span class="text-2xl mr-3">{{ share.locationId?.icon || '📍' }}</span>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-gray-900 truncate">{{ share.locationId?.name }}</p>
                  <p class="text-sm text-gray-500 capitalize">{{ share.locationId?.type?.replace('_', ' ') }}</p>
                  <div class="mt-2 flex items-center text-xs text-gray-500">
                    <span class="px-2 py-0.5 bg-gray-200 rounded-full">{{ getPermissionLabel(share.permission) }}</span>
                    <span class="ml-2">from {{ share.invitedBy?.name }}</span>
                  </div>
                </div>
              </div>
              <!-- Leave button -->
              <button
                @click.stop="leaveShare(share)"
                :disabled="leavingShare === share._id"
                class="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title="Leave shared location"
              >
                <svg v-if="leavingShare === share._id" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            @click="openCreateModal"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-400"
          >
            <div class="text-3xl mb-3">📍</div>
            <h3 class="font-semibold text-gray-900 mb-1">Add Location</h3>
            <p class="text-sm text-gray-600">Create a new storage location like a room, cabinet, or box.</p>
          </div>

          <div
            @click="locations.length > 0 ? openItemForm() : null"
            :class="[
              'bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-dashed border-gray-200 hover:border-blue-400',
              locations.length > 0 ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            ]"
          >
            <div class="text-3xl mb-3">📦</div>
            <h3 class="font-semibold text-gray-900 mb-1">Add Item</h3>
            <p class="text-sm text-gray-600">Add items to your inventory with photos or barcodes.</p>
            <p v-if="locations.length === 0" class="text-xs text-gray-400 mt-2">Create a location first</p>
          </div>

          <div
            @click="locations.length > 0 ? startBulkImport() : null"
            :class="[
              'bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-dashed border-gray-200 hover:border-green-400',
              locations.length > 0 ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            ]"
          >
            <div class="text-3xl mb-3">📥</div>
            <h3 class="font-semibold text-gray-900 mb-1">Bulk Import</h3>
            <p class="text-sm text-gray-600">Quickly scan and add many items at once.</p>
            <p v-if="locations.length === 0" class="text-xs text-gray-400 mt-2">Create a location first</p>
            <p v-else-if="activeBulkSession" class="text-xs text-green-600 mt-2">Session active - {{ activeBulkSession.pendingCount }} pending</p>
          </div>

          <div
            @click="openShoppingList"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-green-400"
          >
            <div class="text-3xl mb-3">🛒</div>
            <h3 class="font-semibold text-gray-900 mb-1">Shopping List</h3>
            <p class="text-sm text-gray-600">Track items you need to buy and get suggestions.</p>
          </div>
        </div>

        <!-- Search Section -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div class="flex items-start gap-4">
            <div class="text-3xl">🔍</div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 mb-1">Search Items</h3>
            <p class="text-sm text-gray-600 mb-3">Find items quickly with smart search.</p>
            <SearchBar
              placeholder="Search by name, brand, tags..."
              @search="handleSearch"
              @clear="handleSearchClear"
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
            />
            <!-- Search Filters -->
            <div class="mt-3">
              <SearchFilters
                :locations="locationTree"
                :categories="categories"
                :filters="searchFilters"
                @change="handleFilterChange"
                :compact="true"
              />
            </div>
            <SearchResults
              :results="searchResults"
              :loading="searchLoading"
              :query="searchQuery"
              :show="showSearchResults"
              :suggestions="searchSuggestions"
              :fuzzyMatches="searchFuzzyMatches"
              :synonymsUsed="searchSynonymsUsed"
              :searchMethod="searchMethod"
              @select="handleSearchSelect"
              @close="handleSearchClear"
              @search="handleSearchSuggestion"
            />
            </div>
          </div>
        </div>

        <!-- Dashboard Widgets -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsWidget @view-details="goToAnalytics" />
          <ExpirationWidget
            @click="openExpirationPanel()"
            @filter="handleWidgetFilter"
          />
          <LowStockWidget
            @item-click="handleLowStockItemClick"
          />
          <ConsumptionHistoryWidget />
        </div>

        <!-- My Locations -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900">My Locations</h3>
            <div class="flex items-center gap-3">
              <!-- View Toggle -->
              <div class="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  @click="viewMode = 'grid'"
                  :class="[
                    'p-1.5 rounded transition-colors',
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  ]"
                  title="Grid view"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                </button>
                <button
                  @click="viewMode = 'tree'"
                  :class="[
                    'p-1.5 rounded transition-colors',
                    viewMode === 'tree'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  ]"
                  title="Tree view"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                </button>
              </div>
              <button @click="openCreateModal" class="btn-primary text-sm">
                + Add Location
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <p class="text-red-600 mb-4">{{ error }}</p>
            <button @click="fetchLocations" class="btn-primary">Try Again</button>
          </div>

          <!-- Empty State -->
          <div v-else-if="locationTree.length === 0" class="text-center py-12 text-gray-500">
            <div class="text-4xl mb-4">🏠</div>
            <p class="mb-2">No locations yet</p>
            <p class="text-sm mb-4">Create your first location to start organizing your inventory.</p>
            <button @click="openCreateModal" class="btn-primary">
              Create Your First Location
            </button>
          </div>

          <!-- Tree View -->
          <div v-else-if="viewMode === 'tree'">
            <LocationTree
              :tree="locationTree"
              :loading="loading"
              @select="handleLocationClick"
              @edit="openEditModal"
              @delete="openDeleteConfirm"
              @add-child="openCreateWithParent"
              @refresh="fetchLocations"
            />
          </div>

          <!-- Grid View -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LocationCard
              v-for="location in locations"
              :key="location._id"
              :location="location"
              @click="handleLocationClick"
              @edit="openEditModal"
              @delete="openDeleteConfirm"
            />
          </div>
        </div>
      </main>

      <!-- Create/Edit Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeModal"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeModal"></div>

          <!-- Modal Content -->
          <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ editingLocation ? 'Edit Location' : (parentLocation ? 'Add Sub-Location' : 'Create Location') }}
                </h3>
                <button
                  @click="closeModal"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Parent location indicator -->
              <div v-if="parentLocation && !editingLocation" class="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                <span class="text-gray-600">Adding to: </span>
                <span class="font-medium text-blue-700">{{ parentLocation.name }}</span>
              </div>

              <LocationForm
                :location="editingLocation"
                :parent-id="parentLocation?._id"
                @success="handleFormSuccess"
                @cancel="closeModal"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeDeleteConfirm"></div>

          <!-- Modal Content -->
          <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div class="flex items-start">
                <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div class="ml-4 flex-1">
                  <h3 class="text-lg font-medium text-gray-900">Delete Location</h3>
                  <p class="mt-2 text-sm text-gray-500">
                    Are you sure you want to delete "{{ deletingLocation?.name }}"? This action cannot be undone.
                  </p>

                  <!-- Sub-locations warning and cascade option -->
                  <div v-if="deletingLocation?.childCount > 0" class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p class="text-sm text-orange-800 font-medium">
                      This location has {{ deletingLocation.childCount }} sub-location(s).
                    </p>
                    <label class="mt-2 flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        v-model="cascadeDelete"
                        class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span class="ml-2 text-sm text-orange-700">
                        Delete all sub-locations too
                      </span>
                    </label>
                  </div>

                  <!-- Items warning -->
                  <p v-if="deletingLocation?.itemCount > 0" class="mt-2 text-sm text-orange-600">
                    This location contains {{ deletingLocation.itemCount }} item(s) that will also be affected.
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                @click="handleDelete"
                :disabled="deleting || (deletingLocation?.childCount > 0 && !cascadeDelete)"
                :class="[
                  'w-full sm:w-auto flex justify-center items-center',
                  (deletingLocation?.childCount > 0 && !cascadeDelete) ? 'btn-secondary cursor-not-allowed' : 'btn-danger'
                ]"
              >
                <span v-if="deleting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
                <span v-else>{{ cascadeDelete ? 'Delete All' : 'Delete' }}</span>
              </button>
              <button
                @click="closeDeleteConfirm"
                :disabled="deleting"
                class="w-full sm:w-auto btn-secondary mt-2 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Location Detail Panel (Slide-out) -->
      <div
        v-if="showDetailPanel"
        class="fixed inset-0 z-40 overflow-hidden"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-gray-500 bg-opacity-50 transition-opacity"
          @click="closeDetailPanel"
        ></div>

        <!-- Panel -->
        <div class="absolute inset-y-0 right-0 max-w-full flex">
          <div class="w-screen max-w-md">
            <div class="h-full flex flex-col bg-white shadow-xl">
              <!-- Header -->
              <div class="px-4 py-4 border-b border-gray-200">
                <div class="flex items-start justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">Location Details</h2>
                  <button
                    @click="closeDetailPanel"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <!-- Breadcrumb -->
                <div class="mt-3">
                  <div v-if="loadingDetail" class="flex items-center gap-2 text-gray-400">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span class="text-sm">Loading path...</span>
                  </div>
                  <Breadcrumb
                    v-else
                    :ancestors="selectedAncestors"
                    :current="selectedLocation"
                    @navigate="handleBreadcrumbNavigate"
                    @home="handleBreadcrumbHome"
                  />
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 overflow-y-auto p-4" v-if="selectedLocation">
                <!-- Location Icon and Name -->
                <div class="flex items-center gap-3 mb-6">
                  <span class="text-4xl">{{ selectedLocation.icon || '📍' }}</span>
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900">{{ selectedLocation.name }}</h3>
                    <p class="text-sm text-gray-500 capitalize">{{ selectedLocation.type?.replace('_', ' ') }}</p>
                  </div>
                </div>

                <!-- Description -->
                <div v-if="selectedLocation.description" class="mb-6">
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p class="text-gray-600">{{ selectedLocation.description }}</p>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-2xl font-semibold text-gray-900">{{ selectedLocation.childCount || 0 }}</p>
                    <p class="text-sm text-gray-500">Sub-locations</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-2xl font-semibold text-gray-900">{{ items.length }}</p>
                    <p class="text-sm text-gray-500">Items</p>
                  </div>
                </div>

                <!-- Items Section -->
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-medium text-gray-700">Items in this location</h4>
                    <button
                      @click="openItemForm(selectedLocation)"
                      class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Add Item
                    </button>
                  </div>

                  <!-- Loading State -->
                  <div v-if="loadingItems" class="flex justify-center py-6">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="items.length === 0" class="text-center py-6 text-gray-500">
                    <div class="text-3xl mb-2">📦</div>
                    <p class="text-sm">No items in this location</p>
                    <button
                      @click="openItemForm(selectedLocation)"
                      class="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add your first item
                    </button>
                  </div>

                  <!-- Items Grid -->
                  <div v-else class="grid grid-cols-2 gap-3">
                    <ItemCard
                      v-for="item in items"
                      :key="item._id"
                      :item="item"
                      :can-edit="true"
                      @click="openEditItemForm(item)"
                      @edit="openEditItemForm(item)"
                      @delete="openDeleteItemConfirm(item)"
                      @move="openMoveDialog(item)"
                      @adjust-quantity="handleQuantityAdjust"
                      @consume="handleItemConsumed"
                      @discard="handleItemDiscarded"
                    />
                  </div>
                </div>

                <!-- Address -->
                <div v-if="selectedLocation.address?.city" class="mb-6">
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Address</h4>
                  <p class="text-gray-600">
                    <span v-if="selectedLocation.address.street">{{ selectedLocation.address.street }}<br></span>
                    {{ selectedLocation.address.city }}<span v-if="selectedLocation.address.state">, {{ selectedLocation.address.state }}</span>
                    <span v-if="selectedLocation.address.zip"> {{ selectedLocation.address.zip }}</span>
                    <span v-if="selectedLocation.address.country"><br>{{ selectedLocation.address.country }}</span>
                  </p>
                </div>

                <!-- Capacity -->
                <div v-if="selectedLocation.capacity && selectedLocation.capacity.type !== 'unlimited'" class="mb-6">
                  <h4 class="text-sm font-medium text-gray-700 mb-2">Capacity</h4>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm text-gray-600">
                        {{ selectedLocation.capacity.type === 'slots' ? 'Slots' : 'Volume' }}
                      </span>
                      <span class="text-sm font-medium">
                        {{ selectedLocation.capacity.used || 0 }} / {{ selectedLocation.capacity.max || '∞' }}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full transition-all"
                        :style="{ width: selectedLocation.capacity.max ? ((selectedLocation.capacity.used || 0) / selectedLocation.capacity.max * 100) + '%' : '0%' }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Sharing Section -->
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-700">Shared With</h4>
                    <button
                      @click="openShareDialog"
                      class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Invite
                    </button>
                  </div>
                  <ShareList
                    :key="shareListKey"
                    :location-id="selectedLocation._id"
                    :can-manage="true"
                    :owner="selectedLocation.ownerId === user?._id ? user : null"
                    @updated="shareListKey++"
                  />
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                  <button
                    @click="openCreateWithParent(selectedLocation); closeDetailPanel()"
                    class="flex-1 btn-secondary flex items-center justify-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Sub-location
                  </button>
                  <button
                    @click="openEditModal(selectedLocation); closeDetailPanel()"
                    class="btn-secondary px-4"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="openDeleteConfirm(selectedLocation); closeDetailPanel()"
                    class="btn-secondary px-4 text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Share Dialog -->
      <ShareDialog
        v-if="selectedLocation"
        :show="showShareDialog"
        :location="selectedLocation"
        @close="closeShareDialog"
        @invited="handleShareInvited"
      />

      <!-- Item Form Modal -->
      <ItemForm
        v-if="showItemForm && selectedLocation"
        :show="true"
        :item="editingItem"
        :location-id="selectedLocation._id"
        @close="closeItemForm"
        @saved="handleItemFormSuccess"
      />

      <!-- Delete Item Confirmation Modal -->
      <div
        v-if="showDeleteItemConfirm"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeDeleteItemConfirm"></div>

          <!-- Modal Content -->
          <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div class="flex items-start">
                <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div class="ml-4 flex-1">
                  <h3 class="text-lg font-medium text-gray-900">Delete Item</h3>
                  <p class="mt-2 text-sm text-gray-500">
                    Are you sure you want to delete "{{ deletingItem?.name }}"? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                @click="handleDeleteItem"
                :disabled="deletingItemLoading"
                class="w-full sm:w-auto btn-danger flex justify-center items-center"
              >
                <span v-if="deletingItemLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
                <span v-else>Delete</span>
              </button>
              <button
                @click="closeDeleteItemConfirm"
                :disabled="deletingItemLoading"
                class="w-full sm:w-auto btn-secondary mt-2 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Item Dialog -->
      <MoveItemDialog
        v-if="movingItem"
        :show="showMoveDialog"
        :item="movingItem"
        @close="closeMoveDialog"
        @moved="handleItemMoved"
      />

      <!-- Expiration Filter Panel -->
      <ExpirationFilterPanel
        :show="showExpirationPanel"
        :initial-filter="expirationPanelFilter"
        @close="closeExpirationPanel"
        @item-click="handleExpirationItemClick"
      />

      <!-- Bulk Import Modal -->
      <BulkImportModal
        :show="showBulkImport"
        :locations="locationTree"
        :categories="categories"
        :existing-session="activeBulkSession"
        @close="closeBulkImport"
        @session-started="handleBulkSessionStarted"
        @session-committed="handleBulkSessionCommitted"
        @session-cancelled="handleBulkSessionCancelled"
      />

      <!-- Shopping List Panel -->
      <ShoppingListPanel
        :show="showShoppingList"
        @close="closeShoppingList"
      />
    </div>
  `,
};
