/**
 * Camera Utility Functions
 * Handles camera access, capture, and stream management
 */

/**
 * Check if camera is supported
 * @returns {boolean}
 */
export function isCameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Get available cameras
 * @returns {Promise<MediaDeviceInfo[]>}
 */
export async function getAvailableCameras() {
  if (!isCameraSupported()) {
    throw new Error('Camera not supported on this device');
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === 'videoinput');
}

/**
 * Request camera access
 * @param {Object} options - Camera options
 * @param {string} options.facingMode - 'user' (front) or 'environment' (back)
 * @param {number} options.width - Preferred width
 * @param {number} options.height - Preferred height
 * @returns {Promise<MediaStream>}
 */
export async function requestCameraAccess(options = {}) {
  if (!isCameraSupported()) {
    throw new Error('Camera not supported on this device');
  }

  const {
    facingMode = 'environment', // Default to back camera for item photos
    width = 1280,
    height = 720,
  } = options;

  const constraints = {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: width },
      height: { ideal: height },
    },
    audio: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera permission denied. Please allow camera access to use this feature.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera found on this device.');
    } else if (error.name === 'NotReadableError') {
      throw new Error('Camera is in use by another application.');
    } else {
      throw new Error(`Failed to access camera: ${error.message}`);
    }
  }
}

/**
 * Capture a frame from video element
 * @param {HTMLVideoElement} video - The video element
 * @param {Object} options - Capture options
 * @param {string} options.format - Output format ('image/jpeg', 'image/png', 'image/webp')
 * @param {number} options.quality - JPEG/WebP quality (0-1)
 * @returns {Promise<{blob: Blob, dataUrl: string}>}
 */
export async function captureFrame(video, options = {}) {
  const {
    format = 'image/jpeg',
    quality = 0.92,
  } = options;

  // Create canvas with video dimensions
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw video frame to canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve({ blob, dataUrl });
        } else {
          reject(new Error('Failed to capture image'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Stop a media stream
 * @param {MediaStream} stream - The stream to stop
 */
export function stopStream(stream) {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

/**
 * Switch camera (front/back)
 * @param {MediaStream} currentStream - Current active stream
 * @param {string} newFacingMode - 'user' or 'environment'
 * @returns {Promise<MediaStream>}
 */
export async function switchCamera(currentStream, newFacingMode) {
  // Stop current stream
  stopStream(currentStream);

  // Request new camera
  return requestCameraAccess({ facingMode: newFacingMode });
}

/**
 * Convert blob to base64
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove data URL prefix to get pure base64
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get camera facing mode from stream
 * @param {MediaStream} stream - The media stream
 * @returns {string|null} - 'user', 'environment', or null
 */
export function getStreamFacingMode(stream) {
  if (!stream) return null;
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return null;
  const settings = videoTrack.getSettings();
  return settings.facingMode || null;
}
