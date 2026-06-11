# Commands — Run the App

All commands are PowerShell, run from the project root (`j:\laragon\www\bots\vchatb`) unless noted.

## Start the app

Ollama runs as a Windows service — no need to start it manually.

### Terminal 1 — Backend (FastAPI + uvicorn)

```powershell
cd j:\laragon\www\bots\vchatb
.\venv\Scripts\uvicorn.exe backend.main:app --port 8000
```

> Do NOT use `--reload` — on this machine (venv built on miniconda) the reload
> supervisor spawns its worker with the wrong Python, so the server listens but
> never responds. After backend code changes, stop with `Ctrl+C` and start again.

Wait for:

```
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

### Terminal 2 — Frontend (Next.js)

```powershell
cd j:\laragon\www\bots\vchatb\frontend
npm run dev
```

### Open the app

http://localhost:3000 — wait for the green **connected** dot, then hold the mic button to speak.

## Verify everything is running

```powershell
# Backend health — should return {"status":"ok",...}
curl http://127.0.0.1:8000/health

# Ports in use
netstat -ano | findstr ":8000 :3000" | findstr "LISTENING"
```

## Stop the app

- **Backend:** press `Ctrl+C` in its terminal. Do NOT just close the window — that orphans the worker process and jams port 8000.
- **Frontend:** press `Ctrl+C` in its terminal.

## Troubleshooting

### Port 8000 stuck (backend won't start or never responds)

A zombie worker may be holding the port. Clear it:

```powershell
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
```

If the port still shows LISTENING, find orphaned Python workers and kill them:

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like '*multiprocessing*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Then start the backend again.

### Port 3000 stuck

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
```

### Frontend says "Connecting to backend..." forever

1. Check `curl ` responds.
2. If it hangs: clear port 8000 (above) and restart the backend.
3. Refresh the browser.

## One-time: enable GPU + medium model (run on a fast connection)

Two downloads (~2.6 GB total), then Whisper runs on the RTX 3050:

```powershell
cd j:\laragon\www\bots\vchatb

# 1. GPU libraries for ctranslate2 (~1.1 GB)
.\venv\Scripts\pip.exe install nvidia-cublas-cu12 nvidia-cudnn-cu12

# 2. Whisper medium model (~1.5 GB, cached after first download)
.\venv\Scripts\python.exe -c "from huggingface_hub import snapshot_download; print(snapshot_download('Systran/faster-whisper-medium'))"
```

Then edit `.env`: set `WHISPER_MODEL=medium` (keep `WHISPER_DEVICE=cuda`), restart
the backend, and watch for `Loading Whisper medium on cuda` in its terminal.

### First voice request is slow

Normal — faster-whisper loads the model on first use (can take 30–60s). Watch the backend terminal for `Loading Whisper ...`, then `STT ...ms`.
http://127.0.0.1:8000/health