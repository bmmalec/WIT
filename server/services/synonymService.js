const Synonym = require('../models/Synonym');

/**
 * Synonym Service
 * Handles synonym expansion for search queries
 */
class SynonymService {
  /**
   * Expand a search query with synonyms
   * @param {string} query - Original search query
   * @returns {Promise<Object>} { originalQuery, expandedTerms, synonymsFound }
   */
  async expandQuery(query) {
    if (!query || typeof query !== 'string') {
      return {
        originalQuery: query || '',
        expandedTerms: [],
        synonymsFound: false,
      };
    }

    const result = await Synonym.expandQuery(query);

    return {
      originalQuery: result.originalQuery,
      expandedTerms: result.expandedTerms,
      synonymsFound: result.expandedTerms.length > 1,
    };
  }

  /**
   * Find all synonyms for a specific term
   * @param {string} term - Term to find synonyms for
   * @returns {Promise<string[]>} Array of related terms
   */
  async findSynonyms(term) {
    if (!term || typeof term !== 'string') {
      return [];
    }

    return Synonym.findRelatedTerms(term);
  }

  /**
   * Build a MongoDB text search query with synonym expansion
   * @param {string} query - Original search query
   * @returns {Promise<string>} Expanded query string for $text search
   */
  async buildExpandedTextQuery(query) {
    const { expandedTerms } = await this.expandQuery(query);

    // For MongoDB text search, we can include all terms
    // MongoDB will find documents containing any of the terms
    return expandedTerms.join(' ');
  }

  /**
   * Build a regex pattern that matches any synonym
   * Useful for highlighting matches in results
   * @param {string} query - Original search query
   * @returns {Promise<RegExp>} Regex pattern matching any synonym
   */
  async buildSynonymPattern(query) {
    const { expandedTerms } = await this.expandQuery(query);

    // Escape special regex characters
    const escaped = expandedTerms.map(term =>
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );

    return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  }

  /**
   * Get all synonym groups (for admin/display purposes)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of synonym groups
   */
  async getAllGroups(options = {}) {
    const query = { isActive: true };

    if (options.category) {
      query.category = options.category.toLowerCase();
    }

    if (options.isSystem !== undefined) {
      query.isSystem = options.isSystem;
    }

    return Synonym.find(query)
      .sort({ category: 1, canonicalName: 1 })
      .lean();
  }

  /**
   * Add a new synonym group
   * @param {string} canonicalName - Primary term
   * @param {string[]} synonyms - Array of synonyms
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created synonym group
   */
  async addSynonymGroup(canonicalName, synonyms, options = {}) {
    return Synonym.upsertSynonymGroup(canonicalName, synonyms, options);
  }

  /**
   * Add synonyms to an existing group
   * @param {string} term - Any term in the group (canonical or synonym)
   * @param {string[]} newSynonyms - New synonyms to add
   * @returns {Promise<Object|null>} Updated synonym group or null if not found
   */
  async addToGroup(term, newSynonyms) {
    const normalized = term.trim().toLowerCase();

    // Find the group containing this term
    const group = await Synonym.findOne({
      isActive: true,
      $or: [
        { canonicalName: normalized },
        { synonyms: normalized },
      ],
    });

    if (!group) {
      return null;
    }

    // Add new synonyms
    const existingSet = new Set([group.canonicalName, ...group.synonyms]);
    const toAdd = newSynonyms
      .map(s => s.trim().toLowerCase())
      .filter(s => s && !existingSet.has(s));

    if (toAdd.length === 0) {
      return group;
    }

    group.synonyms.push(...toAdd);
    await group.save();

    return group;
  }

  /**
   * Remove a synonym from a group
   * @param {string} canonicalName - Canonical name of the group
   * @param {string} synonymToRemove - Synonym to remove
   * @returns {Promise<Object|null>} Updated group or null
   */
  async removeSynonym(canonicalName, synonymToRemove) {
    const normalized = canonicalName.trim().toLowerCase();
    const toRemove = synonymToRemove.trim().toLowerCase();

    const group = await Synonym.findOne({ canonicalName: normalized });
    if (!group) {
      return null;
    }

    group.synonyms = group.synonyms.filter(s => s !== toRemove);
    await group.save();

    return group;
  }

  /**
   * Delete an entire synonym group
   * @param {string} canonicalName - Canonical name of the group to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteGroup(canonicalName) {
    const normalized = canonicalName.trim().toLowerCase();
    const result = await Synonym.deleteOne({ canonicalName: normalized });
    return result.deletedCount > 0;
  }

  /**
   * Get statistics about synonyms
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    const [total, byCategory] = await Promise.all([
      Synonym.countDocuments({ isActive: true }),
      Synonym.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalSynonyms: { $sum: { $size: '$synonyms' } },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalGroups: total,
      byCategory: byCategory.map(c => ({
        category: c._id || 'uncategorized',
        groups: c.count,
        synonyms: c.totalSynonyms,
      })),
    };
  }
}

module.exports = new SynonymService();
