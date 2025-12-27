/**
 * BarcodeScanner Component
 * Scans UPC, EAN, and other barcodes using QuaggaJS
 */

const { ref, onMounted, onUnmounted, watch } = Vue;

export default {
  name: 'BarcodeScanner',

  props: {
    // Whether scanner is active
    active: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['detected', 'error', 'close'],

  setup(props, { emit }) {
    const scannerRef = ref(null);
    const error = ref('');
    const loading = ref(true);
    const lastCode = ref('');
    const isInitialized = ref(false);

    // Beep sound for successful scan
    const playBeep = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (e) {
        // Audio not supported, ignore
      }
    };

    // Initialize Quagga
    const initScanner = () => {
      if (!window.Quagga) {
        error.value = 'Barcode scanner library not loaded';
        loading.value = false;
        return;
      }

      if (!scannerRef.value) {
        return;
      }

      loading.value = true;
      error.value = '';

      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: scannerRef.value,
            constraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: 'environment', // Back camera
              aspectRatio: { min: 1, max: 2 },
            },
          },
          locator: {
            patchSize: 'medium',
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          frequency: 10,
          decoder: {
            readers: [
              'upc_reader',
              'upc_e_reader',
              'ean_reader',
              'ean_8_reader',
              'code_128_reader',
              'code_39_reader',
              'code_93_reader',
            ],
          },
          locate: true,
        },
        (err) => {
          if (err) {
            console.error('Quagga init error:', err);
            if (err.name === 'NotAllowedError') {
              error.value = 'Camera permission denied. Please allow camera access.';
            } else if (err.name === 'NotFoundError') {
              error.value = 'No camera found on this device.';
            } else {
              error.value = err.message || 'Failed to initialize barcode scanner';
            }
            loading.value = false;
            emit('error', error.value);
            return;
          }

          Quagga.start();
          isInitialized.value = true;
          loading.value = false;
        }
      );

      // Handle detected barcodes
      Quagga.onDetected((result) => {
        if (result && result.codeResult && result.codeResult.code) {
          const code = result.codeResult.code;
          const format = result.codeResult.format;

          // Debounce - ignore same code within 2 seconds
          if (code === lastCode.value) {
            return;
          }
          lastCode.value = code;

          // Clear debounce after 2 seconds
          setTimeout(() => {
            if (lastCode.value === code) {
              lastCode.value = '';
            }
          }, 2000);

          // Play beep
          playBeep();

          // Emit detected event
          emit('detected', {
            code,
            format,
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Draw detection boxes (optional visual feedback)
      Quagga.onProcessed((result) => {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(
              0,
              0,
              parseInt(drawingCanvas.getAttribute('width')),
              parseInt(drawingCanvas.getAttribute('height'))
            );
            result.boxes
              .filter((box) => box !== result.box)
              .forEach((box) => {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                  color: 'rgba(59, 130, 246, 0.5)',
                  lineWidth: 2,
                });
              });
          }

          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
              color: '#22c55e',
              lineWidth: 2,
            });
          }

          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(
              result.line,
              { x: 'x', y: 'y' },
              drawingCtx,
              { color: '#ef4444', lineWidth: 3 }
            );
          }
        }
      });
    };

    // Stop scanner
    const stopScanner = () => {
      if (isInitialized.value && window.Quagga) {
        try {
          Quagga.stop();
          Quagga.offDetected();
          Quagga.offProcessed();
        } catch (e) {
          // Ignore errors during cleanup
        }
        isInitialized.value = false;
      }
    };

    // Handle close
    const handleClose = () => {
      stopScanner();
      emit('close');
    };

    // Handle retry
    const handleRetry = () => {
      error.value = '';
      stopScanner();
      setTimeout(() => initScanner(), 100);
    };

    // Watch active prop
    watch(
      () => props.active,
      (isActive) => {
        if (isActive) {
          initScanner();
        } else {
          stopScanner();
        }
      }
    );

    // Initialize on mount
    onMounted(() => {
      if (props.active) {
        // Small delay to ensure DOM is ready
        setTimeout(() => initScanner(), 100);
      }
    });

    // Cleanup on unmount
    onUnmounted(() => {
      stopScanner();
    });

    return {
      scannerRef,
      error,
      loading,
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
        <p class="text-white text-lg mb-2">Scanner Error</p>
        <p class="text-gray-400 text-sm mb-4">{{ error }}</p>
        <button
          @click="handleRetry"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Scanner View -->
      <div v-else class="relative">
        <!-- Loading overlay -->
        <div v-if="loading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p class="text-white">Starting scanner...</p>
        </div>

        <!-- Quagga viewport -->
        <div
          ref="scannerRef"
          class="aspect-[4/3] bg-black"
        >
          <!-- Quagga injects video and canvas here -->
        </div>

        <!-- Scan overlay -->
        <div class="absolute inset-0 pointer-events-none">
          <!-- Scanning guide box -->
          <div class="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-white/50 rounded-lg">
            <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
            <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
            <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
            <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p class="text-white text-center text-sm">
            Position barcode within the frame
          </p>
        </div>

        <!-- Barcode indicator -->
        <div class="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/50 rounded-full text-white text-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
          </svg>
          <span>Scanning...</span>
        </div>
      </div>
    </div>
  `,
};
