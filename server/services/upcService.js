/**
 * UPC/Barcode Lookup Service
 * Queries external APIs to get product information from barcodes
 */

const UpcCache = require('../models/UpcCache');

// Open Food Facts API base URL
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';

/**
 * Lookup product by UPC/EAN code
 * First checks cache, then queries Open Food Facts API
 * @param {string} code - UPC or EAN barcode
 * @returns {Object} Product information
 */
const lookupByCode = async (code) => {
  // Normalize code (remove any spaces or dashes)
  const normalizedCode = code.replace(/[\s-]/g, '');

  // Check cache first
  const cached = await UpcCache.findByCode(normalizedCode);
  if (cached) {
    return formatCacheResult(cached);
  }

  // Query Open Food Facts
  const result = await queryOpenFoodFacts(normalizedCode);

  // Cache the result (whether found or not)
  await UpcCache.cacheResult(normalizedCode, result);

  return result;
};

/**
 * Query Open Food Facts API
 * @param {string} code - Barcode to lookup
 * @returns {Object} Product data
 */
const queryOpenFoodFacts = async (code) => {
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/${code}.json`);

    if (!response.ok) {
      return createNotFoundResult(code, 'open_food_facts');
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return createNotFoundResult(code, 'open_food_facts');
    }

    const product = data.product;

    return {
      found: true,
      code,
      format: detectFormat(code),
      source: 'open_food_facts',
      name: product.product_name || product.product_name_en || null,
      brand: product.brands || null,
      description: product.generic_name || product.generic_name_en || null,
      category: extractCategory(product),
      imageUrl: product.image_front_url || product.image_url || null,
      nutrition: extractNutrition(product),
      ingredients: product.ingredients_text || product.ingredients_text_en || null,
      allergens: extractAllergens(product),
      rawData: {
        categories: product.categories,
        labels: product.labels,
        quantity: product.quantity,
        serving_size: product.serving_size,
        nutriscore_grade: product.nutriscore_grade,
        nova_group: product.nova_group,
      },
    };
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return createNotFoundResult(code, 'open_food_facts');
  }
};

/**
 * Detect barcode format from code length
 * @param {string} code - Barcode
 * @returns {string} Format type
 */
const detectFormat = (code) => {
  const length = code.length;
  if (length === 12) return 'upc_a';
  if (length === 8) return 'upc_e';
  if (length === 13) return 'ean_13';
  if (length === 8) return 'ean_8';
  return 'unknown';
};

/**
 * Extract primary category from product
 * @param {Object} product - Open Food Facts product
 * @returns {string|null} Category
 */
const extractCategory = (product) => {
  if (product.categories_tags && product.categories_tags.length > 0) {
    // Get the most specific category (last in the hierarchy)
    const category = product.categories_tags[product.categories_tags.length - 1];
    // Remove language prefix (e.g., "en:beverages" -> "beverages")
    return category.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
  }
  return null;
};

/**
 * Extract nutrition information
 * @param {Object} product - Open Food Facts product
 * @returns {Object|null} Nutrition data
 */
const extractNutrition = (product) => {
  const nutrients = product.nutriments;
  if (!nutrients) return null;

  return {
    servingSize: product.serving_size || null,
    calories: nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || null,
    fat: nutrients.fat_100g || nutrients.fat || null,
    carbs: nutrients.carbohydrates_100g || nutrients.carbohydrates || null,
    protein: nutrients.proteins_100g || nutrients.proteins || null,
    sodium: nutrients.sodium_100g || nutrients.sodium || null,
    sugar: nutrients.sugars_100g || nutrients.sugars || null,
    fiber: nutrients.fiber_100g || nutrients.fiber || null,
  };
};

/**
 * Extract allergens from product
 * @param {Object} product - Open Food Facts product
 * @returns {string[]} List of allergens
 */
const extractAllergens = (product) => {
  if (product.allergens_tags && product.allergens_tags.length > 0) {
    return product.allergens_tags.map((tag) =>
      tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')
    );
  }
  return [];
};

/**
 * Create a not-found result
 * @param {string} code - Barcode
 * @param {string} source - API source
 * @returns {Object} Not found result
 */
const createNotFoundResult = (code, source) => ({
  found: false,
  code,
  format: detectFormat(code),
  source,
  name: null,
  brand: null,
  description: null,
  category: null,
  imageUrl: null,
  nutrition: null,
  ingredients: null,
  allergens: [],
  rawData: null,
});

/**
 * Format cached result for response
 * @param {Object} cached - Cached document
 * @returns {Object} Formatted result
 */
const formatCacheResult = (cached) => ({
  found: cached.found,
  code: cached.code,
  format: cached.format,
  source: cached.source,
  name: cached.name,
  brand: cached.brand,
  description: cached.description,
  category: cached.category,
  imageUrl: cached.imageUrl,
  nutrition: cached.nutrition,
  ingredients: cached.ingredients,
  allergens: cached.allergens || [],
  cached: true,
  cachedAt: cached.fetchedAt,
});

module.exports = {
  lookupByCode,
};
