Deploying the backend to Render
==============================

This document shows the minimal steps to deploy the Express backend in `server/` to Render and attach a persistent PostgreSQL database.

1) Create a Managed PostgreSQL on Render
- In Render dashboard: New → Database → PostgreSQL.
- Choose a plan and create the DB. When ready, copy the `DATABASE_URL` connection string.

2) Create a Web Service for the backend
- New → Web Service → Connect your Git provider and pick the `prodiving/prodesk` repo and `main` branch.
- Environment:
  - Root Directory: `server`
  - Build Command: (leave blank) or `npm ci` if you want install step
  - Start Command: `npm run start`
  - Health Check Path: `/health`

3) Set environment variables on the Render service
- Add `DATABASE_URL` (the value from step 1).
- Add `NODE_ENV=production`.
- Add `AUTO_SEED=false` (recommended) to avoid accidental re-seeding in production. If you need an initial seed, run the `seed` script manually once or set `AUTO_SEED=true` temporarily.
- If you used Supabase before, remove Supabase envs from the Render service to prevent accidental usage.

4) Automatic migrations
- The `start` script now runs `node migrate.js` before starting the server. `migrate.js` calls your adapter's `initDb()` which is idempotent (uses CREATE TABLE IF NOT EXISTS and safe alters).
- This ensures the DB schema is applied on deploy automatically.

5) Post-deploy smoke checks
- After the service is live, run these checks from your machine or CI to verify the API and data:
  ```bash
  curl -fsS https://<your-render-service>.onrender.com/health
  curl -fsS -H "x-user-id: smoke" https://<your-render-service>.onrender.com/api/divers | jq 'length > 0'
  curl -fsS -H "x-user-id: smoke" https://<your-render-service>.onrender.com/api/equipment | jq 'length > 0'
  ```

6) Backups & safety
- Use Render's DB backup options or subscribe to a plan with backups enabled.
- Keep `AUTO_SEED=false` in production and only seed manually when required.

7) Optional: Deploy frontend
- Frontend can be hosted on Cloudflare Pages, Vercel, or Render Pages.
- Build-time envs (`VITE_API_URL`, `VITE_SUPABASE_URL`, etc.) must be set in the Pages provider so the built app points to your Render API.

If you want, I can also add a tiny GitHub Action that deploys and runs the smoke tests automatically after a push to `main`.
