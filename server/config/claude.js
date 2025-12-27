/**
 * Claude AI Configuration
 * Initializes and exports the Anthropic client
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
// The SDK automatically uses ANTHROPIC_API_KEY from environment
const anthropic = new Anthropic();

// Model configuration
const MODELS = {
  // Use Sonnet for balanced speed/quality
  VISION: 'claude-sonnet-4-20250514',
  // Use Haiku for quick/simple tasks
  FAST: 'claude-haiku-4-20250514',
};

// Default settings
const DEFAULTS = {
  maxTokens: 1024,
  temperature: 0.3, // Lower temperature for more consistent results
};

module.exports = {
  anthropic,
  MODELS,
  DEFAULTS,
};
