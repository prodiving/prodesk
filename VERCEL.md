# Deploy to Vercel in 4 Steps

## 1. Sign up / Log in
- Go to [vercel.com](https://vercel.com)
- Sign in with GitHub

## 2. Import your project
- Click "Add New..." → "Project"
- Select repo `prodiving/prodesk`
- Click "Import"

## 3. Configure Build Settings
Vercel should auto-detect. If it asks:
- **Framework Preset**: Other (Node.js)
- **Root Directory**: `.` (leave blank = root)
  - **Build Command**: `npm ci && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

Then add Environment Variables:
- `NODE_ENV` = `production`
- `AUTO_SEED` = `false`

Optional: Add Supabase environment variables (recommended for persistent data)
- `VITE_SUPABASE_URL` = `https://<project>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `<anon-public-key>`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `<publishable-key>`

For a persistent server-side Postgres connection (so the `server` uses Supabase/Postgres
instead of ephemeral SQLite), add the Supabase Postgres connection string as:
- `DATABASE_URL` = `postgres://<user>:<password>@<host>:5432/<database>`

Use the Vercel CLI to add environment variables interactively:
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
vercel env add DATABASE_URL production
```

Or add them in the Vercel Dashboard → Project → Settings → Environment Variables.

After adding these envs, trigger a new deployment so the frontend is built with the `VITE_*` values and the server picks up `DATABASE_URL`.

## 4. Deploy
- Click "Deploy"
- Wait 2-5 minutes
- When done, you'll get a URL like `https://prodesk-XXXXX.vercel.app`

## Test
```bash
curl https://your-url.vercel.app/health
# Should return: {"ok":true}
```

That's it. Done.
