/**
 * Identify Controller
 * Handles AI identification requests
 */

const aiService = require('../services/aiService');
const upcService = require('../services/upcService');

/**
 * Identify item from image
 * POST /api/identify/image
 */
const identifyImage = async (req, res, next) => {
  try {
    const { image, mediaType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'Image data is required',
        },
      });
    }

    // Validate media type
    const validMediaTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const type = mediaType || 'image/jpeg';
    if (!validMediaTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEDIA_TYPE',
          message: `Invalid media type. Supported: ${validMediaTypes.join(', ')}`,
        },
      });
    }

    // Remove data URL prefix if present
    let base64Data = image;
    if (image.includes(',')) {
      base64Data = image.split(',')[1];
    }

    // Validate base64
    if (!base64Data || base64Data.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: 'Invalid image data',
        },
      });
    }

    // Check image size (max ~10MB base64)
    if (base64Data.length > 14 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: 'Image is too large. Maximum size is 10MB.',
        },
      });
    }

    // Call AI service
    const result = await aiService.identifyItem(base64Data, type);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Identify image error:', error);

    // Handle known errors
    if (error.message.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'AI service is not configured. Please contact support.',
        },
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'IDENTIFICATION_FAILED',
        message: error.message || 'Failed to identify item',
      },
    });
  }
};

/**
 * Get quick description of item
 * POST /api/identify/describe
 */
const describeImage = async (req, res, next) => {
  try {
    const { image, mediaType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'Image data is required',
        },
      });
    }

    // Remove data URL prefix if present
    let base64Data = image;
    if (image.includes(',')) {
      base64Data = image.split(',')[1];
    }

    const description = await aiService.describeItem(base64Data, mediaType || 'image/jpeg');

    res.json({
      success: true,
      data: {
        description,
      },
    });
  } catch (error) {
    console.error('Describe image error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'DESCRIPTION_FAILED',
        message: error.message || 'Failed to describe item',
      },
    });
  }
};

/**
 * Lookup product by UPC/barcode
 * POST /api/identify/upc
 */
const lookupUpc = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: 'Barcode is required',
        },
      });
    }

    // Validate code format (only digits, 8-14 characters)
    const normalizedCode = code.replace(/[\s-]/g, '');
    if (!/^\d{8,14}$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid barcode format. Must be 8-14 digits.',
        },
      });
    }

    const result = await upcService.lookupByCode(normalizedCode);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('UPC lookup error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'LOOKUP_FAILED',
        message: error.message || 'Failed to lookup barcode',
      },
    });
  }
};

module.exports = {
  identifyImage,
  describeImage,
  lookupUpc,
};
