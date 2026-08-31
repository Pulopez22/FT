require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pricing-seed.json'), 'utf8'));
const SOURCE_NAMES = new Set(Object.keys(seed));
const blocked = new Set(['__proto__', 'prototype', 'constructor']);

function applyOverride(root, overridePath, value) {
  const parts = String(overridePath || '').split('.');
  const source = parts.shift();
  if (!SOURCE_NAMES.has(source) || !root[source]) return false;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return false;

  function resolve(target, remaining) {
    if (!target || typeof target !== 'object' || !remaining.length) return null;
    for (let take = remaining.length; take >= 1; take--) {
      const key = remaining.slice(0, take).join('.');
      if (blocked.has(key) || !Object.prototype.hasOwnProperty.call(target, key)) continue;
      if (take === remaining.length) return { target, key };
      const found = resolve(target[key], remaining.slice(take));
      if (found) return found;
    }
    return null;
  }

  const found = resolve(root[source], parts);
  if (!found) return false;
  found.target[found.key] = numeric;
  return true;
}

(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing.');
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const pricing = JSON.parse(JSON.stringify(seed));

  // Preserve every value already changed through Edit Pricing.
  const overrides = await db.collection('pricingoverrides').find({}).toArray();
  let applied = 0;
  for (const item of overrides) if (applyOverride(pricing, item.path, item.value)) applied++;

  await db.collection('pricingcatalogs').updateOne(
    { key: 'storefront' },
    { $set: { key: 'storefront', pricing, updatedAt: new Date() } },
    { upsert: true }
  );

  console.log(`Pricing migration complete: ${Object.keys(pricing).length} sources, ${applied}/${overrides.length} existing overrides applied.`);
  console.log('MongoDB collection: pricingcatalogs | document key: storefront');
  await mongoose.disconnect();
})().catch(async err => {
  console.error('Pricing migration failed:', err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
