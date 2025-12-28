/**
 * Fuzzy Matching Utilities
 * Implements Levenshtein distance algorithm for typo-tolerant search
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const len1 = s1.length;
  const len2 = s2.length;

  // Create distance matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize first column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate normalized similarity score (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (1 = identical, 0 = completely different)
 */
function similarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Get maximum allowed edit distance based on word length
 * @param {string} word - The word to check
 * @returns {number} Maximum allowed distance
 */
function getMaxDistance(word) {
  const len = word.length;
  if (len <= 3) return 0;  // No tolerance for very short words
  if (len <= 5) return 1;  // 1 typo for short words
  if (len <= 8) return 2;  // 2 typos for medium words
  return 3;                // 3 typos for long words
}

/**
 * Check if two strings are fuzzy matches
 * @param {string} query - Search query
 * @param {string} candidate - Candidate string to match against
 * @param {number} maxDistance - Maximum allowed edit distance (optional)
 * @returns {boolean} Whether they match within tolerance
 */
function isFuzzyMatch(query, candidate, maxDistance = null) {
  const q = query.toLowerCase().trim();
  const c = candidate.toLowerCase().trim();

  // Exact match
  if (q === c) return true;

  // Contains match (substring)
  if (c.includes(q) || q.includes(c)) return true;

  // Levenshtein distance match
  const allowedDistance = maxDistance !== null ? maxDistance : getMaxDistance(q);
  const distance = levenshteinDistance(q, c);

  return distance <= allowedDistance;
}

/**
 * Find fuzzy matches for a query in a list of candidates
 * @param {string} query - Search query
 * @param {Array<Object>} items - Array of items to search
 * @param {Object} options - Search options
 * @param {string[]} options.fields - Fields to search in each item (default: ['name'])
 * @param {number} options.maxDistance - Maximum edit distance (optional)
 * @param {number} options.limit - Maximum results to return (optional)
 * @param {number} options.minSimilarity - Minimum similarity score 0-1 (optional)
 * @returns {Array<Object>} Matching items with similarity scores
 */
function fuzzySearch(query, items, options = {}) {
  const {
    fields = ['name'],
    maxDistance = null,
    limit = 20,
    minSimilarity = 0.5,
  } = options;

  const q = query.toLowerCase().trim();
  const queryWords = q.split(/\s+/);
  const results = [];

  for (const item of items) {
    let bestScore = 0;
    let matchedField = null;

    for (const field of fields) {
      const value = getNestedValue(item, field);
      if (!value) continue;

      // Handle arrays (like alternateNames)
      const values = Array.isArray(value) ? value : [value];

      for (const val of values) {
        if (typeof val !== 'string') continue;

        const candidateWords = val.toLowerCase().split(/\s+/);

        // Check full string similarity
        const fullSimilarity = similarity(q, val.toLowerCase());
        if (fullSimilarity > bestScore) {
          bestScore = fullSimilarity;
          matchedField = field;
        }

        // Check word-by-word matching for multi-word queries
        for (const queryWord of queryWords) {
          for (const candidateWord of candidateWords) {
            const wordSimilarity = similarity(queryWord, candidateWord);
            if (wordSimilarity > bestScore) {
              bestScore = wordSimilarity;
              matchedField = field;
            }

            // Check if fuzzy match
            const allowedDist = maxDistance !== null ? maxDistance : getMaxDistance(queryWord);
            const dist = levenshteinDistance(queryWord, candidateWord);
            if (dist <= allowedDist && dist > 0) {
              const calcScore = 1 - dist / Math.max(queryWord.length, candidateWord.length);
              if (calcScore > bestScore) {
                bestScore = calcScore;
                matchedField = field;
              }
            }
          }
        }

        // Exact substring match gets high score
        if (val.toLowerCase().includes(q)) {
          const substringScore = 0.9;
          if (substringScore > bestScore) {
            bestScore = substringScore;
            matchedField = field;
          }
        }
      }
    }

    if (bestScore >= minSimilarity) {
      results.push({
        item,
        score: bestScore,
        matchedField,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply limit
  const limited = limit ? results.slice(0, limit) : results;

  return limited;
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot-notation path (e.g., 'user.name')
 * @returns {*} The value at the path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Generate "Did you mean?" suggestions
 * @param {string} query - Original search query
 * @param {Array<string>} knownTerms - List of known valid terms
 * @param {number} maxSuggestions - Maximum suggestions to return
 * @returns {Array<Object>} Suggestions with scores
 */
function getSuggestions(query, knownTerms, maxSuggestions = 3) {
  const q = query.toLowerCase().trim();
  const suggestions = [];

  for (const term of knownTerms) {
    const t = term.toLowerCase();
    const sim = similarity(q, t);
    const dist = levenshteinDistance(q, t);

    // Only suggest if reasonably similar but not exact
    if (sim >= 0.5 && sim < 1 && dist <= 3) {
      suggestions.push({
        term,
        similarity: sim,
        distance: dist,
      });
    }
  }

  // Sort by similarity descending
  suggestions.sort((a, b) => b.similarity - a.similarity);

  return suggestions.slice(0, maxSuggestions);
}

module.exports = {
  levenshteinDistance,
  similarity,
  getMaxDistance,
  isFuzzyMatch,
  fuzzySearch,
  getSuggestions,
};
