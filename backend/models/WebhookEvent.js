const mongoose = require('mongoose');

/**
 * WebhookEvent model for Stripe webhook idempotency
 * Tracks processed webhook events to prevent duplicate processing
 * Auto-deletes after 30 days via TTL index
 */
const webhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  error: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// TTL index - auto-delete after 30 days
webhookEventSchema.index(
  { processedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// Compound index for querying recent events by type
webhookEventSchema.index({ eventType: 1, processedAt: -1 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
