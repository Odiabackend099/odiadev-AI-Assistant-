# ODIADEV Voice AI Assistant — Vercel (Classic UI)
Nigeria‑first assistant (ChatGPT/Grok/Gemini style) with serverless APIs and ODIADEV TTS.

## One‑Click Deploy (Vercel CLI)
```bash
npm i -g vercel
vercel link --yes
vercel env add ANTHROPIC_API_KEY
vercel env add ANTHROPIC_MODEL              # e.g. claude-3-haiku-20240307
vercel env add TTS_SERVICE_URL              # e.g. https://vgh0i1c5ko11.manus.space
vercel env add TTS_SERVICE_KEY
vercel env add VALID_API_KEYS               # e.g. odiadev_xxx,odiadev_yyy
vercel deploy --prod
```

## Structure
- `index.html` → Your classic AI UI (integrated to /api/chat + /api/tts)
- `api/` → serverless functions (health, chat, tts proxy, key check)
- `docs/` → deployment guide, testing report, final summary
- `checklist/` → ODIA‑TTS production checklist
- `.github/workflows/` → minimal CI
- `scripts/` → helpers (API key generator, smoke)

## Security
- Secrets live in Vercel env, never in Git.
- All `/api/*` require `X-API-Key` present in `VALID_API_KEYS`.
