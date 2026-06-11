# Whisper update — GPU + medium model

Run on a fast connection (early morning). Total download ~2.6 GB.

```powershell
cd j:\laragon\www\bots\vchatb

# 1. GPU libraries (~1.1 GB)
.\venv\Scripts\pip.exe install nvidia-cublas-cu12 nvidia-cudnn-cu12

# 2. Whisper medium model (~1.5 GB)
.\venv\Scripts\python.exe -c "from huggingface_hub import snapshot_download; print(snapshot_download('Systran/faster-whisper-medium'))"
```

## After both downloads finish

1. Edit `.env`: change `WHISPER_MODEL=tiny` to `WHISPER_MODEL=medium`
   (keep `WHISPER_DEVICE=cuda`)
2. Restart the backend:

```powershell
cd j:\laragon\www\bots\vchatb
.\venv\Scripts\uvicorn.exe backend.main:app --port 8000
```

3. Speak once and check the backend terminal — it should say:

```
Loading Whisper medium on cuda
```

If it says `cpu` or `GPU load failed`, the GPU libraries didn't install
correctly — re-run step 1.

## If the model download stalls (like tonight)

Use the curl fallback from `TODO-resume.md` Step 4 — it resumes where it
stopped and survives interruptions.
