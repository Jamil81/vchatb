# VChatBot — Windows Setup
# Run from the vchatb/ root: .\setup.ps1

Write-Host "`n=== VChatBot Setup ===" -ForegroundColor Cyan

# 1. Copy env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[ok] .env created from .env.example — edit it before running" -ForegroundColor Green
} else {
    Write-Host "[skip] .env already exists" -ForegroundColor Yellow
}

# 2. Python backend
Write-Host "`n--- Backend (Python) ---"
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "[ok] venv created" -ForegroundColor Green
}
& .\venv\Scripts\python.exe -m pip install -q -r backend\requirements.txt
Write-Host "[ok] Python deps installed" -ForegroundColor Green

# 3. Node frontend
Write-Host "`n--- Frontend (Node) ---"
Set-Location frontend
npm install --silent
Write-Host "[ok] Node deps installed" -ForegroundColor Green
Set-Location ..

# 4. Check Ollama
Write-Host "`n--- Ollama ---"
$ollamaCheck = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaCheck) {
    Write-Host "[ok] Ollama found" -ForegroundColor Green
    Write-Host "     Pull a model if you haven't: ollama pull llama3.1:8b"
} else {
    Write-Host "[missing] Ollama not found — install with: winget install Ollama.Ollama" -ForegroundColor Yellow
}

# 5. Check Piper
Write-Host "`n--- Piper TTS ---"
$piperCheck = Get-Command piper -ErrorAction SilentlyContinue
if ($piperCheck) {
    Write-Host "[ok] piper found" -ForegroundColor Green
} else {
    Write-Host "[missing] piper not on PATH" -ForegroundColor Yellow
    Write-Host "     Download from: https://github.com/rhasspy/piper/releases"
    Write-Host "     Extract and add to PATH, then download a voice model"
}

Write-Host "`n=== Ready ===" -ForegroundColor Cyan
Write-Host "Start backend:  .\venv\Scripts\uvicorn.exe backend.main:app --reload"
Write-Host "Start frontend: cd frontend && npm run dev"
Write-Host "Open:           http://localhost:3000"
