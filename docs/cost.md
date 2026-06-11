# Cost Estimate

## Production at 200 requests/day

| Service | Usage | Cost/day |
|---|---|---|
| Deepgram Nova-3 (STT) | 200 req × ~1 min avg | ~$1.54 |
| Claude Haiku 3.5 (LLM) | 200 req × ~500 tokens | ~$0.06 |
| Cartesia Sonic 3.5 (TTS English) | 200 req × ~200 chars | ~$0.60 |
| Azure Neural TTS (Arabic) | 200 req × ~200 chars | ~$0.30 |
| **Total** | | **~$2.50/day** |

**~$75/month at full 200 req/day load.**

## Portfolio/Demo Usage

At low traffic (20-30 req/day, mostly testing):
- **Under $5/month total**
- Deepgram $200 free credits cover months
- Azure 500K chars/month free covers all Arabic TTS
- Cartesia free tier covers initial testing

## Free Tier Coverage

| Service | Free Allowance | Covers |
|---|---|---|
| Deepgram | $200 credits | ~25,000 minutes of audio |
| Azure TTS | 500K chars/month | ~2,500 responses/month |
| Cartesia | Free tier (check dashboard) | Initial dev |
| Anthropic | $5 credit | ~80K Claude Haiku requests |
| Fly.io | 3 shared VMs | Backend hosting |
| Vercel | Hobby plan | Frontend hosting |

## Local Dev Cost

$0. Everything runs on the RTX 3050:
- Ollama + Llama 3.1 8B — free
- faster-whisper CUDA — free
- Piper TTS — free
