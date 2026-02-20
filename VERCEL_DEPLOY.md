Vercel deployment instructions

1. Connect the repository to Vercel (https://vercel.com/new)
2. In Project Settings → Environment Variables add:
   - DATABASE_URL = postgres://USER:PASSWORD@HOST:5432/postgres
   - ALLOWED_ORIGINS = https://<your-frontend-domain>,http://localhost:5173
   - Any other keys (STRIPE_SECRET, etc.)
3. Build & Output Settings:
   - Framework Preset: Other
   - Build Command: (none)
   - Output Directory: (none)
4. Deploy the project. Vercel will run the `server/index.js` as serverless function for API routes.

Notes:
- If you want a persistent server (non-serverless), consider deploying to Render or Fly instead.
- After deploy, copy the Vercel URL and set `VITE_API_URL` in your Amplify environment variables, then redeploy frontend.
