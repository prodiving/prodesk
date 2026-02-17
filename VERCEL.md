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
