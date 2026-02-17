# Deploy to Cloud: Neon + Railway + Cloudflare Pages

## Step 1: Create Database (Neon)

1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up" → create account
3. Create a new project
4. Neon will generate a PostgreSQL connection string
5. Copy it (looks like: `postgres://user:pass@host/dbname`)
6. Keep it safe — you'll need it for Railway

## Step 2: Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `prodiving/prodesk`
5. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm run start`
6. Click "Deploy"
7. Once deployed, go to project Settings → Variables
8. Click "New Variable"
   - Key: `DATABASE_URL`
   - Value: (paste the Neon connection string from Step 1)
9. Click "Add"
10. Redeploy (or Railway auto-redeploys)
11. Wait ~5 min. When done, Railway will show you the public URL (like `https://prodesk-production.up.railway.app`)
12. **Copy this URL** — you'll need it for Cloudflare

## Step 3: Deploy Frontend (Cloudflare Pages)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Pages" in sidebar → "Create a project"
3. Select "Connect to Git" → pick GitHub
4. Select repo `prodiving/prodesk`
5. Configure:
   - **Project name**: `prodesk` (or custom)
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: (leave blank)
6. Click "Environment variables" (under Build settings)
7. Add variable:
   - Key: `VITE_API_URL`
   - Value: (the Railway URL from Step 2, e.g. `https://prodesk-production.up.railway.app`)
8. Click "Save and Deploy"
9. Wait ~3 min. Cloudflare will show your live URL (like `https://prodesk-XXXXX.pages.dev`)

## Test

Open your Cloudflare Pages URL and test:
```bash
# Health check
curl https://prodesk-XXXXX.pages.dev/health
# Should return: {"ok":true}

# Divers
curl -H "x-user-id: test" https://prodesk-XXXXX.pages.dev/api/divers
# Should return: array of divers
```

## Done!

Your site is live. Frontend on Cloudflare, backend on Railway, DB on Neon.

Any issues, paste the error and I'll debug.
