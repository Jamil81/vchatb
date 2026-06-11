# Training Piper on Your Own Voice

## Two Approaches

| Approach | Audio Needed | Training Time | Quality |
|---|---|---|---|
| **Fine-tune** (recommended) | 15–30 min | 2–4 hours | Good — sounds like you |
| **Train from scratch** | 2–5 hours | 12–24 hours | Best — fully custom |

Fine-tuning starts from an existing Piper voice model and adapts it to your voice. Much faster, good results. Start here.

Training from scratch gives a purer result but needs far more data and time. Do this later if fine-tuning isn't good enough.

---

## What You Need

- WSL2 (Windows Subsystem for Linux) — training does not work natively on Windows
- Your RTX 3050 with CUDA 12.6 (already confirmed)
- Python 3.10+ inside WSL2
- A quiet room and a decent microphone
- A text corpus to read from (sentences that cover all phonemes)

---

## Step 1 — Enable WSL2

Open PowerShell as Administrator:

```powershell
wsl --install
wsl --set-default-version 2
```

Restart your PC. Then install Ubuntu from the Microsoft Store. Launch it and finish the Linux user setup.

Verify CUDA works inside WSL2:

```bash
nvidia-smi
```

If it shows your RTX 3050, you're good. If not, install the WSL2 CUDA toolkit:

```bash
# Inside Ubuntu (WSL2)
wget https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get install -y cuda-toolkit-12-6
```

---

## Step 2 — Record Your Voice

You need clean, consistent recordings. No background noise, same mic position every session.

### Get a Recording Script

Piper's recommended corpus covers all English phonemes. Use this one:

```
github.com/rhasspy/piper/blob/master/TRAINING.md
```

It links to LJ Speech-style sentence lists. Download one and read every sentence aloud.

### Recording Rules

- Quiet room. Close windows. Turn off fans.
- Same distance from mic every time (20–30 cm).
- Normal speaking pace — not slow, not rushed.
- No filler sounds (um, uh). Re-record the sentence if you make a mistake.
- WAV format, 22050 Hz sample rate, mono, 16-bit.

### Recording Setup (Windows — Audacity)

1. Download Audacity (free)
2. Set sample rate to 22050 Hz
3. Set channels to Mono
4. Record each sentence as a separate file named `0001.wav`, `0002.wav`, etc.
5. Export as WAV (not MP3)

For fine-tuning: record 200–400 sentences (~20 minutes).
For from-scratch: record 2000+ sentences (~3–5 hours).

---

## Step 3 — Prepare Dataset

Create this folder structure:

```
dataset/
  wavs/
    0001.wav
    0002.wav
    ...
  metadata.csv
```

The `metadata.csv` format (LJ Speech style):

```
0001|The quick brown fox jumps over the lazy dog
0002|She sells seashells by the seashore
0003|How much wood would a woodchuck chuck
```

No header row. Pipe-separated. Filename without extension | transcript.

### Normalize Audio

Inside WSL2, install sox:

```bash
sudo apt-get install -y sox
```

Normalize all wavs to consistent volume:

```bash
for f in dataset/wavs/*.wav; do
  sox "$f" -r 22050 -c 1 -b 16 "${f%.wav}_norm.wav" norm
done
```

Replace the originals with the normalized versions.

---

## Step 4 — Set Up Piper Training Environment (WSL2)

```bash
# Clone piper-train
git clone https://github.com/rhasspy/piper-train.git
cd piper-train

# Create Python env
python3 -m venv .venv
source .venv/bin/activate

# Install deps
pip install -e .
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

---

## Step 5 — Preprocess Dataset

```bash
# Inside piper-train/, with venv active
python3 -m piper_train.preprocess \
  --language en \
  --input-dir /path/to/dataset \
  --output-dir /path/to/training-output \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 22050
```

This creates phoneme files, speaker embeddings, and a config JSON.

---

## Step 6A — Fine-Tune from Existing Voice (Recommended)

Download a base model to fine-tune from. Use `en_US-ryan-medium` or `en_US-lessac-medium` — they're the cleanest base voices.

```bash
# Download checkpoint (not the ONNX — the .ckpt file)
# These are on HuggingFace under rhasspy/piper-voices, look for .ckpt files
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en_US/en_US-ryan-medium/en_US-ryan-medium.ckpt
```

Then train starting from that checkpoint:

```bash
python3 -m piper_train \
  --dataset-dir /path/to/training-output \
  --accelerator gpu \
  --devices 1 \
  --batch-size 32 \
  --validation-split 0.05 \
  --num-test-examples 5 \
  --max_epochs 6000 \
  --resume_from_checkpoint /path/to/en_US-ryan-medium.ckpt \
  --checkpoint-epochs 1 \
  --lightning_log_dir /path/to/logs
```

With your RTX 3050 (8GB VRAM), use `--batch-size 16` if it runs out of memory.

Fine-tuning runs for a few hours. Check the output every 1000 epochs — it saves checkpoints you can test.

---

## Step 6B — Train from Scratch

Skip the `--resume_from_checkpoint` flag:

```bash
python3 -m piper_train \
  --dataset-dir /path/to/training-output \
  --accelerator gpu \
  --devices 1 \
  --batch-size 16 \
  --validation-split 0.05 \
  --num-test-examples 5 \
  --max_epochs 20000 \
  --checkpoint-epochs 1 \
  --lightning_log_dir /path/to/logs
```

This takes 12–24 hours on an RTX 3050. Let it run overnight.

---

## Step 7 — Export to ONNX

Once training finishes (or at a checkpoint you like), export to ONNX format for use with Piper:

```bash
python3 -m piper_train.export_onnx \
  /path/to/checkpoint.ckpt \
  /path/to/output/my-voice.onnx
```

Copy both the `.onnx` and the generated `.onnx.json` config into:

```
backend/piper/voices/my-voice.onnx
backend/piper/voices/my-voice.onnx.json
```

Update `.env`:

```
PIPER_VOICE_EN=./piper/voices/my-voice.onnx
```

---

## Step 8 — Test It

From Windows (not WSL2), run Piper directly:

```powershell
cd J:\laragon\www\bots\vchatb\backend\piper
echo "Hello, I am Jamlo." | .\piper.exe --model voices\my-voice.onnx --output-file test.wav
```

Play `test.wav` and hear yourself.

---

## Tips for Better Results

- **More data = better quality.** 30 minutes is the minimum; 1 hour is noticeably better.
- **Consistent recording conditions matter more than mic quality.** Same room, same distance, every session.
- **Read naturally.** Don't try to sound like a professional narrator — the model learns your real voice.
- **Check checkpoints early.** Export at epoch 2000 and listen. If it already sounds like you, stop. More epochs = more quality but diminishing returns after 5000–6000.
- **RTX 3050 limit.** 8GB VRAM is enough but tight. If training crashes with OOM, drop batch size to 8.

---

## Timeline Estimate (Your Setup)

| Phase | Time |
|---|---|
| WSL2 + CUDA setup | 30–60 min |
| Recording 300 sentences | 2–3 hours |
| Preprocessing | 10 min |
| Fine-tuning (6000 epochs) | 3–5 hours |
| Export + test | 15 min |
| **Total** | **~1 day** |

---

## Related

- [Piper Training Repo](https://github.com/rhasspy/piper-train)
- [Piper Voice Models (HuggingFace)](https://huggingface.co/rhasspy/piper-voices)
- [LJ Speech Dataset format](https://keithito.com/LJ-Speech-Dataset/)
- [local-setup.md](local-setup.md) — backend setup
- [stack.md](stack.md) — full project stack
