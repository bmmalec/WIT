/**
 * IdentificationResult Component
 * Displays AI identification results with selectable guesses
 */

const { ref, computed } = Vue;

export default {
  name: 'IdentificationResult',

  props: {
    // AI identification result
    result: {
      type: Object,
      required: true,
    },
    // Captured image for reference
    imageUrl: {
      type: String,
      default: null,
    },
    // Loading state
    loading: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['select', 'manual', 'retry'],

  setup(props, { emit }) {
    const selectedIndex = ref(null);

    // Get guesses sorted by confidence
    const guesses = computed(() => {
      return props.result?.guesses || [];
    });

    // Best guess (highest confidence)
    const bestGuess = computed(() => {
      return guesses.value[0] || null;
    });

    // Format confidence as percentage
    const formatConfidence = (confidence) => {
      return `${Math.round(confidence * 100)}%`;
    };

    // Get confidence level class
    const getConfidenceClass = (confidence) => {
      if (confidence >= 0.8) return 'bg-green-500';
      if (confidence >= 0.5) return 'bg-yellow-500';
      return 'bg-orange-500';
    };

    // Get category display info
    const getCategoryDisplay = (category) => {
      const categories = {
        'tools': { icon: '🔧', label: 'Tools' },
        'hardware': { icon: '🔩', label: 'Hardware' },
        'plumbing': { icon: '🔧', label: 'Plumbing' },
        'electrical': { icon: '⚡', label: 'Electrical' },
        'building-materials': { icon: '🧱', label: 'Building' },
        'paint-supplies': { icon: '🎨', label: 'Paint' },
        'safety-ppe': { icon: '🦺', label: 'Safety' },
        'automotive': { icon: '🚗', label: 'Automotive' },
        'garden-outdoor': { icon: '🌿', label: 'Garden' },
        'food-pantry': { icon: '🍎', label: 'Food' },
        'household': { icon: '🏠', label: 'Household' },
        'electronics': { icon: '📱', label: 'Electronics' },
        'office-supplies': { icon: '📎', label: 'Office' },
        'sports-recreation': { icon: '⚽', label: 'Sports' },
        'other': { icon: '📦', label: 'Other' },
      };
      return categories[category] || categories['other'];
    };

    // Select a guess
    const handleSelect = (index) => {
      selectedIndex.value = index;
      const guess = guesses.value[index];
      emit('select', {
        guess,
        quantity: props.result.quantity,
        condition: props.result.condition,
        valueEstimate: props.result.valueEstimate,
        additionalInfo: props.result.additionalInfo,
      });
    };

    // Enter manually
    const handleManual = () => {
      emit('manual');
    };

    // Retry identification
    const handleRetry = () => {
      emit('retry');
    };

    return {
      selectedIndex,
      guesses,
      bestGuess,
      formatConfidence,
      getConfidenceClass,
      getCategoryDisplay,
      handleSelect,
      handleManual,
      handleRetry,
    };
  },

  template: `
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Identifying item...</p>
        <p class="text-sm text-gray-400 mt-1">This may take a few seconds</p>
      </div>

      <!-- Results -->
      <div v-else>
        <!-- Header with image thumbnail -->
        <div class="p-4 bg-gray-50 border-b flex items-start gap-4">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            alt="Captured item"
            class="w-20 h-20 object-cover rounded-lg shadow-sm"
          />
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">Identification Results</h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ guesses.length }} possible match{{ guesses.length !== 1 ? 'es' : '' }} found
            </p>
            <p v-if="result.quantity?.count > 1" class="text-sm text-blue-600 mt-1">
              Detected quantity: {{ result.quantity.count }} {{ result.quantity.unit }}
              <span v-if="result.quantity.isEstimate" class="text-gray-400">(estimate)</span>
            </p>
          </div>
        </div>

        <!-- Guesses List -->
        <div class="divide-y divide-gray-100">
          <button
            v-for="(guess, index) in guesses"
            :key="index"
            @click="handleSelect(index)"
            :class="[
              'w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-start gap-4',
              selectedIndex === index ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : '',
              index === 0 ? 'bg-green-50' : ''
            ]"
          >
            <!-- Rank badge -->
            <div :class="[
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              index === 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            ]">
              {{ index + 1 }}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <!-- Name and best match badge -->
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 truncate">{{ guess.name }}</span>
                <span v-if="index === 0" class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  Best Match
                </span>
              </div>

              <!-- Category and brand -->
              <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span class="flex items-center gap-1">
                  <span>{{ getCategoryDisplay(guess.category).icon }}</span>
                  <span>{{ getCategoryDisplay(guess.category).label }}</span>
                </span>
                <span v-if="guess.brand" class="text-gray-400">•</span>
                <span v-if="guess.brand">{{ guess.brand }}</span>
              </div>

              <!-- Description -->
              <p v-if="guess.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
                {{ guess.description }}
              </p>

              <!-- Confidence bar -->
              <div class="mt-2 flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    :class="[getConfidenceClass(guess.confidence), 'h-full rounded-full transition-all']"
                    :style="{ width: formatConfidence(guess.confidence) }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500 w-10 text-right">
                  {{ formatConfidence(guess.confidence) }}
                </span>
              </div>
            </div>

            <!-- Select indicator -->
            <div class="flex-shrink-0">
              <svg
                v-if="selectedIndex === index"
                class="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <svg
                v-else
                class="w-6 h-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
        </div>

        <!-- Additional Info -->
        <div v-if="result.valueEstimate || result.condition" class="p-4 bg-gray-50 border-t">
          <div class="flex flex-wrap gap-4 text-sm">
            <div v-if="result.condition" class="flex items-center gap-1">
              <span class="text-gray-500">Condition:</span>
              <span class="font-medium text-gray-700 capitalize">{{ result.condition.replace('_', ' ') }}</span>
            </div>
            <div v-if="result.valueEstimate" class="flex items-center gap-1">
              <span class="text-gray-500">Est. Value:</span>
              <span class="font-medium text-green-600">
                {{ '$' + result.valueEstimate.low }} - {{ '$' + result.valueEstimate.high }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t flex flex-col sm:flex-row gap-2">
          <button
            @click="handleManual"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            None of these - Enter manually
          </button>
          <button
            @click="handleRetry"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Retry
          </button>
        </div>
      </div>
    </div>
  `,
};
