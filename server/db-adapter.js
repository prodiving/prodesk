// Database wrapper that uses Supabase, PostgreSQL on Railway, or SQLite locally

let dbModule;

async function initializeDbModule() {
  // Prefer an explicit DATABASE_URL (Postgres) in production.
  // Fall back to local SQLite when DATABASE_URL is not set.
  const isDatabaseUrl = !!process.env.DATABASE_URL;

  if (isDatabaseUrl) {
    console.log('🔗 Using PostgreSQL (DATABASE_URL detected)');
    dbModule = await import('./db-postgres.js');
  } else {
    console.log('📁 Using SQLite (local development)');
    dbModule = await import('./db-sqlite.js');
  }
  
  return dbModule;
}

// Initialize on module load
if (!dbModule) {
  await initializeDbModule();
}

export async function initDb() {
  if (!dbModule) {
    await initializeDbModule();
  }
  return dbModule.initDb();
}

export function getDb() {
  if (!dbModule) {
    throw new Error('Database module not initialized');
  }
  if (dbModule.getDb) {
    return dbModule.getDb();
  }
  throw new Error('getDb not available in current database module');
}

export function getDbConnection() {
  if (!dbModule) {
    throw new Error('Database module not initialized');
  }
  if (dbModule.getDbConnection) {
    return dbModule.getDbConnection();
  }
  return { initialized: true };
}

// For PostgreSQL async operations
export async function queryDb(query, params) {
  if (!dbModule) {
    await initializeDbModule();
  }
  if (dbModule.queryDb) {
    return dbModule.queryDb(query, params);
  }
  throw new Error('queryDb not available');
}

export async function getDbRow(query, params) {
  if (!dbModule) {
    await initializeDbModule();
  }
  if (dbModule.getDbRow) {
    return dbModule.getDbRow(query, params);
  }
  throw new Error('getDbRow not available');
}

export async function runDb(query, params) {
  if (!dbModule) {
    await initializeDbModule();
  }
  if (dbModule.runDb) {
    return dbModule.runDb(query, params);
  }
  throw new Error('runDb not available');
}

export async function closeDbPool() {
  if (!dbModule) {
    return;
  }
  if (dbModule.closeDbPool) {
    return dbModule.closeDbPool();
  }
}
