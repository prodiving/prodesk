# Railway Deploy Guide

## Quick Deploy Steps

### 1. Push Code to GitHub

```bash
cd /Users/OneMedia/prodesk
git add server/db-adapter.js server/db-postgres.js server/db-sqlite.js server/index.js server/package.json
git commit -m "feat: Add PostgreSQL support with dual-database adapter for Railway"
git push origin main
```

### 2. Configure Railway

In Railway Dashboard:

1. **Go to Project** → Click on your deployment
2. **Add Service** → Select "PostgreSQL"
   - This automatically creates a PostgreSQL instance
   - Sets `DATABASE_URL` environment variable automatically
3. **Wait for PostgreSQL to finish deploying** (2-3 minutes)

### 3. Redeploy Application

1. **Go to Backend Service**
2. **Click Deployments** 
3. **Redeploy** (or push a new commit to trigger automatic deploy)

### 4. Monitor Startup

1. **Click the new deployment**
2. **View Logs**
3. Look for these messages:
   - ✅ `🔗 Using PostgreSQL (DATABASE_URL detected)`
   - ✅ `Server running on http://0.0.0.0:3000`
   - ✅ `CREATE TABLE IF NOT EXISTS` messages (migrations running)

### 5. Test Production

```bash
# Health check
curl https://your-app.up.railway.app/health

# Get divers (should return 5 auto-seeded divers)
curl -H "x-user-id: test" https://your-app.up.railway.app/api/divers | jq '.[] | .name'
```

## What Happens Automatically

1. **Database Detection**: Server checks for `DATABASE_URL`
2. **PostgreSQL Connection**: Uses `db-postgres.js` with connection pooling
3. **Auto-Migrations**: All 14 tables created automatically if missing
4. **No Manual Setup**: Database is ready to use immediately

## Troubleshooting

### Logs show "Using SQLite" on Railway?
- Check that PostgreSQL service is added to Railway project
- Verify `DATABASE_URL` environment variable is set
- Redeploy the application

### Connection refused error?
- PostgreSQL might still be initializing (wait 2-3 minutes)
- Check Railway PostgreSQL service status (should be "Running")
- Verify DATABASE_URL format in Railway settings

### Tables not created?
- Check server logs for migration errors
- Manually trigger redeploy to run migrations again
- Access Railway PostgreSQL console and verify tables manually

## Files Changed

- `server/index.js` - Updated to use db-adapter
- `server/db-adapter.js` - NEW: Environment-aware database selector
- `server/db-postgres.js` - NEW: PostgreSQL implementation
- `server/db-sqlite.js` - NEW: SQLite implementation (extracted from db.js)
- `server/package.json` - Added `pg` dependency

## Rollback (if needed)

If you need to revert to the old setup:

```bash
# Use the original db.js
git checkout server/db.js
git revert HEAD  # Revert the latest commit
git push origin main
# Railway will automatically redeploy with old code
```

## Environment Variables

Railway automatically sets these for PostgreSQL:

- `DATABASE_URL` - Used to detect PostgreSQL mode and connect
- Other defaults handled by Railway

No manual environment variable setup needed!

## Verification Checklist

- [ ] PostgreSQL service added to Railway project  
- [ ] Code deployed to Railway
- [ ] Logs show `🔗 Using PostgreSQL (DATABASE_URL detected)`
- [ ] Health endpoint responds 200
- [ ] `/api/divers` returns data
- [ ] Test rental workflow: create booking with equipment

## Next Steps

After successful deployment:

1. Test the rental feature end-to-end
2. Monitor logs for any issues
3. Run any additional seeding if needed
4. Update frontend `VITE_API_URL` to point to Railway app

