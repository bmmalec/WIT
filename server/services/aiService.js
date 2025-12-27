/**
 * AI Service
 * Handles AI-powered item identification using Claude Vision
 */

const { anthropic, MODELS, DEFAULTS } = require('../config/claude');

// Prompt template for item identification
const IDENTIFY_PROMPT = `You are an expert at identifying household items, tools, hardware, food products, and general inventory items.

Analyze this image and identify what item(s) you see. Provide your response as a JSON object with the following structure:

{
  "guesses": [
    {
      "name": "Primary name of the item",
      "confidence": 0.95,
      "category": "Category slug (e.g., 'tools', 'hardware', 'food-pantry', 'electronics')",
      "subcategory": "Subcategory if applicable",
      "description": "Brief description of the item",
      "brand": "Brand name if visible",
      "model": "Model number if visible"
    }
  ],
  "quantity": {
    "count": 1,
    "unit": "each",
    "isEstimate": false
  },
  "condition": "new|like_new|good|fair|poor",
  "valueEstimate": {
    "low": 10,
    "high": 25,
    "currency": "USD",
    "confidence": 0.6
  },
  "additionalInfo": {
    "color": "Primary color if relevant",
    "size": "Size description if apparent",
    "material": "Material if identifiable"
  }
}

Guidelines:
- Provide up to 5 guesses, sorted by confidence (highest first)
- Confidence should be between 0 and 1
- Be specific with names (e.g., "Phillips head screwdriver" not just "screwdriver")
- Use these category slugs: tools, hardware, plumbing, electrical, building-materials, paint-supplies, safety-ppe, automotive, garden-outdoor, food-pantry, household, electronics, office-supplies, sports-recreation, other
- For condition, assess based on visible wear, packaging, etc.
- Value estimates should be realistic retail prices in USD
- If you can see a brand or model, include it
- If multiple identical items are visible, estimate the count

Respond ONLY with the JSON object, no additional text.`;

/**
 * Identify item(s) from an image
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} mediaType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Promise<Object>} Identification results
 */
const identifyItem = async (imageBase64, mediaType = 'image/jpeg') => {
  try {
    const response = await anthropic.messages.create({
      model: MODELS.VISION,
      max_tokens: DEFAULTS.maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: IDENTIFY_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract the text response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent) {
      throw new Error('No text response from AI');
    }

    // Parse the JSON response
    let result;
    try {
      // Handle potential markdown code blocks
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      result = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Failed to parse AI identification response');
    }

    // Validate and normalize response
    return normalizeIdentificationResult(result);
  } catch (error) {
    console.error('AI identification error:', error);

    if (error.status === 401) {
      throw new Error('AI service authentication failed. Check API key.');
    } else if (error.status === 429) {
      throw new Error('AI service rate limit exceeded. Please try again later.');
    } else if (error.status === 400) {
      throw new Error('Invalid image format or size.');
    }

    throw new Error(error.message || 'AI identification failed');
  }
};

/**
 * Normalize and validate identification result
 * @param {Object} result - Raw AI response
 * @returns {Object} Normalized result
 */
const normalizeIdentificationResult = (result) => {
  // Ensure guesses array exists and is valid
  const guesses = (result.guesses || []).slice(0, 5).map((guess, index) => ({
    name: guess.name || 'Unknown Item',
    confidence: Math.min(1, Math.max(0, guess.confidence || 0.5)),
    category: guess.category || 'other',
    subcategory: guess.subcategory || null,
    description: guess.description || '',
    brand: guess.brand || null,
    model: guess.model || null,
    rank: index + 1,
  }));

  // Ensure at least one guess
  if (guesses.length === 0) {
    guesses.push({
      name: 'Unknown Item',
      confidence: 0.1,
      category: 'other',
      subcategory: null,
      description: 'Could not identify the item',
      brand: null,
      model: null,
      rank: 1,
    });
  }

  // Normalize quantity
  const quantity = {
    count: result.quantity?.count || 1,
    unit: result.quantity?.unit || 'each',
    isEstimate: result.quantity?.isEstimate ?? true,
  };

  // Normalize condition
  const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
  const condition = validConditions.includes(result.condition)
    ? result.condition
    : 'good';

  // Normalize value estimate
  const valueEstimate = result.valueEstimate ? {
    low: Math.max(0, result.valueEstimate.low || 0),
    high: Math.max(0, result.valueEstimate.high || 0),
    currency: result.valueEstimate.currency || 'USD',
    confidence: Math.min(1, Math.max(0, result.valueEstimate.confidence || 0.5)),
  } : null;

  // Normalize additional info
  const additionalInfo = {
    color: result.additionalInfo?.color || null,
    size: result.additionalInfo?.size || null,
    material: result.additionalInfo?.material || null,
  };

  return {
    guesses,
    quantity,
    condition,
    valueEstimate,
    additionalInfo,
    identifiedAt: new Date().toISOString(),
  };
};

/**
 * Get a quick description of an item (lighter weight)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mediaType - Image MIME type
 * @returns {Promise<string>} Brief description
 */
const describeItem = async (imageBase64, mediaType = 'image/jpeg') => {
  try {
    const response = await anthropic.messages.create({
      model: MODELS.FAST, // Use faster model for descriptions
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Describe this item in 1-2 sentences. Be specific about what it is.',
            },
          ],
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text || 'Unable to describe item';
  } catch (error) {
    console.error('AI describe error:', error);
    throw new Error('Failed to describe item');
  }
};

module.exports = {
  identifyItem,
  describeItem,
};
