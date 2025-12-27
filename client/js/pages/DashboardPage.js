/**
 * DashboardPage Component
 * Main dashboard with location management
 */

import LocationCard from '../components/LocationCard.js';
import LocationForm from '../components/LocationForm.js';
import LocationTree from '../components/LocationTree.js';

const { ref, computed, onMounted } = Vue;

export default {
  name: 'DashboardPage',

  components: {
    LocationCard,
    LocationForm,
    LocationTree,
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

    // Handle location click (navigate to location)
    const handleLocationClick = (location) => {
      // TODO: Navigate to location detail page
      console.log('Navigate to location:', location._id);
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

    onMounted(fetchLocations);

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
      handleLogout,
      goToProfile,
      openCreateModal,
      openCreateWithParent,
      openEditModal,
      closeModal,
      handleFormSuccess,
      handleLocationClick,
      openDeleteConfirm,
      closeDeleteConfirm,
      handleDelete,
      fetchLocations,
      toggleViewMode,
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

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            @click="openCreateModal"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-400"
          >
            <div class="text-3xl mb-3">📍</div>
            <h3 class="font-semibold text-gray-900 mb-1">Add Location</h3>
            <p class="text-sm text-gray-600">Create a new storage location like a room, cabinet, or box.</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer opacity-50">
            <div class="text-3xl mb-3">📦</div>
            <h3 class="font-semibold text-gray-900 mb-1">Add Item</h3>
            <p class="text-sm text-gray-600">Add items to your inventory with photos or barcodes.</p>
            <p class="text-xs text-gray-400 mt-2">Coming soon</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer opacity-50">
            <div class="text-3xl mb-3">🔍</div>
            <h3 class="font-semibold text-gray-900 mb-1">Search</h3>
            <p class="text-sm text-gray-600">Find items quickly with our smart search.</p>
            <p class="text-xs text-gray-400 mt-2">Coming soon</p>
          </div>
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
    </div>
  `,
};
