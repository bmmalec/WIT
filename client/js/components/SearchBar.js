/**
 * SearchBar Component
 * Global search input with autocomplete and keyboard navigation
 */

const { ref, watch, computed, onMounted, onUnmounted } = Vue;

export default {
  name: 'SearchBar',

  props: {
    placeholder: {
      type: String,
      default: 'Search items...',
    },
    debounceMs: {
      type: Number,
      default: 300,
    },
    minChars: {
      type: Number,
      default: 2,
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
    showAutocomplete: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['search', 'clear', 'focus', 'blur', 'select'],

  setup(props, { emit }) {
    const query = ref('');
    const inputRef = ref(null);
    const isFocused = ref(false);
    const debounceTimer = ref(null);
    const autocompleteTimer = ref(null);

    // Autocomplete state
    const suggestions = ref([]);
    const showSuggestions = ref(false);
    const selectedIndex = ref(-1);
    const loadingSuggestions = ref(false);

    // Recent searches state
    const recentSearches = ref([]);
    const showRecentSearches = ref(false);
    const loadingRecentSearches = ref(false);

    // Fetch autocomplete suggestions
    const fetchSuggestions = async (searchQuery) => {
      if (!props.showAutocomplete || searchQuery.length < props.minChars) {
        suggestions.value = [];
        showSuggestions.value = false;
        return;
      }

      loadingSuggestions.value = true;
      try {
        const response = await window.api.items.autocomplete(searchQuery, { limit: 10 });
        suggestions.value = response.data.suggestions || [];
        showSuggestions.value = suggestions.value.length > 0 && isFocused.value;
        selectedIndex.value = -1;
      } catch (err) {
        console.error('Autocomplete failed:', err);
        suggestions.value = [];
      } finally {
        loadingSuggestions.value = false;
      }
    };

    // Fetch recent searches
    const fetchRecentSearches = async () => {
      if (recentSearches.value.length > 0) {
        // Already loaded
        return;
      }

      loadingRecentSearches.value = true;
      try {
        const response = await window.api.items.getRecentSearches();
        recentSearches.value = response.data.searches || [];
      } catch (err) {
        console.error('Failed to load recent searches:', err);
        recentSearches.value = [];
      } finally {
        loadingRecentSearches.value = false;
      }
    };

    // Clear recent search history
    const clearRecentSearches = async () => {
      try {
        await window.api.items.clearRecentSearches();
        recentSearches.value = [];
        showRecentSearches.value = false;
      } catch (err) {
        console.error('Failed to clear search history:', err);
      }
    };

    // Select a recent search
    const selectRecentSearch = (search) => {
      query.value = search.query;
      showRecentSearches.value = false;
      selectedIndex.value = -1;
      emit('search', search.query);
    };

    // Debounced search and autocomplete
    watch(query, (newQuery) => {
      // Clear previous timers
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
      }
      if (autocompleteTimer.value) {
        clearTimeout(autocompleteTimer.value);
      }

      // If query is empty or too short, emit clear and show recent searches
      if (!newQuery || newQuery.trim().length < props.minChars) {
        emit('clear');
        suggestions.value = [];
        showSuggestions.value = false;
        // Show recent searches if focused and has history
        if (isFocused.value && recentSearches.value.length > 0) {
          showRecentSearches.value = true;
        }
        return;
      }

      // Hide recent searches when typing
      showRecentSearches.value = false;

      // Fetch autocomplete suggestions with shorter debounce
      autocompleteTimer.value = setTimeout(() => {
        fetchSuggestions(newQuery.trim());
      }, 150);

      // Debounce the full search
      debounceTimer.value = setTimeout(() => {
        emit('search', newQuery.trim());
      }, props.debounceMs);
    });

    // Clear search
    const clearSearch = () => {
      query.value = '';
      suggestions.value = [];
      showSuggestions.value = false;
      selectedIndex.value = -1;
      emit('clear');
      inputRef.value?.focus();
    };

    // Handle focus
    const handleFocus = () => {
      isFocused.value = true;
      if (suggestions.value.length > 0) {
        showSuggestions.value = true;
      } else if (!query.value || query.value.trim().length < props.minChars) {
        // Show recent searches when focusing on empty input
        fetchRecentSearches();
        if (recentSearches.value.length > 0) {
          showRecentSearches.value = true;
        }
      }
      emit('focus');
    };

    // Handle blur with delay to allow click on suggestions
    const handleBlur = () => {
      setTimeout(() => {
        isFocused.value = false;
        showSuggestions.value = false;
        showRecentSearches.value = false;
        emit('blur');
      }, 200);
    };

    // Select a suggestion
    const selectSuggestion = (suggestion) => {
      query.value = suggestion.text;
      showSuggestions.value = false;
      selectedIndex.value = -1;
      emit('search', suggestion.text);

      // If it's an item, also emit select event
      if (suggestion.itemId) {
        emit('select', suggestion);
      }
    };

    // Handle keyboard navigation in input
    const handleInputKeydown = (e) => {
      // Handle recent searches dropdown
      if (showRecentSearches.value && recentSearches.value.length > 0) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            selectedIndex.value = Math.min(selectedIndex.value + 1, recentSearches.value.length - 1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedIndex.value >= 0) {
              selectRecentSearch(recentSearches.value[selectedIndex.value]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            showRecentSearches.value = false;
            selectedIndex.value = -1;
            break;
          case 'Tab':
            showRecentSearches.value = false;
            break;
        }
        return;
      }

      // Handle autocomplete suggestions dropdown
      if (!showSuggestions.value || suggestions.value.length === 0) {
        if (e.key === 'Escape') {
          if (query.value) {
            clearSearch();
          } else {
            inputRef.value?.blur();
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex.value >= 0) {
            selectSuggestion(suggestions.value[selectedIndex.value]);
          } else if (query.value.trim().length >= props.minChars) {
            showSuggestions.value = false;
            emit('search', query.value.trim());
          }
          break;
        case 'Escape':
          e.preventDefault();
          showSuggestions.value = false;
          selectedIndex.value = -1;
          break;
        case 'Tab':
          showSuggestions.value = false;
          break;
      }
    };

    // Handle global keyboard shortcut (Cmd/Ctrl + K)
    const handleGlobalKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.value?.focus();
      }
    };

    // Get icon for suggestion type
    const getSuggestionIcon = (type) => {
      switch (type) {
        case 'item':
          return '📦';
        case 'alternate':
          return '🏷️';
        case 'brand':
          return '🏢';
        default:
          return '🔍';
      }
    };

    // Focus input programmatically
    const focus = () => {
      inputRef.value?.focus();
    };

    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeydown);
      if (props.autofocus) {
        inputRef.value?.focus();
      }
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeydown);
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
      }
      if (autocompleteTimer.value) {
        clearTimeout(autocompleteTimer.value);
      }
    });

    return {
      query,
      inputRef,
      isFocused,
      suggestions,
      showSuggestions,
      selectedIndex,
      loadingSuggestions,
      recentSearches,
      showRecentSearches,
      loadingRecentSearches,
      clearSearch,
      handleFocus,
      handleBlur,
      handleInputKeydown,
      selectSuggestion,
      selectRecentSearch,
      clearRecentSearches,
      getSuggestionIcon,
      focus,
    };
  },

  template: `
    <div class="relative">
      <div class="relative">
        <!-- Search Icon -->
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            class="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <!-- Input -->
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="placeholder"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleInputKeydown"
          autocomplete="off"
          class="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg
                 text-gray-900 placeholder-gray-500
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 transition-shadow"
        />

        <!-- Clear button or Keyboard shortcut hint -->
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div v-if="loadingSuggestions" class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <button
            v-else-if="query"
            @click="clearSearch"
            type="button"
            class="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <span
            v-else-if="!isFocused"
            class="text-xs text-gray-400 hidden sm:block"
          >
            <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">⌘K</kbd>
          </span>
        </div>
      </div>

      <!-- Autocomplete Dropdown -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      >
        <ul class="max-h-64 overflow-y-auto">
          <li
            v-for="(suggestion, index) in suggestions"
            :key="index"
            @mousedown.prevent="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
            :class="[
              'px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors',
              index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
            ]"
          >
            <!-- Icon -->
            <span class="text-lg flex-shrink-0">{{ getSuggestionIcon(suggestion.type) }}</span>

            <!-- Text -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 truncate">{{ suggestion.text }}</div>
              <div v-if="suggestion.location" class="text-xs text-gray-500 truncate">
                in {{ suggestion.location }}
              </div>
              <div v-else-if="suggestion.primaryName" class="text-xs text-gray-500 truncate">
                also known as {{ suggestion.primaryName }}
              </div>
              <div v-else-if="suggestion.type === 'brand'" class="text-xs text-gray-500">
                Brand
              </div>
            </div>

            <!-- Type badge -->
            <span
              v-if="suggestion.type === 'alternate'"
              class="flex-shrink-0 text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded"
            >
              Alias
            </span>
          </li>
        </ul>

        <!-- Footer hint -->
        <div class="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
          <span>
            <kbd class="px-1 py-0.5 bg-white border rounded text-xs">↑</kbd>
            <kbd class="px-1 py-0.5 bg-white border rounded text-xs ml-0.5">↓</kbd>
            navigate
          </span>
          <span>
            <kbd class="px-1 py-0.5 bg-white border rounded text-xs">Enter</kbd>
            select
          </span>
        </div>
      </div>

      <!-- Recent Searches Dropdown -->
      <div
        v-if="showRecentSearches && recentSearches.length > 0"
        class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      >
        <!-- Header with clear button -->
        <div class="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Searches</span>
          <button
            @mousedown.prevent="clearRecentSearches"
            class="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        </div>

        <ul class="max-h-64 overflow-y-auto">
          <li
            v-for="(search, index) in recentSearches"
            :key="index"
            @mousedown.prevent="selectRecentSearch(search)"
            @mouseenter="selectedIndex = index"
            :class="[
              'px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors',
              index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
            ]"
          >
            <!-- Clock icon -->
            <svg class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>

            <!-- Search text -->
            <span class="text-gray-700 truncate">{{ search.query }}</span>
          </li>
        </ul>

        <!-- Footer hint -->
        <div class="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
          <span>
            <kbd class="px-1 py-0.5 bg-white border rounded text-xs">↑</kbd>
            <kbd class="px-1 py-0.5 bg-white border rounded text-xs ml-0.5">↓</kbd>
            navigate
          </span>
          <span>
            <kbd class="px-1 py-0.5 bg-white border rounded text-xs">Enter</kbd>
            select
          </span>
        </div>
      </div>
    </div>
  `,
};
