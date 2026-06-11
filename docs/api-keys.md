# API Keys — What to Register

Register these before switching to production mode. All have free tiers sufficient for dev/portfolio.

| Service | Purpose | Free Tier | Sign Up |
|---|---|---|---|
| Anthropic | LLM (Claude Haiku 3.5) | $5 credit | console.anthropic.com |
| Deepgram | STT production | $200 free credits | deepgram.com |
| Gladia | STT comparison (A/B vs Deepgram) | 10 hrs/month | gladia.io |
| Cartesia | TTS English | Free tier available | cartesia.ai |
| Azure Cognitive Services | TTS Arabic | 500K chars/month free | portal.azure.com |
| ElevenLabs | TTS (expressiveness testing) | 10K chars/month | elevenlabs.io |
| OpenAI | LLM fallback / Whisper cloud | $5 credit | platform.openai.com |
| Railway | Backend hosting (dev/staging) | $5/month hobby | railway.app |
| Fly.io | Backend hosting (production) | 3 shared VMs free | fly.io |

## Priority Order

Register these first — needed before any cloud testing:
1. **Anthropic** — core LLM
2. **Deepgram** — core STT, $200 credits cover months of dev
3. **Cartesia** — core TTS English
4. **Azure** — TTS Arabic (free tier is generous)

Register when ready for deployment:
5. Railway or Fly.io — backend hosting

Optional (testing/comparison):
6. Gladia, ElevenLabs, OpenAI

## Where Keys Go

Add all keys to `.env` (never commit this file):

```env
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=eastus
```

`.env` is in `.gitignore`. Use `.env.example` for the template (no real values).
