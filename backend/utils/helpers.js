/**
 * Shared utility functions for route handlers
 */

/**
 * Escape regex special characters to prevent NoSQL injection
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
