# FieldNote — Local-AI Nature Journal 🌿
> *“Less screen. More world.”*
> Built for the Hacktoberfest 2026 DEV Challenge: **“Touch Grass”**.

FieldNote is a local-first, distraction-free outdoor observation journal powered by open-weight AI running directly on your computer via Ollama. It is designed to help people spend more time observing living nature and less time staring at their phones.

---

## 1. Motivation: The “Touch Grass” Problem

Modern technology frequently optimizes for screen capture, constant notifications, and gamified digital metrics. Even outdoor apps often demand that users keep their cameras raised and their GPS active while hiking or walking through a park.

FieldNote flips this dynamic:
1. **Short, Focused Missions:** Generate a personalized 5, 10, or 20-minute tactile observation mission.
2. **Pocket Mode (Screen-Free):** Put your phone in your pocket. A distraction-free countdown timer quietly tracks your time outside while you observe trees, light, sounds, or insects.
3. **Authentic Naturalist Field Notes:** After you return, record your rough impressions. A local AI model (`qwen2.5:7b`) helps synthesize and structure your field journal entry while strictly preserving what you personally witnessed.
4. **Zero Cloud Leaks:** Your observations, reflections, and outdoor locations stay entirely on your machine.

---

## 2. Architecture & Data Flow

FieldNote is built as a self-contained local full-stack application:

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Client                        │
│   React 19 + Vite • Botanical Field-Book UI (No CDNs)       │
│   • LocalStorage Persistence (Notes, Stats, Preferences)     │
│   • Web Audio API Synthesizer (Zero-asset Gentle Bell)      │
│   • Markdown (.md) and JSON Backup Export / Import          │
└──────────────┬──────────────────────────────────────────────┘
               │
          Proxy: /api
               │
┌──────────────▼──────────────────────────────────────────────┐
│                    Local Node.js Backend                    │
│   Express 5 • Bound to 127.0.0.1:3001                       │
│   • GET  /api/health   -> Verifies Ollama + Model           │
│   • POST /api/mission  -> Input validation + Prompts        │
│   • POST /api/reflect  -> Strict observation preservation   │
└──────────────┬──────────────────────────────────────────────┘
               │
     HTTP POST /api/chat (stream: false)
               │
┌──────────────▼──────────────────────────────────────────────┐
│                    Local Ollama Daemon                      │
│   http://127.0.0.1:11434                                    │
│   Open-Weight Model: qwen2.5:7b                             │
│   100% On-Device Inference • Zero Remote Telemetry          │
└─────────────────────────────────────────────────────────────┘
```

### Naturalist Integrity Rules
- **No Hallucinations:** The AI is strictly instructed to preserve only what the user reported, never fabricating sightings or behaviors.
- **Unconfirmed Species:** Guessed flora or fauna are described as sightings rather than verified botanical claims.
- **Ethics & Safety:** Prompts explicitly forbid touching unknown berries/plants, eating wild fungi/flora, trespassing, or disturbing wildlife, and provide accessible indoor/window alternatives.

---

## 3. Prerequisites

1. **Node.js**: v20+ (developed and verified on Node v24.14.1)
2. **Ollama**: Installed and running locally ([ollama.com](https://ollama.com))
3. **Model**: `qwen2.5:7b` (recommended), or other open-weight models (`llama3.2:3b`, `mistral:7b`)
4. **OS**: Windows 11 / macOS / Linux

---

## 4. Setup & Running (Windows PowerShell)

### Step 1: Verify Ollama & Model
Ensure Ollama is running and the `qwen2.5:7b` model is downloaded:

```powershell
# Check running Ollama status and list models
curl http://127.0.0.1:11434/api/tags

# If qwen2.5:7b is not listed, pull it:
ollama run qwen2.5:7b
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Run Full-Stack Development Server
A single unified command launches both the Express backend (`127.0.0.1:3001`) and the Vite React frontend (`127.0.0.1:5173`):

```powershell
npm run dev
```

Open your browser to:
```
http://localhost:5173
```

---

## 5. Configuration Options

Copy `.env.example` to `.env` if you wish to customize port or model settings:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3001` | Express backend port |
| `HOST` | `127.0.0.1` | Localhost binding address |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Ollama daemon endpoint |
| `OLLAMA_MODEL` | `qwen2.5:7b` | Open-weight target model |
| `REQUEST_TIMEOUT_MS` | `120000` | Inference timeout (120 seconds) |

---

## 6. How Local Storage Works

All journal entries, outdoor observation statistics, and user preferences are persisted in your browser's `localStorage`:
- **`fieldnote_entries_v1`**: Array of nature journal entries with timestamps, duration, environment, location, raw notes, polished reflections, and tags.
- **`fieldnote_stats_v1`**: Total missions completed and minutes spent outside.
- **Exporting Single Notes**: Export any field note as a clean Markdown (`.md`) file.
- **Full Backup**: Download all field notes as formatted JSON (`.json`) or restore from a backup file.
- **Storage Safety**: All reads and writes are wrapped in try/catch handlers with corrupted data recovery and quota overflow protection.

---

## 7. Testing & Quality Verification

### Run Automated Backend Unit Tests
Runs the built-in Node.js test suite for JSON extraction, model matching, and API input validation:

```powershell
npm test
```

### Run ESLint
Runs ESLint with flat config and zero warnings across frontend and backend:

```powershell
npm run lint
```

### Production Build
Builds the production client bundle:

```powershell
npm run build
```

---

## 8. Why Local AI Matters

1. **Complete Data Sovereignty:** Your outdoor locations and private reflections are never sent to third-party cloud AI vendors (OpenAI, Anthropic, Google) or remote tracking servers.
2. **Open-Weight Ecosystem:** Qwen 2.5 is an open-weight model published by Alibaba Cloud, inspectable by anyone and runnable without credit cards, subscriptions, or API rate limits.
3. **Resilience:** The application functions fully on your local machine without continuous internet access once the model and dependencies are installed.

### Honest Limitations
- **Hardware Requirements:** Running `qwen2.5:7b` requires approximately 4.7 GB of available VRAM or system RAM. On CPU-only systems without hardware acceleration, generating a mission or organizing notes may take 20–50 seconds.
- **Setup Dependencies:** While model inference is 100% offline, first-time downloads (Ollama model pull, `npm install`) require an internet connection.
- **Botanical Accuracy:** AI cannot substitute for professional botanical or ecological identification. FieldNote never guarantees species classifications and strictly advises against consuming wild flora or fungi.
