/**
 * Migration Script: Migrate users to free tier
 *
 * Run manually: node backend/scripts/migrate-to-free-tier.js
 *
 * What it does:
 * 1. Migrates owner_operator users to free plan
 * 2. Migrates expired trial users to free plan
 * 3. Migrates canceled users (no Stripe sub) to free plan
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // 1. Migrate owner_operator → free
  const r1 = await users.updateMany(
    { 'subscription.plan': 'owner_operator' },
    { $set: { 'subscription.plan': 'free', 'subscription.status': 'active', 'subscription.stripeSubscriptionId': null } }
  );
  console.log(`1. owner_operator → free: ${r1.modifiedCount} users`);

  // 2. Expired trials → free
  const r2 = await users.updateMany(
    { 'subscription.plan': 'free_trial', 'subscription.trialEndsAt': { $lt: new Date() } },
    { $set: { 'subscription.plan': 'free', 'subscription.status': 'active' } }
  );
  console.log(`2. expired trials → free: ${r2.modifiedCount} users`);

  // 3. Canceled subs with no Stripe → free
  const r3 = await users.updateMany(
    { 'subscription.status': 'canceled', 'subscription.stripeSubscriptionId': null },
    { $set: { 'subscription.plan': 'free', 'subscription.status': 'active' } }
  );
  console.log(`3. canceled (no Stripe) → free: ${r3.modifiedCount} users`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
