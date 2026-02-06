const { PostHog } = require('posthog-node');

const POSTHOG_ENABLED = !!process.env.POSTHOG_API_KEY;

const client = POSTHOG_ENABLED
  ? new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    })
  : null;

if (!POSTHOG_ENABLED) {
  console.warn('WARNING: PostHog not configured. Set POSTHOG_API_KEY to enable analytics.');
}

const posthogService = {
  /**
   * Capture an event (fire-and-forget, never throws)
   * @param {string} distinctId - User ID
   * @param {string} event - Event name
   * @param {object} properties - Event properties
   */
  capture(distinctId, event, properties = {}) {
    if (!client || !distinctId) return;
    try {
      client.capture({
        distinctId: String(distinctId),
        event,
        properties: {
          ...properties,
          $lib: 'posthog-node',
        },
      });
    } catch (err) {
      console.error('PostHog capture failed:', err.message);
    }
  },

  /**
   * Identify a user with properties
   * @param {string} distinctId - User ID
   * @param {object} properties - User properties
   */
  identify(distinctId, properties = {}) {
    if (!client || !distinctId) return;
    try {
      client.identify({
        distinctId: String(distinctId),
        properties,
      });
    } catch (err) {
      console.error('PostHog identify failed:', err.message);
    }
  },

  /**
   * Graceful shutdown - flush pending events
   */
  async shutdown() {
    if (client) {
      try {
        await client.shutdown();
      } catch (err) {
        console.error('PostHog shutdown failed:', err.message);
      }
    }
  },
};

module.exports = posthogService;
