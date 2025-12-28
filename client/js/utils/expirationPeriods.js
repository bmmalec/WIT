/**
 * Expiration Period Utilities
 * Calculates period dates, colors, and status for the color-coded expiration system
 */

// Period type configurations
const PERIOD_CONFIGS = {
  monthly: {
    label: 'Monthly',
    monthsPerPeriod: 1,
    periodsPerYear: 12,
  },
  quarterly: {
    label: 'Quarterly',
    monthsPerPeriod: 3,
    periodsPerYear: 4,
  },
  'semi-annual': {
    label: 'Semi-Annual',
    monthsPerPeriod: 6,
    periodsPerYear: 2,
  },
  annual: {
    label: 'Annual',
    monthsPerPeriod: 12,
    periodsPerYear: 1,
  },
};

// Default color scheme
const DEFAULT_COLORS = [
  { color: '#EF4444', name: 'Red' },
  { color: '#F97316', name: 'Orange' },
  { color: '#EAB308', name: 'Yellow' },
  { color: '#22C55E', name: 'Green' },
  { color: '#3B82F6', name: 'Blue' },
  { color: '#8B5CF6', name: 'Purple' },
];

// Pattern definitions for color-blind accessibility
// Each pattern is a CSS background-image value
const PATTERNS = [
  // Solid (no pattern) - Red
  { name: 'solid', css: 'none' },
  // Diagonal stripes - Orange
  {
    name: 'diagonal',
    css: `repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.4) 3px,
      rgba(255,255,255,0.4) 6px
    )`,
  },
  // Horizontal stripes - Yellow
  {
    name: 'horizontal',
    css: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.4) 3px,
      rgba(255,255,255,0.4) 6px
    )`,
  },
  // Dots - Green
  {
    name: 'dots',
    css: `radial-gradient(circle, rgba(255,255,255,0.5) 2px, transparent 2px)`,
    size: '8px 8px',
  },
  // Cross-hatch - Blue
  {
    name: 'crosshatch',
    css: `repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.3) 3px,
      rgba(255,255,255,0.3) 6px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.3) 3px,
      rgba(255,255,255,0.3) 6px
    )`,
  },
  // Vertical stripes - Purple
  {
    name: 'vertical',
    css: `repeating-linear-gradient(
      90deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.4) 3px,
      rgba(255,255,255,0.4) 6px
    )`,
  },
];

/**
 * Get period configuration
 * @param {string} periodType - Period type
 * @returns {Object} Period configuration
 */
export const getPeriodConfig = (periodType) => {
  return PERIOD_CONFIGS[periodType] || PERIOD_CONFIGS.quarterly;
};

/**
 * Calculate period index from a date
 * @param {Date} date - Date to check
 * @param {Date} startDate - Start date for period calculation
 * @param {string} periodType - Period type
 * @returns {number} Period index (0-based, can be negative for past periods)
 */
export const getPeriodIndex = (date, startDate, periodType) => {
  const config = getPeriodConfig(periodType);
  const start = new Date(startDate);
  const target = new Date(date);

  // Calculate months difference
  const monthsDiff =
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth());

  return Math.floor(monthsDiff / config.monthsPerPeriod);
};

/**
 * Get period start and end dates
 * @param {number} periodIndex - Period index
 * @param {Date} startDate - Start date for period calculation
 * @param {string} periodType - Period type
 * @returns {Object} { start: Date, end: Date }
 */
export const getPeriodDates = (periodIndex, startDate, periodType) => {
  const config = getPeriodConfig(periodType);
  const start = new Date(startDate);

  // Calculate period start
  const periodStart = new Date(start);
  periodStart.setMonth(start.getMonth() + periodIndex * config.monthsPerPeriod);

  // Calculate period end (day before next period starts)
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + config.monthsPerPeriod);
  periodEnd.setDate(periodEnd.getDate() - 1);

  return { start: periodStart, end: periodEnd };
};

/**
 * Get color for a period
 * @param {number} periodIndex - Period index
 * @param {Array} colorScheme - Color scheme array
 * @returns {Object} { color, name }
 */
export const getPeriodColor = (periodIndex, colorScheme = DEFAULT_COLORS) => {
  // Use modulo to cycle through colors
  const colorIndex = ((periodIndex % 6) + 6) % 6; // Handle negative indices
  return colorScheme[colorIndex] || DEFAULT_COLORS[colorIndex];
};

/**
 * Get pattern for a period (for color-blind accessibility)
 * @param {number} periodIndex - Period index
 * @returns {Object} { name, css, size? }
 */
export const getPeriodPattern = (periodIndex) => {
  const patternIndex = ((periodIndex % 6) + 6) % 6; // Handle negative indices
  return PATTERNS[patternIndex] || PATTERNS[0];
};

/**
 * Get combined style object for period indicator with optional pattern
 * @param {number} periodIndex - Period index
 * @param {Array} colorScheme - Color scheme array
 * @param {boolean} usePatterns - Whether to include patterns
 * @returns {Object} CSS style object
 */
export const getPeriodStyle = (periodIndex, colorScheme = DEFAULT_COLORS, usePatterns = false) => {
  const color = getPeriodColor(periodIndex, colorScheme);
  const style = {
    backgroundColor: color.color,
  };

  if (usePatterns) {
    const pattern = getPeriodPattern(periodIndex);
    if (pattern.css !== 'none') {
      style.backgroundImage = pattern.css;
      if (pattern.size) {
        style.backgroundSize = pattern.size;
      }
    }
  }

  return style;
};

/**
 * Get current period information
 * @param {Date} startDate - Start date for period calculation
 * @param {string} periodType - Period type
 * @param {Array} colorScheme - Color scheme array
 * @returns {Object} Current period info
 */
export const getCurrentPeriod = (startDate, periodType, colorScheme = DEFAULT_COLORS) => {
  const today = new Date();
  const periodIndex = getPeriodIndex(today, startDate, periodType);
  const { start, end } = getPeriodDates(periodIndex, startDate, periodType);
  const color = getPeriodColor(periodIndex, colorScheme);

  return {
    index: periodIndex,
    start,
    end,
    color: color.color,
    colorName: color.name,
    label: formatPeriodLabel(start, periodType),
  };
};

/**
 * Format period label
 * @param {Date} periodStart - Period start date
 * @param {string} periodType - Period type
 * @returns {string} Formatted label
 */
export const formatPeriodLabel = (periodStart, periodType) => {
  const year = periodStart.getFullYear();
  const month = periodStart.getMonth();

  switch (periodType) {
    case 'monthly':
      return periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'quarterly':
      const quarter = Math.floor(month / 3) + 1;
      return `Q${quarter} ${year}`;
    case 'semi-annual':
      const half = month < 6 ? 'H1' : 'H2';
      return `${half} ${year}`;
    case 'annual':
      return `${year}`;
    default:
      return periodStart.toLocaleDateString();
  }
};

/**
 * Generate period schedule for display
 * @param {Date} startDate - Start date for period calculation
 * @param {string} periodType - Period type
 * @param {Array} colorScheme - Color scheme array
 * @param {number} periodsToShow - Number of periods to show (default 12)
 * @returns {Array} Period schedule
 */
export const generatePeriodSchedule = (
  startDate,
  periodType,
  colorScheme = DEFAULT_COLORS,
  periodsToShow = 12
) => {
  const today = new Date();
  const currentPeriodIndex = getPeriodIndex(today, startDate, periodType);

  // Show 2 past periods + current + future periods
  const startIndex = currentPeriodIndex - 2;
  const schedule = [];

  for (let i = 0; i < periodsToShow; i++) {
    const periodIndex = startIndex + i;
    const { start, end } = getPeriodDates(periodIndex, startDate, periodType);
    const color = getPeriodColor(periodIndex, colorScheme);

    schedule.push({
      index: periodIndex,
      start,
      end,
      color: color.color,
      colorName: color.name,
      label: formatPeriodLabel(start, periodType),
      status: getPeriodStatus(periodIndex, currentPeriodIndex),
      isCurrent: periodIndex === currentPeriodIndex,
    });
  }

  return schedule;
};

/**
 * Get period status
 * @param {number} periodIndex - Period index
 * @param {number} currentPeriodIndex - Current period index
 * @returns {string} Status: 'expired', 'current', 'future'
 */
export const getPeriodStatus = (periodIndex, currentPeriodIndex) => {
  if (periodIndex < currentPeriodIndex) return 'expired';
  if (periodIndex === currentPeriodIndex) return 'current';
  return 'future';
};

/**
 * Format date range for display
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (start, end) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
};

export { PERIOD_CONFIGS, DEFAULT_COLORS, PATTERNS };
