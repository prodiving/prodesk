#!/usr/bin/env node
import { initDb } from './db-adapter.js';

async function run() {
  try {
    console.log('🔧 Running migrations/initDb...');
    await initDb();
    console.log('✅ Migrations/init complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
