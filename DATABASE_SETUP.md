# PostgreSQL Database Setup for Railway

## Status: ✅ Complete

### What's been set up:

1. **Dual-Database Support Created**
   - `db-adapter.js` - Intelligently selects between SQLite and PostgreSQL based on `DATABASE_URL` environment variable
   - `db-sqlite.js` - SQLite implementation for local development (14 tables, full schema)
   - `db-postgres.js` - PostgreSQL implementation for Railway production (async/await, SSL support)

2. **Database Adapter Features**
   - Automatically detects `DATABASE_URL` environment variable
   - If `DATABASE_URL` is set → Uses PostgreSQL (Railway production)
   - If `DATABASE_URL` is NOT set → Uses SQLite (local development)
   - Logs which database is being used at startup
   - Provides unified interface: `getDb()`, `initDb()`, `queryDb()`, `getDbRow()`, `runDb()`

3. **Server Integration**
   - Updated `server/index.js` to import from `db-adapter.js`
   - Changed all `getDb()` calls to `dbAdapter.getDb()`
   - Added `pg` package to `package/json` dependencies
   - Server detects database type and initializes accordingly

4. **Schema**
   - 14 tables created in both SQLite and PostgreSQL:
     - Core tables: divers, equipment, bookings, rental_assignments
     - Supporting tables: groups, courses, instructors, boats, accommodations
     - Additional: dive_sites, trip_assignments, transactions, waivers, trips, schedules
   - Auto-migrations: Tables are only created if they don't exist
   - Seeding: Local SQLite database is auto-seeded if empty (5 divers, 8 equipment items)

### Current Status:

✅ **Local Development:**
- Server starts with SQLite
- Logs: "📁 Using SQLite (local development)"
- All existing features working
- Database seeding works automatically

### Next Steps for Railway Deployment:

1. **Set DATABASE_URL on Railway:**
   ```
   In Railway dashboard:
   - Go to project settings
   - Add environment variable: DATABASE_URL
   - Value: (automatic when you add PostgreSQL plugin)
   ```

2. **Add PostgreSQL to Railway:**
   - In Railway dashboard, add PostgreSQL plugin to project
   - This automatically creates DATABASE_URL environment variable

3. **Deploy to Railway:**
   ```bash
   git push origin main  # or your deployment branch
   ```
   - Railway will:
     - Detect DATABASE_URL environment variable
     - Server will use `db-postgres.js`
     - Auto-migrations will create all 14 tables
     - Logs: "🔗 Using PostgreSQL (DATABASE_URL detected)"

4. **Verify Production:**
   - Check Railway dashboard logs for initialization messages
   - Test health endpoint: `https://your-railway-app.up.railway.app/health`
   - Verify database is created (Railway PostgreSQL console)

### Local Testing (After setup):

```bash
# Local with SQLite
npm run dev  # Uses SQLite, auto-seeds if empty

# To test PostgreSQL locally (optional):
# Set DATABASE_URL environment variable and run
DATABASE_URL="postgresql://user:pass@localhost/dbname" npm run dev
```

### Database Connection Details:

**Railway PostgreSQL (Automatic):**
- Hostname: Provided by Railway
- Port: 5432
- SSL: Enabled by default
- Auto-migrations: Runs on first startup
- No manual schema creation needed

**Local SQLite:**
- File-based: `server/db.sqlite`
- Includes test data: 5 divers, 8 equipment items
- Persists across restarts
- No setup required

### Important Notes:

- The server is now environment-aware and doesn't require any code changes to work with both databases
- Both local and production use the exact same schema (14 tables)
- Auto-migrations ensure schema is always up-to-date
- No manual database setup needed on Railway
- Connection pooling is implemented for PostgreSQL (better performance)
- SSL is automatically configured for Railway

### Files Changed:

1. `server/db-adapter.js` - NEW: Database adapter with environment detection
2. `server/db-sqlite.js` - NEW: SQLite implementation (renamed from db.js)
3. `server/db-postgres.js` - NEW: PostgreSQL implementation with async/await
4. `server/index.js` - UPDATED: Import from adapter, replace getDb() calls
5. `server/package.json` - UPDATED: Added `pg` dependency (v8.x)

### Testing Checklist:

- ✅ Server starts locally with SQLite
- ✅ Database adapter logs correct database type
- ✅ Package.json includes `pg` dependency
- ✅ All 14 tables schema created for both databases
- ✅ Auto-seeding works for SQLite
- ⏳ Pending: Set DATABASE_URL on Railway and redeploy
- ⏳ Pending: Verify PostgreSQL connection on Railway
- ⏳ Pending: Verify auto-migrations on Railway

