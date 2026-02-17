# Deploy to Fly.io in 5 Minutes

## 1. Install flyctl
```bash
# macOS
brew install flyctl

# Or download from: https://fly.io/docs/getting-started/installing-flyctl/
```

## 2. Sign up / Log in
```bash
flyctl auth signup
# or
flyctl auth login
```

## 3. Launch (repo root)
```bash
flyctl launch
```

When prompted:
- App name: `prodesk` (or custom)
- Region: pick one near you
- Postgres database: `no` (use SQLite for now)
- Redis: `no`

## 4. Deploy
```bash
flyctl deploy
```

Wait 2-3 minutes. You'll get a URL like `https://prodesk-XXXXX.fly.dev`

## 5. Test
```bash
curl https://prodesk-XXXXX.fly.dev/health
# Should return: {"ok":true}
```

## To add logs / debug
```bash
flyctl logs
```

## To redeploy after code changes
```bash
git push
# or
flyctl deploy
```

Done.
