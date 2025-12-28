/**
 * BulkImportModal Component
 * Modal for bulk import session management with rapid scanning
 */

import CameraCapture from './CameraCapture.js';
import BarcodeScanner from './BarcodeScanner.js';
import {
  generatePeriodSchedule,
  getPeriodColor,
  DEFAULT_COLORS,
} from '../utils/expirationPeriods.js';

const { ref, computed, watch, onMounted, onUnmounted } = Vue;

// Audio feedback for scanning
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    // Audio not supported, ignore
  }
};

export default {
  name: 'BulkImportModal',

  components: {
    CameraCapture,
    BarcodeScanner,
  },

  props: {
    show: {
      type: Boolean,
      default: false,
    },
    locations: {
      type: Array,
      default: () => [],
    },
    categories: {
      type: Array,
      default: () => [],
    },
    existingSession: {
      type: Object,
      default: null,
    },
  },

  emits: ['close', 'session-started', 'session-committed', 'session-cancelled'],

  setup(props, { emit }) {
    // Session state
    const session = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Session start form
    const showStartForm = ref(false);
    const selectedLocationId = ref('');
    const selectedCategoryId = ref('');
    const sessionName = ref('');

    // Change location dialog
    const showChangeLocation = ref(false);
    const newLocationId = ref('');

    // Add item form
    const showAddItem = ref(false);
    const newItem = ref({
      name: '',
      description: '',
      brand: '',
      model: '',
      quantity: { value: 1, unit: 'each' },
      itemType: 'other',
      categoryId: '',
    });

    // Pending item being edited
    const editingItem = ref(null);

    // Committing state
    const committing = ref(false);
    const commitResult = ref(null);

    // History state (US-9.1.5)
    const showHistory = ref(false);
    const sessionHistory = ref([]);
    const loadingHistory = ref(false);
    const selectedHistorySession = ref(null);

    // Scanning state (US-9.2.1 Quick Sequential Scanning)
    const showScanner = ref(false);
    const scanMode = ref('ai'); // 'ai' or 'barcode'
    const identifying = ref(false);
    const identifiedItem = ref(null);
    const scanCount = ref(0);
    const lastScanTime = ref(null);
    const lookingUpBarcode = ref(false);

    // Expiration period schedule for quick selection (US-9.2.5)
    const expirationSchedule = computed(() => {
      // Generate schedule with start date of Jan 1 current year, quarterly periods
      const startDate = new Date(new Date().getFullYear(), 0, 1);
      return generatePeriodSchedule(startDate, 'quarterly', DEFAULT_COLORS, 8);
    });

    // Computed
    const hasSession = computed(() => !!session.value);
    const pendingCount = computed(() => session.value?.pendingItems?.length || 0);
    const targetLocation = computed(() => session.value?.targetLocationId);

    // Flatten locations for picker
    const flatLocations = computed(() => {
      const result = [];
      const flatten = (items, depth = 0) => {
        for (const item of items) {
          result.push({
            ...item,
            depth,
            displayName: '  '.repeat(depth) + (item.icon || '📍') + ' ' + item.name,
          });
          if (item.children?.length) {
            flatten(item.children, depth + 1);
          }
        }
      };
      flatten(props.locations);
      return result;
    });

    // Keyboard handler for quick confirm
    const handleKeydown = (e) => {
      if (showScanner.value && identifiedItem.value && !identifying.value) {
        if (e.key === 'Enter' && identifiedItem.value.name?.trim()) {
          e.preventDefault();
          confirmScannedItem();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          skipScan();
        }
      }
    };

    // Load existing session on mount
    onMounted(async () => {
      if (props.existingSession) {
        session.value = props.existingSession;
      } else {
        await checkForActiveSession();
      }
      // Add keyboard listener
      document.addEventListener('keydown', handleKeydown);
    });

    // Cleanup on unmount
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown);
    });

    // Watch for show changes
    watch(() => props.show, async (newVal) => {
      if (newVal && !session.value) {
        await checkForActiveSession();
      }
    });

    // Check for active session
    const checkForActiveSession = async () => {
      loading.value = true;
      try {
        const response = await window.api.bulkSessions.getActive();
        session.value = response.data.session;
        if (!session.value) {
          showStartForm.value = true;
        }
      } catch (err) {
        console.error('Failed to check session:', err);
        showStartForm.value = true;
      } finally {
        loading.value = false;
      }
    };

    // Start new session
    const startSession = async () => {
      if (!selectedLocationId.value) {
        error.value = 'Please select a target location';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.bulkSessions.start({
          targetLocationId: selectedLocationId.value,
          defaultCategoryId: selectedCategoryId.value || undefined,
          name: sessionName.value || undefined,
        });

        session.value = response.data.session;
        showStartForm.value = false;
        emit('session-started', session.value);
        window.store?.success('Bulk import session started');
      } catch (err) {
        console.error('Failed to start session:', err);
        error.value = err.message || 'Failed to start session';
      } finally {
        loading.value = false;
      }
    };

    // Change target location
    const changeLocation = async () => {
      if (!newLocationId.value) return;

      loading.value = true;
      try {
        const response = await window.api.bulkSessions.changeTargetLocation(
          session.value._id,
          newLocationId.value
        );
        session.value = response.data.session;
        showChangeLocation.value = false;
        newLocationId.value = '';
        window.store?.success('Target location changed');
      } catch (err) {
        console.error('Failed to change location:', err);
        error.value = err.message || 'Failed to change location';
      } finally {
        loading.value = false;
      }
    };

    // Add item to session
    const addItem = async () => {
      if (!newItem.value.name.trim()) {
        error.value = 'Item name is required';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        const response = await window.api.bulkSessions.addItem(session.value._id, {
          ...newItem.value,
          name: newItem.value.name.trim(),
          categoryId: newItem.value.categoryId || session.value.defaultCategoryId,
        });

        session.value = response.data.session;
        resetNewItem();
        showAddItem.value = false;
        window.store?.success('Item added to session');
      } catch (err) {
        console.error('Failed to add item:', err);
        error.value = err.message || 'Failed to add item';
      } finally {
        loading.value = false;
      }
    };

    // Reset new item form
    const resetNewItem = () => {
      newItem.value = {
        name: '',
        description: '',
        brand: '',
        model: '',
        quantity: { value: 1, unit: 'each' },
        itemType: 'other',
        categoryId: '',
      };
    };

    // Edit pending item
    const startEditItem = (item) => {
      editingItem.value = { ...item };
    };

    // Save edited item
    const saveEditItem = async () => {
      if (!editingItem.value) return;

      loading.value = true;
      try {
        const response = await window.api.bulkSessions.updateItem(
          session.value._id,
          editingItem.value.tempId,
          editingItem.value
        );
        session.value = response.data.session;
        editingItem.value = null;
      } catch (err) {
        console.error('Failed to update item:', err);
        error.value = err.message || 'Failed to update item';
      } finally {
        loading.value = false;
      }
    };

    // Cancel edit
    const cancelEditItem = () => {
      editingItem.value = null;
    };

    // Remove pending item
    const removeItem = async (tempId) => {
      loading.value = true;
      try {
        const response = await window.api.bulkSessions.removeItem(session.value._id, tempId);
        session.value = response.data.session;
        window.store?.success('Item removed');
      } catch (err) {
        console.error('Failed to remove item:', err);
        error.value = err.message || 'Failed to remove item';
      } finally {
        loading.value = false;
      }
    };

    // Commit session
    const commitSession = async () => {
      if (pendingCount.value === 0) {
        error.value = 'No items to commit';
        return;
      }

      committing.value = true;
      error.value = null;

      try {
        const response = await window.api.bulkSessions.commit(session.value._id);
        commitResult.value = response.data;
        session.value = null;
        emit('session-committed', response.data);
        window.store?.success(`${response.data.committed} items added to inventory`);
      } catch (err) {
        console.error('Failed to commit session:', err);
        error.value = err.message || 'Failed to commit session';
      } finally {
        committing.value = false;
      }
    };

    // Pause session (US-9.1.4)
    const pauseSession = async () => {
      loading.value = true;
      try {
        const response = await window.api.bulkSessions.pause(session.value._id);
        session.value = response.data.session;
        window.store?.success('Session paused - you can resume anytime');
        emit('close');
      } catch (err) {
        console.error('Failed to pause session:', err);
        error.value = err.message || 'Failed to pause session';
      } finally {
        loading.value = false;
      }
    };

    // Resume paused session (US-9.1.4)
    const resumeSession = async () => {
      loading.value = true;
      try {
        const response = await window.api.bulkSessions.resume(session.value._id);
        session.value = response.data.session;
        window.store?.success('Session resumed');
      } catch (err) {
        console.error('Failed to resume session:', err);
        error.value = err.message || 'Failed to resume session';
      } finally {
        loading.value = false;
      }
    };

    // Cancel session
    const cancelSession = async () => {
      if (!confirm('Are you sure you want to cancel this session? All pending items will be discarded.')) {
        return;
      }

      loading.value = true;
      try {
        await window.api.bulkSessions.cancel(session.value._id);
        session.value = null;
        emit('session-cancelled');
        emit('close');
        window.store?.success('Session cancelled');
      } catch (err) {
        console.error('Failed to cancel session:', err);
        error.value = err.message || 'Failed to cancel session';
      } finally {
        loading.value = false;
      }
    };

    // Close modal
    const close = () => {
      emit('close');
    };

    // Start scanning mode
    const startScanning = (mode = 'ai') => {
      showScanner.value = true;
      scanMode.value = mode;
      identifiedItem.value = null;
      scanCount.value = 0;
    };

    // Stop scanning mode
    const stopScanning = () => {
      showScanner.value = false;
      identifiedItem.value = null;
      lookingUpBarcode.value = false;
    };

    // Switch scan mode
    const switchScanMode = (mode) => {
      scanMode.value = mode;
      identifiedItem.value = null;
      error.value = null;
    };

    // Handle camera capture for AI identification
    const handleCapture = async (captureData) => {
      if (identifying.value) return;

      identifying.value = true;
      identifiedItem.value = null;

      try {
        // captureData contains {dataUrl, blob, base64}
        // Call AI identification API with base64 image
        const response = await window.api.identify.image(captureData.base64);

        if (response.data) {
          identifiedItem.value = {
            name: response.data.name || 'Unknown Item',
            description: response.data.description || '',
            brand: response.data.brand || '',
            model: response.data.model || '',
            categoryId: response.data.categoryId || session.value.defaultCategoryId || '',
            itemType: response.data.itemType || 'other',
            quantity: { value: 1, unit: 'each' },
            confidence: response.data.confidence || 0,
            source: 'ai-scan',
          };
        }
      } catch (err) {
        console.error('AI identification failed:', err);
        error.value = 'Failed to identify item. Try again or add manually.';
        // Still allow adding manually
        identifiedItem.value = {
          name: '',
          description: '',
          brand: '',
          model: '',
          categoryId: session.value.defaultCategoryId || '',
          itemType: 'other',
          quantity: { value: 1, unit: 'each' },
          confidence: 0,
          source: 'ai-scan',
        };
      } finally {
        identifying.value = false;
      }
    };

    // Quick confirm identified item and continue scanning
    const confirmScannedItem = async () => {
      if (!identifiedItem.value?.name?.trim()) {
        error.value = 'Please enter an item name';
        return;
      }

      loading.value = true;
      try {
        const response = await window.api.bulkSessions.addItem(session.value._id, {
          ...identifiedItem.value,
          name: identifiedItem.value.name.trim(),
        });

        session.value = response.data.session;
        scanCount.value++;
        lastScanTime.value = new Date();

        // Audio feedback for successful scan
        playSuccessSound();

        // Clear and continue scanning
        identifiedItem.value = null;
        error.value = null;
      } catch (err) {
        console.error('Failed to add scanned item:', err);
        error.value = err.message || 'Failed to add item';
      } finally {
        loading.value = false;
      }
    };

    // Skip this scan and continue
    const skipScan = () => {
      identifiedItem.value = null;
      error.value = null;
    };

    // Set expiration period on identified item (US-9.2.5)
    const setExpirationPeriod = (period) => {
      if (identifiedItem.value) {
        identifiedItem.value.expirationPeriodIndex = period.index;
        identifiedItem.value.expirationColor = period.color;
        identifiedItem.value.expirationLabel = period.label;
      }
    };

    // Clear expiration from identified item
    const clearExpiration = () => {
      if (identifiedItem.value) {
        identifiedItem.value.expirationPeriodIndex = null;
        identifiedItem.value.expirationColor = null;
        identifiedItem.value.expirationLabel = null;
      }
    };

    // Handle barcode detection (US-9.2.4)
    const handleBarcodeDetected = async ({ code, format }) => {
      if (lookingUpBarcode.value || identifiedItem.value) return;

      lookingUpBarcode.value = true;
      error.value = null;

      try {
        // Look up the barcode in UPC database
        const response = await window.api.identify.upc(code);

        if (response.data) {
          identifiedItem.value = {
            name: response.data.name || `Product (${code})`,
            description: response.data.description || '',
            brand: response.data.brand || '',
            model: response.data.model || '',
            categoryId: response.data.categoryId || session.value.defaultCategoryId || '',
            itemType: response.data.itemType || 'consumable',
            quantity: { value: 1, unit: 'each' },
            barcode: code,
            barcodeFormat: format,
            confidence: response.data.confidence || 0.9,
            source: 'barcode',
          };
          // Play success beep (BarcodeScanner already plays one, but we add a second for confirmation)
          playSuccessSound();
        } else {
          // Barcode not found in database - allow manual entry
          identifiedItem.value = {
            name: '',
            description: `Barcode: ${code}`,
            brand: '',
            model: '',
            categoryId: session.value.defaultCategoryId || '',
            itemType: 'other',
            quantity: { value: 1, unit: 'each' },
            barcode: code,
            barcodeFormat: format,
            confidence: 0,
            source: 'barcode',
          };
          error.value = 'Product not found. Please enter details manually.';
        }
      } catch (err) {
        console.error('Barcode lookup failed:', err);
        // Still allow manual entry with the barcode
        identifiedItem.value = {
          name: '',
          description: `Barcode: ${code}`,
          brand: '',
          model: '',
          categoryId: session.value.defaultCategoryId || '',
          itemType: 'other',
          quantity: { value: 1, unit: 'each' },
          barcode: code,
          barcodeFormat: format,
          confidence: 0,
          source: 'barcode',
        };
        error.value = 'Could not look up barcode. Please enter details manually.';
      } finally {
        lookingUpBarcode.value = false;
      }
    };

    // Get location name by ID
    const getLocationName = (locationId) => {
      const location = flatLocations.value.find(l => l._id === locationId);
      return location ? location.name : 'Unknown';
    };

    // Get category name by ID
    const getCategoryName = (categoryId) => {
      const findCategory = (cats) => {
        for (const cat of cats) {
          if (cat._id === categoryId) return cat;
          if (cat.children) {
            const found = findCategory(cat.children);
            if (found) return found;
          }
        }
        return null;
      };
      const cat = findCategory(props.categories);
      return cat ? cat.name : '';
    };

    // Format date
    const formatDate = (date) => {
      return new Date(date).toLocaleString();
    };

    // Format duration between two dates
    const formatDuration = (start, end) => {
      if (!start) return 'Unknown';
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : new Date();
      const diffMs = endDate - startDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (diffHours > 0) {
        return `${diffHours}h ${mins}m`;
      }
      return `${diffMins}m`;
    };

    // Load session history (US-9.1.5)
    const loadHistory = async () => {
      loadingHistory.value = true;
      try {
        const response = await window.api.bulkSessions.getHistory({ limit: 20 });
        sessionHistory.value = response.data.sessions || [];
      } catch (err) {
        console.error('Failed to load history:', err);
        error.value = err.message || 'Failed to load session history';
      } finally {
        loadingHistory.value = false;
      }
    };

    // Toggle history view
    const toggleHistory = async () => {
      if (!showHistory.value) {
        showHistory.value = true;
        selectedHistorySession.value = null;
        await loadHistory();
      } else {
        showHistory.value = false;
        selectedHistorySession.value = null;
      }
    };

    // View session details
    const viewSessionDetails = async (sessionId) => {
      loadingHistory.value = true;
      try {
        const response = await window.api.bulkSessions.get(sessionId);
        selectedHistorySession.value = response.data.session;
      } catch (err) {
        console.error('Failed to load session:', err);
        error.value = err.message || 'Failed to load session details';
      } finally {
        loadingHistory.value = false;
      }
    };

    // Close history detail view
    const closeHistoryDetail = () => {
      selectedHistorySession.value = null;
    };

    // Format relative date
    const formatRelativeDate = (date) => {
      if (!date) return '';
      const now = new Date();
      const d = new Date(date);
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return d.toLocaleDateString();
    };

    // Get status badge class
    const getStatusClass = (status) => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-700';
        case 'cancelled': return 'bg-gray-100 text-gray-600';
        case 'paused': return 'bg-amber-100 text-amber-700';
        case 'active': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-600';
      }
    };

    return {
      session,
      loading,
      error,
      showStartForm,
      selectedLocationId,
      selectedCategoryId,
      sessionName,
      showChangeLocation,
      newLocationId,
      showAddItem,
      newItem,
      editingItem,
      committing,
      commitResult,
      // History state
      showHistory,
      sessionHistory,
      loadingHistory,
      selectedHistorySession,
      hasSession,
      pendingCount,
      targetLocation,
      flatLocations,
      // Scanning state
      showScanner,
      scanMode,
      identifying,
      identifiedItem,
      scanCount,
      lastScanTime,
      lookingUpBarcode,
      expirationSchedule,
      // Methods
      startSession,
      changeLocation,
      addItem,
      resetNewItem,
      startEditItem,
      saveEditItem,
      cancelEditItem,
      removeItem,
      commitSession,
      pauseSession,
      resumeSession,
      cancelSession,
      close,
      getLocationName,
      getCategoryName,
      formatDate,
      formatDuration,
      formatRelativeDate,
      getStatusClass,
      // History methods
      toggleHistory,
      loadHistory,
      viewSessionDetails,
      closeHistoryDetail,
      // Scanning methods
      startScanning,
      stopScanning,
      switchScanMode,
      handleCapture,
      handleBarcodeDetected,
      confirmScannedItem,
      skipScan,
      setExpirationPeriod,
      clearExpiration,
    };
  },

  template: `
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="close"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-500 to-green-600">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📥</span>
              <div>
                <h2 class="text-xl font-bold text-white">Bulk Import</h2>
                <p v-if="session && !showHistory" class="text-green-100 text-sm">
                  {{ session.name || 'Active Session' }}
                </p>
                <p v-else-if="showHistory" class="text-green-100 text-sm">
                  Session History
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- History toggle button -->
              <button
                @click="toggleHistory"
                :class="[
                  'p-2 rounded-full transition-colors',
                  showHistory ? 'bg-white text-green-600' : 'text-white hover:bg-white/20'
                ]"
                title="Session History"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
              <button @click="close" class="p-2 text-white hover:bg-white/20 rounded-full">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <!-- Loading -->
            <div v-if="loading && !session && !showHistory" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span class="ml-3 text-gray-600">Loading...</span>
            </div>

            <!-- Error -->
            <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {{ error }}
              <button @click="error = null" class="ml-2 text-red-500 hover:text-red-700">&times;</button>
            </div>

            <!-- Session History View (US-9.1.5) -->
            <div v-if="showHistory && !selectedHistorySession" class="space-y-4">
              <!-- Loading History -->
              <div v-if="loadingHistory" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span class="ml-3 text-gray-600">Loading history...</span>
              </div>

              <!-- Empty History -->
              <div v-else-if="sessionHistory.length === 0" class="text-center py-12">
                <div class="text-4xl mb-3">📋</div>
                <p class="text-gray-600">No past sessions found</p>
                <p class="text-sm text-gray-400 mt-1">Your completed sessions will appear here</p>
              </div>

              <!-- History List -->
              <div v-else class="space-y-3">
                <div
                  v-for="hist in sessionHistory"
                  :key="hist._id"
                  @click="viewSessionDetails(hist._id)"
                  class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <p class="font-medium text-gray-900 truncate">
                          {{ hist.name || 'Bulk Import Session' }}
                        </p>
                        <span
                          :class="['px-2 py-0.5 text-xs font-medium rounded-full', getStatusClass(hist.status)]"
                        >
                          {{ hist.status }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-500">
                        {{ hist.targetLocationId?.name || 'Unknown location' }}
                      </p>
                      <p class="text-xs text-gray-400 mt-1">
                        {{ formatRelativeDate(hist.createdAt) }}
                        <span v-if="hist.stats?.committed"> · {{ hist.stats.committed }} items imported</span>
                      </p>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Session Detail View (read-only for completed sessions) -->
            <div v-if="showHistory && selectedHistorySession" class="space-y-4">
              <!-- Back button -->
              <button
                @click="closeHistoryDetail"
                class="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Back to History
              </button>

              <!-- Session Info -->
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="font-semibold text-gray-900">
                      {{ selectedHistorySession.name || 'Bulk Import Session' }}
                    </h3>
                    <p class="text-sm text-gray-500">
                      {{ selectedHistorySession.targetLocationId?.name }}
                    </p>
                  </div>
                  <span
                    :class="['px-2 py-1 text-xs font-medium rounded-full', getStatusClass(selectedHistorySession.status)]"
                  >
                    {{ selectedHistorySession.status }}
                  </span>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-3 gap-3 mt-4">
                  <div class="text-center p-2 bg-white rounded-lg">
                    <p class="text-xl font-bold text-gray-900">{{ selectedHistorySession.stats?.totalScanned || 0 }}</p>
                    <p class="text-xs text-gray-500">Scanned</p>
                  </div>
                  <div class="text-center p-2 bg-white rounded-lg">
                    <p class="text-xl font-bold text-green-600">{{ selectedHistorySession.stats?.committed || 0 }}</p>
                    <p class="text-xs text-green-600">Imported</p>
                  </div>
                  <div class="text-center p-2 bg-white rounded-lg">
                    <p class="text-xl font-bold text-gray-400">{{ selectedHistorySession.stats?.rejected || 0 }}</p>
                    <p class="text-xs text-gray-500">Rejected</p>
                  </div>
                </div>

                <!-- Dates -->
                <div class="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Started</span>
                    <span class="text-gray-900">{{ formatDate(selectedHistorySession.startedAt || selectedHistorySession.createdAt) }}</span>
                  </div>
                  <div v-if="selectedHistorySession.endedAt" class="flex justify-between">
                    <span class="text-gray-500">Ended</span>
                    <span class="text-gray-900">{{ formatDate(selectedHistorySession.endedAt) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Duration</span>
                    <span class="text-gray-900">{{ formatDuration(selectedHistorySession.startedAt || selectedHistorySession.createdAt, selectedHistorySession.endedAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Note about completed sessions -->
              <div v-if="selectedHistorySession.status === 'completed' || selectedHistorySession.status === 'cancelled'" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-sm text-blue-700">
                  <span class="font-medium">Note:</span> This session is {{ selectedHistorySession.status }} and cannot be edited.
                  <span v-if="selectedHistorySession.status === 'completed'">Items have been added to your inventory.</span>
                </p>
              </div>
            </div>

            <!-- Start Session Form -->
            <div v-if="showStartForm && !session && !showHistory" class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Start New Session</h3>
              <p class="text-gray-600 text-sm">Select a target location where scanned items will be added.</p>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Target Location *</label>
                <select
                  v-model="selectedLocationId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a location...</option>
                  <option v-for="loc in flatLocations" :key="loc._id" :value="loc._id">
                    {{ loc.displayName }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Default Category (optional)</label>
                <select
                  v-model="selectedCategoryId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">No default category</option>
                  <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                    {{ cat.icon }} {{ cat.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Session Name (optional)</label>
                <input
                  v-model="sessionName"
                  type="text"
                  placeholder="e.g., Kitchen pantry inventory"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                @click="startSession"
                :disabled="!selectedLocationId || loading"
                class="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="loading">Starting...</span>
                <span v-else>Start Session</span>
              </button>
            </div>

            <!-- Active Session -->
            <div v-if="session && !showHistory" class="space-y-6">
              <!-- Paused Banner (US-9.1.4) -->
              <div v-if="session.status === 'paused'" class="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">⏸️</span>
                  <div>
                    <p class="font-semibold text-amber-900">Session Paused</p>
                    <p class="text-sm text-amber-700">Resume to continue adding items</p>
                  </div>
                </div>
                <button
                  @click="resumeSession"
                  :disabled="loading"
                  class="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  Resume
                </button>
              </div>

              <!-- Target Location Banner -->
              <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ targetLocation?.icon || '📍' }}</span>
                  <div>
                    <p class="text-xs text-green-600 font-medium uppercase tracking-wide">Working on</p>
                    <p class="font-semibold text-green-900">{{ targetLocation?.name }}</p>
                  </div>
                </div>
                <button
                  @click="showChangeLocation = true"
                  :disabled="session.status === 'paused'"
                  class="px-3 py-1.5 text-sm bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  Change
                </button>
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-4">
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <p class="text-2xl font-bold text-gray-900">{{ session.stats?.totalScanned || 0 }}</p>
                  <p class="text-xs text-gray-500">Total Scanned</p>
                </div>
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <p class="text-2xl font-bold text-blue-600">{{ pendingCount }}</p>
                  <p class="text-xs text-blue-600">Pending</p>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                  <p class="text-2xl font-bold text-green-600">{{ session.stats?.committed || 0 }}</p>
                  <p class="text-xs text-green-600">Committed</p>
                </div>
              </div>

              <!-- Action Buttons (disabled when paused) -->
              <div v-if="session.status === 'active'" class="grid grid-cols-3 gap-3">
                <button
                  @click="startScanning('ai')"
                  class="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center justify-center gap-1 font-medium"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="text-xs">AI Scan</span>
                </button>
                <button
                  @click="startScanning('barcode')"
                  class="py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex flex-col items-center justify-center gap-1 font-medium"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                  </svg>
                  <span class="text-xs">Barcode</span>
                </button>
                <button
                  @click="showAddItem = true"
                  class="py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span class="text-xs">Manual</span>
                </button>
              </div>

              <!-- Pending Items List -->
              <div v-if="pendingCount > 0">
                <h4 class="font-semibold text-gray-900 mb-3">Pending Items ({{ pendingCount }})</h4>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  <div
                    v-for="item in session.pendingItems"
                    :key="item.tempId"
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <!-- Expiration color indicator -->
                      <div
                        v-if="item.expirationColor"
                        class="w-3 h-10 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: item.expirationColor }"
                        :title="item.expirationLabel"
                      ></div>
                      <span v-else class="text-xl flex-shrink-0">📦</span>
                      <div class="min-w-0">
                        <p class="font-medium text-gray-900 truncate">{{ item.name }}</p>
                        <p class="text-xs text-gray-500">
                          {{ item.quantity?.value || 1 }} {{ item.quantity?.unit || 'each' }}
                          <span v-if="item.brand"> · {{ item.brand }}</span>
                          <span v-if="item.expirationLabel" class="ml-1 text-gray-400">· {{ item.expirationLabel }}</span>
                          <span v-if="item.source !== 'manual'" class="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{{ item.source }}</span>
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        @click="startEditItem(item)"
                        class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button
                        @click="removeItem(item.tempId)"
                        class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📦</div>
                <p>No items yet. Add items manually or scan with camera.</p>
              </div>
            </div>

            <!-- Commit Result (US-9.3.5 Bulk Import Summary) -->
            <div v-if="commitResult && !showHistory" class="py-6">
              <!-- Success Header -->
              <div class="text-center mb-6">
                <div class="text-5xl mb-3">🎉</div>
                <h3 class="text-xl font-bold text-gray-900">Session Complete!</h3>
              </div>

              <!-- Summary Stats -->
              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="text-center p-4 bg-green-50 rounded-xl">
                  <p class="text-3xl font-bold text-green-600">{{ commitResult.committed }}</p>
                  <p class="text-xs text-green-700 font-medium">Added</p>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-xl">
                  <p class="text-3xl font-bold text-gray-600">{{ commitResult.session?.stats?.totalScanned || 0 }}</p>
                  <p class="text-xs text-gray-600 font-medium">Scanned</p>
                </div>
                <div class="text-center p-4 rounded-xl" :class="commitResult.errors > 0 ? 'bg-red-50' : 'bg-gray-50'">
                  <p class="text-3xl font-bold" :class="commitResult.errors > 0 ? 'text-red-600' : 'text-gray-400'">{{ commitResult.errors || 0 }}</p>
                  <p class="text-xs font-medium" :class="commitResult.errors > 0 ? 'text-red-700' : 'text-gray-500'">Failed</p>
                </div>
              </div>

              <!-- Session Details -->
              <div class="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Session Details</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Location</span>
                    <span class="font-medium text-gray-900">{{ commitResult.session?.targetLocationId?.name || 'Unknown' }}</span>
                  </div>
                  <div v-if="commitResult.session?.name" class="flex justify-between">
                    <span class="text-gray-500">Session Name</span>
                    <span class="font-medium text-gray-900">{{ commitResult.session.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Duration</span>
                    <span class="font-medium text-gray-900">
                      {{ formatDuration(commitResult.session?.createdAt, commitResult.session?.completedAt) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button
                  @click="showStartForm = true; commitResult = null"
                  class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Start New Session
                </button>
                <button
                  @click="close"
                  class="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>

          <!-- Footer (for active session) -->
          <div v-if="session && !commitResult && !showHistory" class="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div class="flex items-center gap-2">
              <button
                @click="cancelSession"
                :disabled="loading || committing"
                class="px-4 py-2 text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                v-if="session.status === 'active'"
                @click="pauseSession"
                :disabled="loading || committing"
                class="px-4 py-2 text-amber-600 hover:text-amber-700 disabled:opacity-50 flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pause
              </button>
            </div>
            <button
              v-if="session.status === 'active'"
              @click="commitSession"
              :disabled="pendingCount === 0 || committing"
              class="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span v-if="committing">Committing...</span>
              <span v-else>Commit {{ pendingCount }} Items</span>
            </button>
            <button
              v-else-if="session.status === 'paused'"
              @click="resumeSession"
              :disabled="loading"
              class="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              Resume Session
            </button>
          </div>
        </div>
      </div>

      <!-- Change Location Dialog -->
      <div v-if="showChangeLocation" class="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="showChangeLocation = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Change Target Location</h3>
          <select
            v-model="newLocationId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
          >
            <option value="">Select new location...</option>
            <option v-for="loc in flatLocations" :key="loc._id" :value="loc._id">
              {{ loc.displayName }}
            </option>
          </select>
          <div class="flex justify-end gap-3">
            <button
              @click="showChangeLocation = false"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              @click="changeLocation"
              :disabled="!newLocationId"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      <!-- Add Item Dialog -->
      <div v-if="showAddItem" class="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="showAddItem = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">Add Item</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                v-model="newItem.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Item name"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  v-model="newItem.brand"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  v-model="newItem.model"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  v-model.number="newItem.quantity.value"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  v-model="newItem.quantity.unit"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="each">each</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                v-model="newItem.itemType"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="consumable">Consumable</option>
                <option value="supply">Supply</option>
                <option value="tool">Tool</option>
                <option value="equipment">Equipment</option>
                <option value="part">Part</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="newItem.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              ></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              @click="showAddItem = false; resetNewItem()"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              @click="addItem"
              :disabled="!newItem.name.trim() || loading"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Item Dialog -->
      <div v-if="editingItem" class="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="cancelEditItem"></div>
        <div class="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">Edit Item</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                v-model="editingItem.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  v-model="editingItem.brand"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  v-model="editingItem.model"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  v-model.number="editingItem.quantity.value"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  v-model="editingItem.quantity.unit"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="each">each</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              @click="cancelEditItem"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              @click="saveEditItem"
              :disabled="!editingItem.name?.trim() || loading"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <!-- Scanner View (US-9.2.1 Quick Sequential Scanning) -->
      <div v-if="showScanner" class="fixed inset-0 z-60 bg-black">
        <!-- Scanner Header -->
        <div class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                @click="stopScanning"
                class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <div class="text-white">
                <p class="font-semibold">{{ scanMode === 'ai' ? 'AI Scan' : 'Barcode Scan' }}</p>
                <p class="text-sm text-white/80">{{ targetLocation?.name }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Mode Toggle -->
              <div class="flex bg-white/20 rounded-full p-0.5">
                <button
                  @click="switchScanMode('ai')"
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                    scanMode === 'ai' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'
                  ]"
                >
                  AI
                </button>
                <button
                  @click="switchScanMode('barcode')"
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                    scanMode === 'barcode' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'
                  ]"
                >
                  Barcode
                </button>
              </div>
              <!-- Running Count Badge -->
              <div class="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="font-bold">{{ scanCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Camera View (AI Mode) -->
        <div v-if="scanMode === 'ai'" class="h-full flex items-center justify-center">
          <CameraCapture
            v-if="!identifiedItem"
            :active="showScanner && scanMode === 'ai' && !identifiedItem"
            @capture="handleCapture"
            class="w-full h-full"
          />

          <!-- Identifying Overlay -->
          <div v-if="identifying" class="absolute inset-0 flex items-center justify-center bg-black/60">
            <div class="text-center text-white">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
              <p class="text-lg font-medium">Identifying item...</p>
            </div>
          </div>
        </div>

        <!-- Barcode Scanner View -->
        <div v-if="scanMode === 'barcode'" class="h-full flex items-center justify-center pt-16">
          <BarcodeScanner
            v-if="!identifiedItem"
            :active="showScanner && scanMode === 'barcode' && !identifiedItem"
            @detected="handleBarcodeDetected"
            @close="stopScanning"
            class="w-full max-w-2xl"
          />

          <!-- Looking Up Barcode Overlay -->
          <div v-if="lookingUpBarcode" class="absolute inset-0 flex items-center justify-center bg-black/60">
            <div class="text-center text-white">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
              <p class="text-lg font-medium">Looking up product...</p>
            </div>
          </div>
        </div>

        <!-- Quick Confirm Panel (slides up after identification) -->
        <div
          v-if="identifiedItem && !identifying"
          class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto animate-slide-up"
        >
          <div class="p-6">
            <!-- Drag Handle -->
            <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

            <!-- Confidence Badge & Barcode Info -->
            <div class="flex items-center gap-2 flex-wrap mb-4">
              <span v-if="identifiedItem.confidence > 0"
                :class="[
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  identifiedItem.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                  identifiedItem.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                ]"
              >
                {{ Math.round(identifiedItem.confidence * 100) }}% confidence
              </span>
              <span v-if="identifiedItem.barcode"
                class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
                {{ identifiedItem.barcode }}
              </span>
              <span v-if="identifiedItem.source === 'ai-scan'"
                class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
              >
                AI detected
              </span>
            </div>

            <!-- Item Name (editable) -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                v-model="identifiedItem.name"
                type="text"
                class="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item name"
                autofocus
              />
            </div>

            <!-- Quick Expiration Period Selector (US-9.2.5) -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Expires (optional)</label>
              <div class="flex flex-wrap gap-2">
                <!-- No expiration button -->
                <button
                  @click="clearExpiration"
                  :class="[
                    'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                    !identifiedItem.expirationPeriodIndex && identifiedItem.expirationPeriodIndex !== 0
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  None
                </button>
                <!-- Period color buttons -->
                <button
                  v-for="period in expirationSchedule.slice(0, 6)"
                  :key="period.index"
                  @click="setExpirationPeriod(period)"
                  :class="[
                    'px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all',
                    identifiedItem.expirationPeriodIndex === period.index
                      ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  ]"
                  :style="{
                    backgroundColor: period.color,
                    borderColor: period.color,
                    color: 'white'
                  }"
                  :title="period.label"
                >
                  {{ period.label }}
                </button>
              </div>
              <p v-if="identifiedItem.expirationLabel" class="text-xs text-gray-500 mt-1">
                Expires: {{ identifiedItem.expirationLabel }}
              </p>
            </div>

            <!-- Quick Edit Fields (collapsible) -->
            <details class="mb-4">
              <summary class="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                More details (optional)
              </summary>
              <div class="mt-3 space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                    <input
                      v-model="identifiedItem.brand"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Model</label>
                    <input
                      v-model="identifiedItem.model"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                    <input
                      v-model.number="identifiedItem.quantity.value"
                      type="number"
                      min="1"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                    <select
                      v-model="identifiedItem.quantity.unit"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      <option value="each">each</option>
                      <option value="box">box</option>
                      <option value="pack">pack</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>
              </div>
            </details>

            <!-- Error Message -->
            <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {{ error }}
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button
                @click="skipScan"
                class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Skip
              </button>
              <button
                @click="confirmScannedItem"
                :disabled="!identifiedItem.name?.trim() || loading"
                class="flex-2 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2 px-6"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span v-if="loading">Adding...</span>
                <span v-else>Add & Continue</span>
              </button>
            </div>

            <!-- Tip -->
            <p class="text-center text-xs text-gray-400 mt-4">
              Press Enter to quickly confirm, or tap Skip to retake
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
};
