/**
 * AcceptInvitePage Component
 * Handles invitation acceptance flow
 */

const { ref, computed, onMounted } = Vue;

export default {
  name: 'AcceptInvitePage',

  setup() {
    const loading = ref(true);
    const processing = ref(false);
    const error = ref(null);
    const invitation = ref(null);
    const success = ref(false);
    const declined = ref(false);

    // Get token from URL
    const token = computed(() => {
      const path = window.location.pathname;
      const match = path.match(/\/invite\/([a-f0-9]+)/);
      return match ? match[1] : null;
    });

    // Check if user is authenticated
    const isAuthenticated = computed(() => window.store?.state?.isAuthenticated);
    const user = computed(() => window.store?.state?.user);

    // Fetch invitation details
    const fetchInvitation = async () => {
      if (!token.value) {
        error.value = 'Invalid invitation link';
        loading.value = false;
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        // Get pending invites and find this one
        const response = await window.api.shares.getPendingInvites();
        const invites = response.data.invites || [];

        // Find the invite with matching token
        invitation.value = invites.find(inv => inv.inviteToken === token.value);

        if (!invitation.value) {
          error.value = 'Invitation not found, expired, or already processed';
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        if (err.code === 'UNAUTHORIZED') {
          // Not logged in - that's okay, we'll show login prompt
          error.value = null;
        } else {
          error.value = err.message || 'Failed to load invitation';
        }
      } finally {
        loading.value = false;
      }
    };

    // Accept invitation
    const acceptInvitation = async () => {
      if (!token.value) return;

      processing.value = true;
      error.value = null;

      try {
        await window.api.shares.acceptInvite(token.value);
        success.value = true;
        window.store?.success('Invitation accepted! You now have access to this location.');

        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.router.push('/dashboard');
        }, 2000);
      } catch (err) {
        console.error('Error accepting invitation:', err);
        error.value = err.message || 'Failed to accept invitation';
      } finally {
        processing.value = false;
      }
    };

    // Decline invitation
    const declineInvitation = async () => {
      if (!token.value) return;

      processing.value = true;
      error.value = null;

      try {
        await window.api.shares.declineInvite(token.value);
        declined.value = true;
        window.store?.info('Invitation declined');
      } catch (err) {
        console.error('Error declining invitation:', err);
        error.value = err.message || 'Failed to decline invitation';
      } finally {
        processing.value = false;
      }
    };

    // Navigate to login with return URL
    const goToLogin = () => {
      // Store return URL in session storage
      sessionStorage.setItem('returnUrl', window.location.pathname);
      window.router.push('/login');
    };

    // Navigate to register with return URL
    const goToRegister = () => {
      sessionStorage.setItem('returnUrl', window.location.pathname);
      window.router.push('/register');
    };

    // Navigate to dashboard
    const goToDashboard = () => {
      window.router.push('/dashboard');
    };

    // Get permission label
    const getPermissionLabel = (permission) => {
      const labels = {
        viewer: 'View only',
        contributor: 'Can add items',
        editor: 'Can edit items',
        manager: 'Full access',
      };
      return labels[permission] || permission;
    };

    // Get permission icon
    const getPermissionIcon = (permission) => {
      const icons = {
        viewer: '👁️',
        contributor: '➕',
        editor: '✏️',
        manager: '👑',
      };
      return icons[permission] || '📋';
    };

    onMounted(() => {
      if (isAuthenticated.value) {
        fetchInvitation();
      } else {
        loading.value = false;
      }
    });

    return {
      loading,
      processing,
      error,
      invitation,
      success,
      declined,
      token,
      isAuthenticated,
      user,
      acceptInvitation,
      declineInvitation,
      goToLogin,
      goToRegister,
      goToDashboard,
      getPermissionLabel,
      getPermissionIcon,
    };
  },

  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-blue-600">WIT</h1>
          <p class="text-gray-600">Location Sharing Invitation</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-lg shadow-sm p-8 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading invitation...</p>
        </div>

        <!-- Not Authenticated -->
        <div v-else-if="!isAuthenticated" class="bg-white rounded-lg shadow-sm p-8">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">You've Been Invited!</h2>
            <p class="text-gray-600">
              Someone wants to share a location with you. Sign in or create an account to view and accept this invitation.
            </p>
          </div>

          <div class="space-y-3">
            <button @click="goToLogin" class="w-full btn-primary">
              Sign In
            </button>
            <button @click="goToRegister" class="w-full btn-secondary">
              Create Account
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white rounded-lg shadow-sm p-8 text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <button @click="goToDashboard" class="btn-primary">
            Go to Dashboard
          </button>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="bg-white rounded-lg shadow-sm p-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Invitation Accepted!</h2>
          <p class="text-gray-600 mb-6">You now have access to this location. Redirecting to dashboard...</p>
          <button @click="goToDashboard" class="btn-primary">
            Go to Dashboard Now
          </button>
        </div>

        <!-- Declined State -->
        <div v-else-if="declined" class="bg-white rounded-lg shadow-sm p-8 text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Invitation Declined</h2>
          <p class="text-gray-600 mb-6">You have declined this invitation.</p>
          <button @click="goToDashboard" class="btn-primary">
            Go to Dashboard
          </button>
        </div>

        <!-- Invitation Details -->
        <div v-else-if="invitation" class="bg-white rounded-lg shadow-sm overflow-hidden">
          <!-- Header -->
          <div class="bg-blue-50 px-6 py-4 border-b border-blue-100">
            <div class="flex items-center">
              <span class="text-3xl mr-3">{{ invitation.locationId?.icon || '📍' }}</span>
              <div>
                <h2 class="text-lg font-semibold text-gray-900">{{ invitation.locationId?.name || 'Location' }}</h2>
                <p class="text-sm text-gray-600 capitalize">{{ invitation.locationId?.type?.replace('_', ' ') }}</p>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6">
            <!-- Invited by -->
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                {{ (invitation.invitedBy?.name || '?')[0].toUpperCase() }}
              </div>
              <div class="ml-3">
                <p class="text-sm text-gray-900 font-medium">{{ invitation.invitedBy?.name }}</p>
                <p class="text-xs text-gray-500">invited you to this location</p>
              </div>
            </div>

            <!-- Permission level -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
              <div class="flex items-center">
                <span class="text-2xl mr-3">{{ getPermissionIcon(invitation.permission) }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ getPermissionLabel(invitation.permission) }}</p>
                  <p class="text-xs text-gray-500">Permission level</p>
                </div>
              </div>
              <div v-if="invitation.inheritToChildren" class="mt-2 text-xs text-gray-500 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
                Includes all sub-locations
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="declineInvitation"
                :disabled="processing"
                class="flex-1 btn-secondary"
              >
                Decline
              </button>
              <button
                @click="acceptInvitation"
                :disabled="processing"
                class="flex-1 btn-primary flex items-center justify-center"
              >
                <span v-if="processing" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
                <span v-else>Accept Invitation</span>
              </button>
            </div>
          </div>
        </div>

        <!-- No invitation found -->
        <div v-else class="bg-white rounded-lg shadow-sm p-8 text-center">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Invitation Not Found</h2>
          <p class="text-gray-600 mb-6">
            This invitation may have expired, been revoked, or was sent to a different email address.
          </p>
          <button @click="goToDashboard" class="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
};
