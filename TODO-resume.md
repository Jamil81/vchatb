# Resume checklist — if PC shut down or internet dropped

Written 2026-06-11 ~23:58. State at that moment: Whisper `tiny` model download
was at ~73% (52 of 72 MB). Everything else already works.

## What already works (no need to redo)

- Backend runs: `.\venv\Scripts\uvicorn.exe backend.main:app --port 8000`
  (from project root, NO `--reload` — it's broken on this machine, see commands.md)
- Frontend runs: `npm run dev` in `frontend/`
- WebSocket connects, voice reaches the backend
- Ollama (llama3.1:8b) and Piper TTS are local — already on disk
- `.env` should have `WHISPER_MODEL=tiny` for now

## Step 1 — Check if the tiny model finished downloading

```powershell
Get-Item "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-tiny\snapshots\d90ca5fe260221311c53c58e660288d3deb8d356\model.bin" -ErrorAction SilentlyContinue | Select-Object @{N='MB';E={[math]::Round($_.Length/1MB,1)}}
```

- **~72 MB** → download complete, go to Step 3
- **Less than 72 MB or missing** → go to Step 2

## Step 2 — Resume the download (continues where it stopped)

```powershell
$dest = "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-tiny\snapshots\d90ca5fe260221311c53c58e660288d3deb8d356\model.bin"
curl.exe -L -C - --retry 20 --retry-delay 5 --retry-all-errors -o $dest "https://huggingface.co/Systran/faster-whisper-tiny/resolve/d90ca5fe260221311c53c58e660288d3deb8d356/model.bin"
```

`-C -` resumes from the existing partial file. Re-run Step 1 to verify ~72 MB.

## Step 3 — Start the app and test

```powershell
# Terminal 1 — backend (project root)
cd j:\laragon\www\bots\vchatb
.\venv\Scripts\uvicorn.exe backend.main:app --port 8000

# Terminal 2 — frontend
cd j:\laragon\www\bots\vchatb\frontend
npm run dev
```

Open http://localhost:3000, wait for the green dot, hold mic, speak a full
sentence, release. Watch the backend terminal for `STT ...ms: <your words>`.

## Step 4 — Morning (fast connection): GPU + medium model

~2.6 GB total. Commands also in `commands.md`:

```powershell
cd j:\laragon\www\bots\vchatb

# GPU libraries (~1.1 GB)
.\venv\Scripts\pip.exe install nvidia-cublas-cu12 nvidia-cudnn-cu12

# Whisper medium model (~1.5 GB)
.\venv\Scripts\python.exe -c "from huggingface_hub import snapshot_download; print(snapshot_download('Systran/faster-whisper-medium'))"
```

If that python download stalls like tonight, use the curl method instead:

```powershell
$rev = (Invoke-RestMethod "https://huggingface.co/api/models/Systran/faster-whisper-medium/revision/main").sha
$dir = "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium\snapshots\$rev"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
foreach ($f in "model.bin","config.json","tokenizer.json","vocabulary.txt") {
  curl.exe -L -C - --retry 20 --retry-delay 5 --retry-all-errors -o "$dir\$f" "https://huggingface.co/Systran/faster-whisper-medium/resolve/main/$f"
}
"$rev" | Set-Content "$env:USERPROFILE\.cache\huggingface\hub\models--Systran--faster-whisper-medium\refs\main" -NoNewline -Force -ErrorAction SilentlyContinue
```

Then:
1. Edit `.env`: `WHISPER_MODEL=medium` (keep `WHISPER_DEVICE=cuda`)
2. Restart the backend
3. Backend terminal should say `Loading Whisper medium on cuda`

## Known issues already fixed (don't chase these again)

- "Connecting forever" / WebSocket timeout → was `--reload` spawning a broken
  worker; never use `--reload` here
- Port 8000 stuck LISTENING with nothing answering → kill orphaned python
  processes (see commands.md troubleshooting)
- Backend crash on browser refresh ("Cannot call receive once disconnect...")
  → fixed in `backend/main.py`
- Whisper picked CPU despite GPU → fixed in `backend/stt.py`; GPU needs the
  Step 4 libraries to actually engage
