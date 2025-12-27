/**
 * CameraCapture Component
 * Handles camera access, capture, and preview
 */

import {
  isCameraSupported,
  requestCameraAccess,
  captureFrame,
  stopStream,
  switchCamera,
  getStreamFacingMode,
  blobToBase64,
} from '../utils/camera.js';

const { ref, computed, onMounted, onUnmounted, watch } = Vue;

export default {
  name: 'CameraCapture',

  props: {
    // Show component
    active: {
      type: Boolean,
      default: true,
    },
    // Preferred facing mode
    preferredFacing: {
      type: String,
      default: 'environment',
      validator: (v) => ['user', 'environment'].includes(v),
    },
  },

  emits: ['capture', 'error', 'close'],

  setup(props, { emit }) {
    const videoRef = ref(null);
    const stream = ref(null);
    const error = ref('');
    const loading = ref(true);
    const capturedImage = ref(null);
    const currentFacing = ref(props.preferredFacing);
    const hasMultipleCameras = ref(false);

    // Check if browser supports camera
    const isSupported = computed(() => isCameraSupported());

    // Initialize camera
    const initCamera = async () => {
      if (!isSupported.value) {
        error.value = 'Camera not supported on this device or browser';
        loading.value = false;
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        // Check for multiple cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        hasMultipleCameras.value = cameras.length > 1;

        // Request camera access
        stream.value = await requestCameraAccess({
          facingMode: currentFacing.value,
        });

        // Attach stream to video element
        if (videoRef.value) {
          videoRef.value.srcObject = stream.value;
          await videoRef.value.play();
        }

        loading.value = false;
      } catch (err) {
        error.value = err.message;
        loading.value = false;
        emit('error', err.message);
      }
    };

    // Switch between front and back camera
    const handleSwitchCamera = async () => {
      if (!hasMultipleCameras.value) return;

      const newFacing = currentFacing.value === 'user' ? 'environment' : 'user';

      try {
        loading.value = true;
        stream.value = await switchCamera(stream.value, newFacing);
        currentFacing.value = newFacing;

        if (videoRef.value) {
          videoRef.value.srcObject = stream.value;
          await videoRef.value.play();
        }

        loading.value = false;
      } catch (err) {
        error.value = err.message;
        loading.value = false;
        emit('error', err.message);
      }
    };

    // Capture photo
    const handleCapture = async () => {
      if (!videoRef.value || !stream.value) return;

      try {
        const { blob, dataUrl } = await captureFrame(videoRef.value);
        const base64 = await blobToBase64(blob);

        capturedImage.value = {
          dataUrl,
          blob,
          base64,
        };
      } catch (err) {
        error.value = err.message;
        emit('error', err.message);
      }
    };

    // Retake photo
    const handleRetake = () => {
      capturedImage.value = null;
    };

    // Use captured photo
    const handleUse = () => {
      if (capturedImage.value) {
        emit('capture', capturedImage.value);
      }
    };

    // Close camera
    const handleClose = () => {
      stopStream(stream.value);
      stream.value = null;
      capturedImage.value = null;
      emit('close');
    };

    // Retry after error
    const handleRetry = () => {
      error.value = '';
      initCamera();
    };

    // Watch for active prop changes
    watch(() => props.active, (isActive) => {
      if (isActive) {
        initCamera();
      } else {
        stopStream(stream.value);
        stream.value = null;
      }
    });

    // Initialize on mount
    onMounted(() => {
      if (props.active) {
        initCamera();
      }
    });

    // Cleanup on unmount
    onUnmounted(() => {
      stopStream(stream.value);
    });

    return {
      videoRef,
      error,
      loading,
      capturedImage,
      currentFacing,
      hasMultipleCameras,
      isSupported,
      handleSwitchCamera,
      handleCapture,
      handleRetake,
      handleUse,
      handleClose,
      handleRetry,
    };
  },

  template: `
    <div class="relative bg-black rounded-lg overflow-hidden">
      <!-- Close button -->
      <button
        @click="handleClose"
        class="absolute top-3 right-3 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Error State -->
      <div v-if="error" class="aspect-[4/3] flex flex-col items-center justify-center p-6 text-center bg-gray-900">
        <svg class="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-white text-lg mb-2">Camera Error</p>
        <p class="text-gray-400 text-sm mb-4">{{ error }}</p>
        <button
          @click="handleRetry"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Not Supported State -->
      <div v-else-if="!isSupported" class="aspect-[4/3] flex flex-col items-center justify-center p-6 text-center bg-gray-900">
        <svg class="w-16 h-16 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-white text-lg mb-2">Camera Not Supported</p>
        <p class="text-gray-400 text-sm">Your browser doesn't support camera access. Try using a modern browser like Chrome, Firefox, or Safari.</p>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="aspect-[4/3] flex flex-col items-center justify-center bg-gray-900">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p class="text-white">Accessing camera...</p>
      </div>

      <!-- Preview Mode (after capture) -->
      <div v-else-if="capturedImage" class="relative">
        <img
          :src="capturedImage.dataUrl"
          alt="Captured image"
          class="w-full aspect-[4/3] object-cover"
        />

        <!-- Preview Actions -->
        <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div class="flex items-center justify-center gap-4">
            <button
              @click="handleRetake"
              class="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Retake
            </button>
            <button
              @click="handleUse"
              class="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Use Photo
            </button>
          </div>
        </div>
      </div>

      <!-- Live Camera View -->
      <div v-else class="relative">
        <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="w-full aspect-[4/3] object-cover"
        ></video>

        <!-- Camera Controls Overlay -->
        <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div class="flex items-center justify-center gap-6">
            <!-- Switch Camera Button (if multiple cameras) -->
            <button
              v-if="hasMultipleCameras"
              @click="handleSwitchCamera"
              class="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
              title="Switch camera"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>

            <!-- Capture Button -->
            <button
              @click="handleCapture"
              class="w-16 h-16 bg-white rounded-full border-4 border-white/50 hover:scale-105 active:scale-95 transition-transform shadow-lg"
              title="Take photo"
            >
              <span class="sr-only">Capture</span>
            </button>

            <!-- Placeholder for symmetry -->
            <div v-if="hasMultipleCameras" class="w-12 h-12"></div>
          </div>
        </div>

        <!-- Camera indicator -->
        <div class="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/50 rounded-full text-white text-xs">
          <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span>{{ currentFacing === 'user' ? 'Front' : 'Back' }} Camera</span>
        </div>
      </div>
    </div>
  `,
};
