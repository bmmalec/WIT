/**
 * ImageUpload Component
 * Handles image upload with drag-drop, preview, and management
 */

const { ref, computed, watch } = Vue;

export default {
  name: 'ImageUpload',

  props: {
    // Item ID for uploading (null for new items)
    itemId: {
      type: String,
      default: null,
    },
    // Existing images
    images: {
      type: Array,
      default: () => [],
    },
    // Maximum number of images
    maxImages: {
      type: Number,
      default: 10,
    },
    // Disabled state
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:images', 'upload', 'delete', 'set-primary'],

  setup(props, { emit }) {
    const isDragging = ref(false);
    const uploading = ref(false);
    const uploadProgress = ref(0);
    const error = ref('');
    const pendingFiles = ref([]); // Files pending upload (for new items)

    // Combined images (existing + pending)
    const allImages = computed(() => {
      const existing = props.images.map((img, index) => ({
        ...img,
        index,
        isPending: false,
      }));

      const pending = pendingFiles.value.map((file, index) => ({
        url: file.preview,
        thumbnailUrl: file.preview,
        isPrimary: existing.length === 0 && index === 0,
        isPending: true,
        file,
        index: existing.length + index,
      }));

      return [...existing, ...pending];
    });

    // Check if can add more images
    const canAddMore = computed(() => {
      return allImages.value.length < props.maxImages && !props.disabled;
    });

    // Handle drag events
    const handleDragOver = (e) => {
      e.preventDefault();
      if (!props.disabled) {
        isDragging.value = true;
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      isDragging.value = false;
    };

    const handleDrop = (e) => {
      e.preventDefault();
      isDragging.value = false;

      if (props.disabled) return;

      const files = Array.from(e.dataTransfer.files).filter(
        file => file.type.startsWith('image/')
      );

      if (files.length > 0) {
        handleFiles(files);
      }
    };

    // Handle file input change
    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        handleFiles(files);
      }
      // Reset input
      e.target.value = '';
    };

    // Process selected files
    const handleFiles = async (files) => {
      error.value = '';

      // Check max images limit
      const availableSlots = props.maxImages - allImages.value.length;
      if (availableSlots <= 0) {
        error.value = `Maximum ${props.maxImages} images allowed`;
        return;
      }

      const filesToProcess = files.slice(0, availableSlots);

      // Create previews for pending files
      for (const file of filesToProcess) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          error.value = `${file.name} is too large. Maximum size is 10MB`;
          continue;
        }

        // Create preview URL
        file.preview = URL.createObjectURL(file);
        pendingFiles.value.push(file);
      }

      // If item exists, upload immediately
      if (props.itemId) {
        await uploadPendingFiles();
      } else {
        // For new items, emit the pending files
        emit('update:images', [...props.images, ...pendingFiles.value.map(f => ({
          file: f,
          preview: f.preview,
          isPending: true,
        }))]);
      }
    };

    // Upload pending files
    const uploadPendingFiles = async () => {
      if (pendingFiles.value.length === 0 || !props.itemId) return;

      uploading.value = true;
      uploadProgress.value = 0;
      error.value = '';

      try {
        const result = await window.api.items.uploadImages(
          props.itemId,
          pendingFiles.value
        );

        // Clear pending files
        pendingFiles.value.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        pendingFiles.value = [];

        // Emit upload event with new images
        emit('upload', result.data.images);

        if (result.data.errors && result.data.errors.length > 0) {
          error.value = `Some images failed: ${result.data.errors.map(e => e.filename).join(', ')}`;
        }
      } catch (err) {
        console.error('Upload failed:', err);
        error.value = err.message || 'Failed to upload images';
      } finally {
        uploading.value = false;
        uploadProgress.value = 0;
      }
    };

    // Delete an image
    const handleDelete = async (image) => {
      if (image.isPending) {
        // Remove pending file
        const index = pendingFiles.value.indexOf(image.file);
        if (index > -1) {
          URL.revokeObjectURL(image.file.preview);
          pendingFiles.value.splice(index, 1);
        }
      } else if (props.itemId) {
        // Delete from server
        emit('delete', image.index);
      }
    };

    // Set primary image
    const handleSetPrimary = (image) => {
      if (!image.isPending && props.itemId) {
        emit('set-primary', image.index);
      }
    };

    // Get pending files for parent component
    const getPendingFiles = () => {
      return pendingFiles.value;
    };

    // Clear pending files
    const clearPending = () => {
      pendingFiles.value.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      pendingFiles.value = [];
    };

    // Expose methods for parent
    return {
      isDragging,
      uploading,
      uploadProgress,
      error,
      allImages,
      canAddMore,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleFileSelect,
      handleDelete,
      handleSetPrimary,
      getPendingFiles,
      clearPending,
      uploadPendingFiles,
      pendingFiles,
    };
  },

  template: `
    <div class="space-y-3">
      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
        {{ error }}
      </div>

      <!-- Drop Zone -->
      <div
        v-if="canAddMore"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        :class="[
          'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        @click="$refs.fileInput.click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          :disabled="disabled"
          @change="handleFileSelect"
        />

        <div v-if="uploading" class="space-y-2">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-sm text-gray-600">Uploading...</p>
        </div>

        <div v-else>
          <svg class="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm text-gray-600">
            <span class="text-blue-600 font-medium">Click to upload</span>
            or drag and drop
          </p>
          <p class="text-xs text-gray-400 mt-1">
            PNG, JPG, WebP up to 10MB ({{ allImages.length }}/{{ maxImages }})
          </p>
        </div>
      </div>

      <!-- Image Grid -->
      <div v-if="allImages.length > 0" class="grid grid-cols-3 gap-2">
        <div
          v-for="image in allImages"
          :key="image.url"
          class="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <!-- Image -->
          <img
            :src="image.thumbnailUrl || image.url"
            :alt="'Image ' + (image.index + 1)"
            class="w-full h-full object-cover"
          />

          <!-- Pending overlay -->
          <div
            v-if="image.isPending"
            class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"
          >
            <span class="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">Pending</span>
          </div>

          <!-- Primary badge -->
          <div
            v-if="image.isPrimary && !image.isPending"
            class="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded"
          >
            Primary
          </div>

          <!-- Action buttons (visible on hover) -->
          <div
            class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
          >
            <!-- Set Primary -->
            <button
              v-if="!image.isPrimary && !image.isPending && itemId"
              @click.stop="handleSetPrimary(image)"
              class="p-1.5 bg-white rounded-full shadow hover:bg-blue-50"
              title="Set as primary"
            >
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </button>

            <!-- Delete -->
            <button
              @click.stop="handleDelete(image)"
              class="p-1.5 bg-white rounded-full shadow hover:bg-red-50"
              title="Delete"
              :disabled="disabled"
            >
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state for no images -->
      <div v-if="allImages.length === 0 && !canAddMore" class="text-center py-4 text-gray-500 text-sm">
        No images
      </div>
    </div>
  `,
};
