const mongoose = require('mongoose');

/**
 * Synonym Schema
 * Stores synonym groups for search expansion
 * Any term in the group can find items with any other term in the group
 */
const synonymSchema = new mongoose.Schema(
  {
    // The canonical/primary term for this synonym group
    canonicalName: {
      type: String,
      required: [true, 'Canonical name is required'],
      trim: true,
      lowercase: true,
      index: true,
    },

    // Array of synonyms (alternative names)
    synonyms: {
      type: [String],
      default: [],
      set: (arr) => arr.map(s => s.trim().toLowerCase()),
    },

    // Optional category for context-aware synonyms
    category: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    // Whether this is a system-provided synonym (vs user-created)
    isSystem: {
      type: Boolean,
      default: true,
    },

    // Whether this synonym group is active
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient synonym lookup
synonymSchema.index({ synonyms: 1 });

// Text index for searching synonym entries
synonymSchema.index({ canonicalName: 'text', synonyms: 'text' });

/**
 * Static method: Find all related terms for a given term
 * Searches both canonicalName and synonyms array
 * @param {string} term - The term to find synonyms for
 * @returns {Promise<string[]>} Array of all related terms including the input
 */
synonymSchema.statics.findRelatedTerms = async function(term) {
  const normalizedTerm = term.trim().toLowerCase();

  // Find synonym groups where term matches canonicalName or is in synonyms array
  const groups = await this.find({
    isActive: true,
    $or: [
      { canonicalName: normalizedTerm },
      { synonyms: normalizedTerm },
    ],
  }).lean();

  if (groups.length === 0) {
    return [normalizedTerm];
  }

  // Collect all unique terms from matching groups
  const allTerms = new Set([normalizedTerm]);

  for (const group of groups) {
    allTerms.add(group.canonicalName);
    for (const syn of group.synonyms) {
      allTerms.add(syn);
    }
  }

  return Array.from(allTerms);
};

/**
 * Static method: Expand a search query with synonyms
 * @param {string} query - The search query (may be multiple words)
 * @returns {Promise<Object>} { expandedTerms: string[], originalQuery: string }
 */
synonymSchema.statics.expandQuery = async function(query) {
  const words = query.trim().toLowerCase().split(/\s+/);
  const expandedTermsSet = new Set();

  // Add original words
  for (const word of words) {
    expandedTermsSet.add(word);
  }

  // Expand each word with its synonyms
  for (const word of words) {
    const related = await this.findRelatedTerms(word);
    for (const term of related) {
      expandedTermsSet.add(term);
    }
  }

  // Also try the full query as a phrase
  const fullQueryTerms = await this.findRelatedTerms(query.trim().toLowerCase());
  for (const term of fullQueryTerms) {
    expandedTermsSet.add(term);
  }

  return {
    originalQuery: query,
    expandedTerms: Array.from(expandedTermsSet),
  };
};

/**
 * Static method: Add or update a synonym group
 * @param {string} canonicalName - Primary term
 * @param {string[]} synonyms - Array of synonyms
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The created/updated synonym document
 */
synonymSchema.statics.upsertSynonymGroup = async function(canonicalName, synonyms, options = {}) {
  const normalized = canonicalName.trim().toLowerCase();
  const normalizedSynonyms = synonyms.map(s => s.trim().toLowerCase()).filter(s => s && s !== normalized);

  return this.findOneAndUpdate(
    { canonicalName: normalized },
    {
      $set: {
        canonicalName: normalized,
        synonyms: normalizedSynonyms,
        category: options.category?.trim().toLowerCase(),
        isSystem: options.isSystem !== false,
        isActive: options.isActive !== false,
      },
    },
    { upsert: true, new: true }
  );
};

const Synonym = mongoose.model('Synonym', synonymSchema);

module.exports = Synonym;
