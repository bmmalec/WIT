/**
 * ScanPage
 * AI-powered item scanning and barcode identification
 */

import CameraCapture from '../components/CameraCapture.js';
import IdentificationResult from '../components/IdentificationResult.js';
import BarcodeScanner from '../components/BarcodeScanner.js';

const { ref, computed } = Vue;

// Scan modes
const MODES = {
  AI: 'ai',
  BARCODE: 'barcode',
};

// Scan stages
const STAGES = {
  CAPTURE: 'capture',
  IDENTIFYING: 'identifying',
  RESULTS: 'results',
  BARCODE_RESULT: 'barcode_result',
  SELECT_LOCATION: 'select_location',
};

export default {
  name: 'ScanPage',

  components: {
    CameraCapture,
    IdentificationResult,
    BarcodeScanner,
  },

  setup() {
    const mode = ref(MODES.AI);
    const stage = ref(STAGES.CAPTURE);
    const capturedImage = ref(null);
    const identificationResult = ref(null);
    const selectedGuess = ref(null);
    const barcodeResult = ref(null);
    const error = ref('');
    const locations = ref([]);
    const selectedLocationId = ref('');
    const loadingLocations = ref(false);
    const lookingUpBarcode = ref(false);
    const saving = ref(false);
    const manualBarcodeInput = ref('');
    const showManualEntry = ref(false);

    // Check if user is authenticated
    const isAuthenticated = computed(() => {
      return !!window.store?.state?.user;
    });

    // Switch scan mode
    const switchMode = (newMode) => {
      mode.value = newMode;
      stage.value = STAGES.CAPTURE;
      error.value = '';
      capturedImage.value = null;
      identificationResult.value = null;
      barcodeResult.value = null;
      selectedGuess.value = null;
    };

    // Handle image capture (AI mode)
    const handleCapture = async (imageData) => {
      capturedImage.value = imageData;
      stage.value = STAGES.IDENTIFYING;
      error.value = '';

      try {
        const response = await window.api.identify.image(
          imageData.base64,
          'image/jpeg'
        );

        identificationResult.value = response.data;
        stage.value = STAGES.RESULTS;
      } catch (err) {
        console.error('Identification failed:', err);
        error.value = err.message || 'Failed to identify item. Please try again.';
        stage.value = STAGES.CAPTURE;
      }
    };

    // Handle barcode detection
    const handleBarcodeDetected = async (data) => {
      barcodeResult.value = data;
      lookingUpBarcode.value = true;
      error.value = '';

      try {
        // Try to lookup UPC in database
        const response = await window.api.identify.upc(data.code);
        const product = response.data;

        if (product.found) {
          // Product found - create a guess-like structure
          selectedGuess.value = {
            guess: {
              name: product.name || `Product ${data.code}`,
              brand: product.brand,
              description: product.description,
              category: product.category || 'other',
            },
            quantity: { count: 1, unit: 'each' },
            barcode: data.code,
            product,
          };
          stage.value = STAGES.SELECT_LOCATION;
          await loadLocations();
        } else {
          // Product not found - show barcode result screen
          stage.value = STAGES.BARCODE_RESULT;
        }
      } catch (err) {
        console.error('UPC lookup failed:', err);
        // Show barcode result screen even on error
        stage.value = STAGES.BARCODE_RESULT;
      } finally {
        lookingUpBarcode.value = false;
      }
    };

    // Handle manual barcode submission
    const handleManualBarcodeSubmit = async () => {
      const code = manualBarcodeInput.value.trim().replace(/[\s-]/g, '');

      if (!code) {
        error.value = 'Please enter a barcode';
        return;
      }

      // Validate barcode format (8-14 digits)
      if (!/^\d{8,14}$/.test(code)) {
        error.value = 'Invalid barcode format. Must be 8-14 digits.';
        return;
      }

      // Use the existing barcode handler
      await handleBarcodeDetected({
        code,
        format: 'manual',
        timestamp: new Date().toISOString(),
      });

      // Clear input and hide manual entry
      manualBarcodeInput.value = '';
      showManualEntry.value = false;
    };

    // Toggle manual entry visibility
    const toggleManualEntry = () => {
      showManualEntry.value = !showManualEntry.value;
      error.value = '';
    };

    // Handle guess selection (AI mode)
    const handleSelectGuess = async (data) => {
      selectedGuess.value = data;
      stage.value = STAGES.SELECT_LOCATION;
      await loadLocations();
    };

    // Handle manual entry from barcode result
    const handleBarcodeManualEntry = () => {
      // Navigate to item form with barcode pre-filled
      const barcode = barcodeResult.value?.code;
      window.router?.push(`/items/new${barcode ? `?barcode=${barcode}` : ''}`);
    };

    // Try AI identification for barcode
    const handleBarcodeToAI = () => {
      mode.value = MODES.AI;
      stage.value = STAGES.CAPTURE;
      barcodeResult.value = null;
    };

    // Handle manual entry
    const handleManualEntry = () => {
      window.router?.push('/items/new');
    };

    // Handle retry
    const handleRetry = () => {
      capturedImage.value = null;
      identificationResult.value = null;
      selectedGuess.value = null;
      barcodeResult.value = null;
      error.value = '';
      stage.value = STAGES.CAPTURE;
    };

    // Handle close
    const handleClose = () => {
      window.router?.push('/dashboard');
    };

    // Load user's locations
    const loadLocations = async () => {
      loadingLocations.value = true;
      try {
        const response = await window.api.locations.tree();
        locations.value = response.data.locations || [];

        const lastLocation = localStorage.getItem('wit_last_location');
        if (lastLocation) {
          selectedLocationId.value = lastLocation;
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
        error.value = 'Failed to load locations';
      } finally {
        loadingLocations.value = false;
      }
    };

    // Flatten location tree for select
    const flattenLocations = (locs, depth = 0) => {
      let result = [];
      for (const loc of locs) {
        result.push({
          ...loc,
          depth,
          displayName: '  '.repeat(depth) + loc.name,
        });
        if (loc.children && loc.children.length > 0) {
          result = result.concat(flattenLocations(loc.children, depth + 1));
        }
      }
      return result;
    };

    const flatLocations = computed(() => flattenLocations(locations.value));

    // Save item
    const handleSaveItem = async () => {
      if (!selectedLocationId.value) {
        error.value = 'Please select a location';
        return;
      }

      saving.value = true;
      error.value = '';

      try {
        const guess = selectedGuess.value.guess;

        const itemData = {
          locationId: selectedLocationId.value,
          name: guess.name,
          description: guess.description || '',
          itemType: 'other',
          brand: guess.brand || undefined,
          model: guess.model || undefined,
          barcode: selectedGuess.value.barcode || undefined,
          quantity: {
            value: selectedGuess.value.quantity?.count || 1,
            unit: selectedGuess.value.quantity?.unit || 'each',
          },
        };

        // Add value if estimated (AI mode)
        if (selectedGuess.value.valueEstimate) {
          const avg = (selectedGuess.value.valueEstimate.low + selectedGuess.value.valueEstimate.high) / 2;
          itemData.value = {
            currentValue: Math.round(avg * 100) / 100,
            currency: selectedGuess.value.valueEstimate.currency || 'USD',
          };
        }

        const response = await window.api.items.create(itemData);
        const newItem = response.data.item;

        // Upload captured image (AI mode only)
        if (capturedImage.value?.blob && newItem._id) {
          try {
            const file = new File([capturedImage.value.blob], 'scan.jpg', { type: 'image/jpeg' });
            await window.api.items.uploadImages(newItem._id, [file]);
          } catch (imgErr) {
            console.error('Failed to upload image:', imgErr);
          }
        }

        localStorage.setItem('wit_last_location', selectedLocationId.value);

        window.store?.success('Item added successfully!');
        window.router?.push(`/locations/${selectedLocationId.value}`);
      } catch (err) {
        console.error('Failed to save item:', err);
        error.value = err.message || 'Failed to save item';
      } finally {
        saving.value = false;
      }
    };

    // Go back to results
    const handleBackToResults = () => {
      if (mode.value === MODES.BARCODE && barcodeResult.value) {
        stage.value = STAGES.BARCODE_RESULT;
      } else {
        stage.value = STAGES.RESULTS;
      }
      selectedGuess.value = null;
    };

    return {
      mode,
      MODES,
      stage,
      STAGES,
      capturedImage,
      identificationResult,
      selectedGuess,
      barcodeResult,
      error,
      locations,
      flatLocations,
      selectedLocationId,
      loadingLocations,
      lookingUpBarcode,
      saving,
      manualBarcodeInput,
      showManualEntry,
      isAuthenticated,
      switchMode,
      handleCapture,
      handleBarcodeDetected,
      handleManualBarcodeSubmit,
      toggleManualEntry,
      handleSelectGuess,
      handleBarcodeManualEntry,
      handleBarcodeToAI,
      handleManualEntry,
      handleRetry,
      handleClose,
      handleSaveItem,
      handleBackToResults,
    };
  },

  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Not authenticated -->
      <div v-if="!isAuthenticated" class="max-w-md mx-auto p-4 pt-20 text-center">
        <div class="bg-white rounded-lg shadow-sm p-8">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p class="text-gray-600 mb-4">Please log in to scan and add items.</p>
          <a href="#/login" class="btn-primary inline-block">Log In</a>
        </div>
      </div>

      <!-- Main content -->
      <div v-else class="max-w-lg mx-auto">
        <!-- Header -->
        <div class="bg-white shadow-sm">
          <div class="px-4 py-3 flex items-center justify-between">
            <button
              @click="stage === STAGES.CAPTURE ? handleClose() : handleRetry()"
              class="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 class="text-lg font-semibold text-gray-900">
              <span v-if="stage === STAGES.CAPTURE">{{ mode === MODES.AI ? 'AI Scan' : 'Barcode Scan' }}</span>
              <span v-else-if="stage === STAGES.IDENTIFYING">Identifying...</span>
              <span v-else-if="stage === STAGES.RESULTS">Select Match</span>
              <span v-else-if="stage === STAGES.BARCODE_RESULT">Barcode Found</span>
              <span v-else>Select Location</span>
            </h1>
            <div class="w-10"></div>
          </div>

          <!-- Mode toggle (only in capture stage) -->
          <div v-if="stage === STAGES.CAPTURE" class="px-4 pb-3">
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                @click="switchMode(MODES.AI)"
                :class="[
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                  mode === MODES.AI
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                AI Photo
              </button>
              <button
                @click="switchMode(MODES.BARCODE)"
                :class="[
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                  mode === MODES.BARCODE
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
                Barcode
              </button>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="mx-4 mt-4">
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>
        </div>

        <!-- Stage: Capture (AI Mode) -->
        <div v-if="stage === STAGES.CAPTURE && mode === MODES.AI" class="p-4">
          <CameraCapture
            :active="true"
            @capture="handleCapture"
            @close="handleClose"
            @error="(msg) => error = msg"
          />
          <p class="text-center text-sm text-gray-500 mt-4">
            Point camera at the item you want to add
          </p>
        </div>

        <!-- Stage: Capture (Barcode Mode) -->
        <div v-if="stage === STAGES.CAPTURE && mode === MODES.BARCODE" class="p-4">
          <!-- Barcode lookup loading overlay -->
          <div v-if="lookingUpBarcode" class="bg-white rounded-lg shadow-sm p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Looking up product...</p>
            <p class="text-2xl font-mono text-gray-700 mt-2">{{ barcodeResult?.code }}</p>
          </div>
          <template v-else>
            <BarcodeScanner
              :active="!showManualEntry"
              @detected="handleBarcodeDetected"
              @close="handleClose"
              @error="(msg) => error = msg"
            />
            <p class="text-center text-sm text-gray-500 mt-4">
              Position barcode within the frame
            </p>

            <!-- Manual entry toggle -->
            <div class="mt-4 text-center">
              <button
                @click="toggleManualEntry"
                class="text-sm text-blue-600 hover:text-blue-700"
              >
                {{ showManualEntry ? 'Use camera instead' : "Can't scan? Enter barcode manually" }}
              </button>
            </div>

            <!-- Manual barcode entry form -->
            <div v-if="showManualEntry" class="mt-4 bg-white rounded-lg shadow-sm p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Enter barcode number
              </label>
              <div class="flex gap-2">
                <input
                  v-model="manualBarcodeInput"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g., 012345678901"
                  class="input flex-1 font-mono"
                  @keydown.enter.prevent="handleManualBarcodeSubmit"
                />
                <button
                  @click="handleManualBarcodeSubmit"
                  :disabled="!manualBarcodeInput.trim()"
                  class="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lookup
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Enter 8-14 digit UPC, EAN, or other barcode number
              </p>
            </div>
          </template>
        </div>

        <!-- Stage: Identifying (AI loading) -->
        <div v-else-if="stage === STAGES.IDENTIFYING" class="p-4">
          <div class="bg-white rounded-lg shadow-sm p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Analyzing image with AI...</p>
            <p class="text-sm text-gray-400 mt-2">This may take a few seconds</p>
          </div>
          <div v-if="capturedImage" class="mt-4">
            <img :src="capturedImage.dataUrl" alt="Captured" class="w-full rounded-lg shadow-sm" />
          </div>
        </div>

        <!-- Stage: AI Results -->
        <div v-else-if="stage === STAGES.RESULTS" class="p-4">
          <IdentificationResult
            :result="identificationResult"
            :image-url="capturedImage?.dataUrl"
            @select="handleSelectGuess"
            @manual="handleManualEntry"
            @retry="handleRetry"
          />
        </div>

        <!-- Stage: Barcode Result (not found in database) -->
        <div v-else-if="stage === STAGES.BARCODE_RESULT" class="p-4 space-y-4">
          <div class="bg-white rounded-lg shadow-sm p-6 text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Barcode Detected</h3>
            <p class="text-2xl font-mono text-gray-700 mb-1">{{ barcodeResult?.code }}</p>
            <p class="text-sm text-gray-500">Format: {{ barcodeResult?.format }}</p>
          </div>

          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-yellow-800 text-sm">
              Product not found in database. You can try AI identification or enter details manually.
            </p>
          </div>

          <div class="space-y-2">
            <button
              @click="handleBarcodeToAI"
              class="w-full btn-primary py-3"
            >
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Try AI Identification
            </button>
            <button
              @click="handleBarcodeManualEntry"
              class="w-full btn-secondary py-3"
            >
              Enter Details Manually
            </button>
            <button
              @click="handleRetry"
              class="w-full text-gray-600 hover:text-gray-900 py-2 text-sm"
            >
              Scan Another Barcode
            </button>
          </div>
        </div>

        <!-- Stage: Select Location -->
        <div v-else-if="stage === STAGES.SELECT_LOCATION" class="p-4 space-y-4">
          <!-- Selected item summary -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="flex items-start gap-4">
              <img
                v-if="capturedImage"
                :src="capturedImage.dataUrl"
                alt="Item"
                class="w-16 h-16 object-cover rounded-lg"
              />
              <div v-else class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">{{ selectedGuess?.guess?.name }}</h3>
                <p v-if="selectedGuess?.guess?.brand" class="text-sm text-gray-500">
                  {{ selectedGuess.guess.brand }}
                </p>
                <p v-if="selectedGuess?.barcode" class="text-xs text-gray-400 font-mono mt-1">
                  {{ selectedGuess.barcode }}
                </p>
                <button @click="handleBackToResults" class="text-sm text-blue-600 hover:text-blue-700 mt-1">
                  Change selection
                </button>
              </div>
            </div>
          </div>

          <!-- Location selector -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Where do you want to store this item?
            </label>

            <div v-if="loadingLocations" class="py-4 text-center text-gray-500">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading locations...
            </div>

            <div v-else-if="flatLocations.length === 0" class="py-4 text-center text-gray-500">
              <p>No locations found.</p>
              <a href="#/locations/new" class="text-blue-600 hover:text-blue-700">Create your first location</a>
            </div>

            <select v-else v-model="selectedLocationId" class="input w-full">
              <option value="">Select a location...</option>
              <option v-for="loc in flatLocations" :key="loc._id" :value="loc._id">
                {{ loc.displayName }}
              </option>
            </select>

            <!-- Recent locations -->
            <div v-if="flatLocations.length > 0" class="mt-3">
              <p class="text-xs text-gray-500 mb-2">Quick select:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="loc in flatLocations.slice(0, 5)"
                  :key="loc._id"
                  @click="selectedLocationId = loc._id"
                  :class="[
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    selectedLocationId === loc._id
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  ]"
                >
                  {{ loc.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Save button -->
          <button
            @click="handleSaveItem"
            :disabled="!selectedLocationId || saving"
            class="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="saving" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>Save Item</span>
          </button>
        </div>
      </div>
    </div>
  `,
};
