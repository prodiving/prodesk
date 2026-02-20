// Database wrapper that uses Supabase, PostgreSQL on Railway, or SQLite locally

let dbModule;

async function initializeDbModule() {
  // Optionally force SQLite (useful for Vercel preview sites or when you
  // explicitly want the bundled local DB). Set `FORCE_SQLITE=true` or when
  // running on Vercel (process.env.VERCEL === '1') to prefer SQLite.
  const forceSqlite = (process.env.FORCE_SQLITE === 'true') || (process.env.VERCEL === '1');
  // Prefer an explicit DATABASE_URL (Postgres) unless forced to use SQLite.
  const isDatabaseUrl = !!process.env.DATABASE_URL && !forceSqlite;

  if (isDatabaseUrl) {
    console.log('🔗 Using PostgreSQL (DATABASE_URL detected)');
    dbModule = await import('./db-postgres.js');
  } else {
    console.log('📁 Using SQLite (local or forced)');
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

  // If the module exposes async Postgres helpers, provide a SQLite-compatible
  // wrapper so existing code that calls `db.all/get/run` continues to work.
  if (dbModule.queryDb || dbModule.getDbRow || dbModule.runDb) {
    return {
      all(sql, paramsOrCb, cbIfAny) {
        let params = [];
        let cb = cbIfAny;
        if (typeof paramsOrCb === 'function') {
          cb = paramsOrCb;
        } else if (Array.isArray(paramsOrCb)) {
          params = paramsOrCb;
        }
        dbModule.queryDb(sql, params).then(rows => cb && cb(null, rows)).catch(err => cb && cb(err));
      },
      get(sql, paramsOrCb, cbIfAny) {
        let params = [];
        let cb = cbIfAny;
        if (typeof paramsOrCb === 'function') {
          cb = paramsOrCb;
        } else if (Array.isArray(paramsOrCb)) {
          params = paramsOrCb;
        }
        dbModule.getDbRow(sql, params).then(row => cb && cb(null, row)).catch(err => cb && cb(err));
      },
      run(sql, paramsOrCb, cbIfAny) {
        let params = [];
        let cb = cbIfAny;
        if (typeof paramsOrCb === 'function') {
          cb = paramsOrCb;
        } else if (Array.isArray(paramsOrCb)) {
          params = paramsOrCb;
        }
        dbModule.runDb(sql, params).then(() => cb && cb(null)).catch(err => cb && cb(err));
      },
      close() {
        // no-op for pooled Postgres connections; close handled separately
        return;
      }
    };
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
