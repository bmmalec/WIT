/**
 * Image Service
 * Handles image upload, compression, and thumbnail generation
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '../uploads/items');
const ORIGINALS_DIR = path.join(UPLOAD_DIR, 'originals');
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Image processing settings
const SETTINGS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  thumbnailWidth: 300,
  thumbnailHeight: 300,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

/**
 * Ensure upload directories exist
 */
const ensureDirectories = async () => {
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
};

/**
 * Process and save an uploaded image
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type
 * @returns {Promise<Object>} Image info with URLs
 */
const processImage = async (buffer, originalName, mimeType) => {
  await ensureDirectories();

  // Validate mime type
  if (!SETTINGS.allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed types: ${SETTINGS.allowedMimeTypes.join(', ')}`);
  }

  // Validate file size
  if (buffer.length > SETTINGS.maxFileSize) {
    throw new Error(`File too large. Maximum size is ${SETTINGS.maxFileSize / 1024 / 1024}MB`);
  }

  // Generate unique filename
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const originalPath = path.join(ORIGINALS_DIR, filename);
  const thumbnailPath = path.join(THUMBNAILS_DIR, filename);

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Process and save original (resize if too large, compress)
    let processedImage = sharp(buffer);

    // Resize if larger than max dimensions
    if (metadata.width > SETTINGS.maxWidth || metadata.height > SETTINGS.maxHeight) {
      processedImage = processedImage.resize(SETTINGS.maxWidth, SETTINGS.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific compression
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      processedImage = processedImage.jpeg({ quality: SETTINGS.quality });
    } else if (mimeType === 'image/png') {
      processedImage = processedImage.png({ compressionLevel: 8 });
    } else if (mimeType === 'image/webp') {
      processedImage = processedImage.webp({ quality: SETTINGS.quality });
    }

    // Save processed original
    await processedImage.toFile(originalPath);

    // Generate and save thumbnail
    await sharp(buffer)
      .resize(SETTINGS.thumbnailWidth, SETTINGS.thumbnailHeight, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Return image info
    return {
      filename,
      url: `/uploads/items/originals/${filename}`,
      thumbnailUrl: `/uploads/items/thumbnails/${filename}`,
      originalName,
      mimeType,
      size: buffer.length,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    // Clean up any partial files
    await deleteImage(filename).catch(() => {});
    throw error;
  }
};

/**
 * Delete an image and its thumbnail
 * @param {string} filename - Filename to delete
 */
const deleteImage = async (filename) => {
  const originalPath = path.join(ORIGINALS_DIR, filename);
  const thumbnailPath = path.join(THUMBNAILS_DIR, filename);

  await Promise.all([
    fs.unlink(originalPath).catch(() => {}),
    fs.unlink(thumbnailPath).catch(() => {}),
  ]);
};

/**
 * Delete images by URLs
 * @param {Array<Object>} images - Array of image objects with url property
 */
const deleteImagesByUrls = async (images) => {
  for (const image of images) {
    if (image.url) {
      const filename = path.basename(image.url);
      await deleteImage(filename);
    }
  }
};

/**
 * Get the filename from a URL
 * @param {string} url - Image URL
 * @returns {string} Filename
 */
const getFilenameFromUrl = (url) => {
  return path.basename(url);
};

module.exports = {
  processImage,
  deleteImage,
  deleteImagesByUrls,
  getFilenameFromUrl,
  SETTINGS,
};
