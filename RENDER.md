Deploy to Render in 4 Steps
==========================

1. Create a Render Web Service
   - Render dashboard → New → Web Service
   - Connect GitHub repo `prodiving/prodesk`, branch `main`
   - Root Directory: `.` (dot)
   - Build Command: `npm ci && npm run build`
   - Start Command: `cd server && npm ci && npm run start`

2. Add Environment Variables
   - In service Settings → Environment, add:
     - `NODE_ENV` = `production`
     - `AUTO_SEED` = `false`

3. Deploy
   - Click "Create Web Service"
   - Wait for build/deploy (5-10 min)

4. Test
   ```bash
   curl https://prodesk-XXXX.onrender.com/health
   # Should return: {"ok":true}
   ```

Done. Your site is live.
