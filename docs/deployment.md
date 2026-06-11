# Deployment

## What Changes from Local to Production

Only `.env` changes. Zero code changes.

```env
# Flip this one flag
LOCAL_MODE=false

# These activate automatically when LOCAL_MODE=false
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=eastus
DATABASE_URL=postgresql://...  # Supabase URL
```

## Frontend — Vercel

1. Push to GitHub
2. Connect repo at vercel.com
3. Set env vars in Vercel dashboard
4. Done — auto-deploys on push

## Backend — Railway (dev/staging)

Easiest DX. Good for demos and testing.

```bash
railway login
railway init
railway up
```

Set env vars in Railway dashboard. WebSocket support works out of the box.

## Backend — Fly.io (production)

Better for production — WebSocket-first infra, minimal cold starts, more control.

```bash
fly launch
fly secrets set ANTHROPIC_API_KEY=... DEEPGRAM_API_KEY=... # etc
fly deploy
```

**Why not Render:** Free tier sleeps after 15 min of inactivity. Dealbreaker for a live voice demo — first request wakes the server with a multi-second delay.

## Database

- **Local:** SQLite (auto-created, zero config)
- **Production:** Supabase PostgreSQL — change `DATABASE_URL` in env, SQLAlchemy handles transparently

Supabase free tier is sufficient for portfolio/demo usage.

## Deploy Checklist

- [ ] `.env` has all production keys
- [ ] `LOCAL_MODE=false`
- [ ] `DATABASE_URL` points to Supabase
- [ ] Frontend `NEXT_PUBLIC_WS_URL` points to Fly.io backend
- [ ] CORS origins updated in `main.py`
- [ ] Fly.io `fly.toml` has correct port (8000)
