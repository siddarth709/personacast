# PersonaCast

Write like you — not like a generic AI voice.

Built for the **AI Builders Challenge with IBM Bob** (BeMyApp × IBM SkillsBuild),
July Challenge theme: *Reimagine Creative Industries with AI*.

## The problem

Every AI writing tool produces roughly the same flattened, generic voice
regardless of who's using it. For working writers, students, and creators,
that's not a helpful creative partner — it actively erodes the thing that
makes their writing worth reading: their voice. PersonaCast is a personalized
creative assistant built specifically to preserve and extend a person's own
voice, rather than replace it.

## What it does

**Core flow:**
1. **Bring your writing.** Paste samples or upload a `.txt`/`.md` file of
   your own past writing — a few hundred words is enough.
2. **See your voice fingerprint.** Granite analyzes tone, sentence rhythm,
   recurring phrases/habits, and recurring themes, rendered as a typographic
   "fingerprint" rather than a dry settings panel.
3. **Generate in your voice.** Request new writing on any topic; Granite
   generates it constrained to your actual voice profile, with adjustable
   target length and optional real facts/data you supply (so it never
   invents statistics, dates, or specs — only uses what you give it).

**Beyond the core flow:**

- **Multiple Voice Profiles** — save and switch between different voices
  (e.g. "Technical Blog," "Casual Newsletter") using browser-local storage.
- **Persona Blending** — blend 2-3 saved voices with weighted sliders
  (e.g. 70% Technical + 30% Conversational) into one generation.
- **Inline Re-Voicer** — highlight any sentence in a generated result and
  rewrite just that selection in your active voice, in place.
- **Style-RAG (lightweight)** — pulls the most relevant real sentences from
  your original writing sample into the generation prompt, so Granite learns
  from actual examples, not just abstract trait labels. Uses keyword-overlap
  retrieval rather than a full vector database — an intentional scope
  tradeoff for the build window, not a hidden shortcut. A disclosure panel
  shows exactly which of your real sentences were used.
- **Voice Drift Detector** — two-layer: instant, local (no API call)
  flagging of common generic-AI phrases as you type, plus an on-demand
  Granite-powered deep check comparing a draft against your saved voice
  profile.
- **Expanded Ingestion** — upload `.txt`/`.md` files directly, in addition
  to pasting text.

## IBM technology used

- **IBM Bob** — primary development tool used to scaffold and build this
  project.
- **IBM Granite** (via **watsonx.ai**) — powers every AI capability: voice
  extraction, voice-constrained generation, blending, re-voicing, and drift
  detection. See [`src/lib/graniteClient.js`](./src/lib/graniteClient.js)
  for all prompts and integration logic.

## Architecture

```
personacast/
├── src/
│   ├── App.jsx                 # orchestrates the full app flow
│   ├── components/
│   │   ├── SampleIntake.jsx     # paste/upload writing samples
│   │   ├── VoiceFingerprint.jsx # extracted voice profile display
│   │   ├── ProfileManager.jsx   # save/switch/delete voice profiles
│   │   ├── PersonaBlender.jsx   # weighted multi-voice blending
│   │   ├── GenerationPanel.jsx  # generate with length + facts controls
│   │   ├── InlineReVoicer.jsx   # highlight-to-rewrite in editor
│   │   └── DriftEditor.jsx      # generic-phrase + tone drift detection
│   ├── lib/
│   │   ├── graniteClient.js     # all Granite/watsonx.ai calls + prompts
│   │   ├── profileStore.js      # localStorage-backed profile persistence
│   │   ├── styleRag.js          # lightweight snippet retrieval
│   │   └── driftHeuristics.js   # local generic-AI phrase detection
│   └── styles/
├── server/
│   └── index.js                 # proxy — keeps the watsonx.ai API key
│                                # server-side only; handles IAM token
│                                # exchange
└── .env.example
```

The React app never holds an IBM Cloud API key. It calls a local proxy
server, which exchanges the key for a short-lived IAM token and forwards
requests to watsonx.ai.

## Running it locally

**1. Start the proxy server:**
```bash
cd server
cp .env.example .env   # fill in WATSONX_API_KEY and WATSONX_URL
npm install
npm start                # listens on :8787
```

**2. Start the React app** (separate terminal, from project root):
```bash
cp .env.example .env    # fill in VITE_WATSONX_PROJECT_ID
npm install
npm run dev
```

### Getting watsonx.ai credentials

1. Create a project at https://dataplatform.cloud.ibm.com (Dallas/`us-south`
   region recommended — Granite model availability is broadest there)
2. Generate an IBM Cloud API key: https://cloud.ibm.com/iam/apikeys
3. Copy your project's ID from Manage → General
4. Confirm Granite model access in your project's Resource Hub (e.g.
   `ibm/granite-4-h-small`)

## Design

The interface leans into a literary, typographic identity rather than a
generic SaaS dashboard — warm ink-and-parchment palette, a serif display
face (Fraunces) for headings, and IBM Plex Mono for utility text. The voice
fingerprint renders as a typographic display (strongest traits largest and
boldest) rather than a bullet list, since the tool is fundamentally about a
writer's distinct voice.

## Roadmap

Scoped out of the current build for time, but designed for:
- PDF and URL ingestion (currently supports paste + `.txt`/`.md` upload)
- Voice memo / audio ingestion via speech-to-text
- True embedding-based Style-RAG (currently keyword-overlap based)
- Cross-device profile sync (currently browser-local storage only)

## Status

Working prototype. Core flow (upload → voice profile → voice-constrained
generation) and all listed features are functional end-to-end against live
watsonx.ai Granite calls.

## Team

Built by Siddarth using IBM Bob.
