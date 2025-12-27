/**
 * DashboardPage Component
 * Main dashboard after login
 */

const { ref, computed, onMounted } = Vue;

export default {
  name: 'DashboardPage',

  setup() {
    const user = computed(() => window.store?.state?.user);

    const handleLogout = async () => {
      try {
        await window.api.auth.logout();
        window.store?.clearUser();
        window.store?.success('Logged out successfully');
        window.router?.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear local state
        window.store?.clearUser();
        window.router?.push('/login');
      }
    };

    const goToProfile = () => {
      window.router?.push('/profile');
    };

    return {
      user,
      handleLogout,
      goToProfile,
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
            Your inventory management dashboard. Start by creating your first location.
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-3xl mb-3">📍</div>
            <h3 class="font-semibold text-gray-900 mb-1">Add Location</h3>
            <p class="text-sm text-gray-600">Create a new storage location like a room, cabinet, or box.</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-3xl mb-3">📦</div>
            <h3 class="font-semibold text-gray-900 mb-1">Add Item</h3>
            <p class="text-sm text-gray-600">Add items to your inventory with photos or barcodes.</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div class="text-3xl mb-3">🔍</div>
            <h3 class="font-semibold text-gray-900 mb-1">Search</h3>
            <p class="text-sm text-gray-600">Find items quickly with our smart search.</p>
          </div>
        </div>

        <!-- My Locations (Placeholder) -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">My Locations</h3>
            <button class="btn-primary text-sm">+ Add Location</button>
          </div>

          <div class="text-center py-12 text-gray-500">
            <div class="text-4xl mb-4">🏠</div>
            <p class="mb-2">No locations yet</p>
            <p class="text-sm">Create your first location to start organizing your inventory.</p>
          </div>
        </div>
      </main>
    </div>
  `,
};
