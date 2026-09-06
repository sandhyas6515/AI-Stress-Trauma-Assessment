# NHAA Trauma-Aware Complaint System

**Smart India Hackathon 2026 — Problem Statement 26093**
*AI-Based Real-Time Stress and Trauma Assessment Module for Victims/Complainants Accessing NHAA*

> A voice-first complaint filing system that lets a victim speak their complaint in Hindi, English, or a regional language, auto-structures it, detects real-time distress from **both their words and their voice**, and routes critical cases to officials instantly — instead of sitting in a routine queue.

---

## The Problem

Victims approaching the National Helpline/Application for Atrocities (NHAA) are often in acute distress. Typing out a formal complaint is slow, re-traumatizing, and inaccessible for non-literate or non-English-speaking users. Officials, meanwhile, have no fast way to tell which of hundreds of complaints needs urgent action *right now*.

## What We Built

| For the Victim | For the Official |
|---|---|
| 🎙️ Speak the complaint naturally — no typing, no forms | 📊 Risk-sorted dashboard — most urgent cases always on top |
| 📝 Live transcript + auto-generated structured summary | 🔍 Expandable case view with full transcript & audio |
| 🚨 Real-time risk detection from voice tone **and** words | 🧠 See *why* a case was flagged (voice-stress + text sentiment breakdown) |
| 🎫 Instant ticket ID + downloadable PDF report | 📁 Assign, update status, add notes, escalate |
| 📍 Track complaint status anytime | 📈 Analytics: cases by risk, region, resolution time |
| 💊 AI-recommended support (medical/legal/police/emergency) | 🔔 Instant alerts on critical-risk submissions |

---

## Why This Approach

Most complaint systems only read *what* was said. We also analyze *how* it was said — tone, pitch, pace, and pauses in the victim's voice — and fuse that with text sentiment to catch distress that words alone might miss or downplay. A human officer always makes the final call; the AI's job is to make sure no critical case gets buried.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (Victim App) | React + PWA |
| Speech-to-Text | OpenAI Whisper |
| NLP (Entity Extraction + Summarization) | LLM API (prompt-based) |
| Voice Emotion/Stress Detection | Pretrained speech-emotion-recognition model |
| Risk Classification | LLM text sentiment fused with voice-stress signal |
| Backend/API | Node.js + Express |
| Database | Firebase Firestore |
| Official Dashboard | React + Recharts |
| Notifications | Firebase Cloud Messaging |
| Report Generation | jsPDF |

---

## System Architecture

```
[Victim Mobile/Web App]
   |  (audio stream + raw audio retained)
   v
[ASR Service (Whisper)] --> [LLM Pipeline: NER + Summarizer]
   |                                   |
   v                                   |
[Voice Emotion/Stress Model]           |
   |                                   |
   -------> [Fused Risk Scoring Service] <----
                        |
                        v
                 [Case Database]
                        |
                        v
        [Official Dashboard] <---> [Notification Service]
                        |
                        v
              [Victim Track-Complaint API]
```

---

## Project Structure

```
nhaa-complaint-system/
├── client/                  # Victim-facing React PWA
│   ├── src/
│   │   ├── components/      # Mic button, transcript view, review screen, tracker
│   │   ├── pages/           # Home, Review, Confirmation, Track Complaint
│   │   └── App.jsx
│   └── package.json
├── dashboard/                # Official dashboard (React + Recharts)
│   ├── src/
│   │   ├── components/       # Queue table, case detail panel, analytics charts
│   │   └── App.jsx
│   └── package.json
├── server/                   # Node.js + Express backend
│   ├── routes/                # complaint.js, dashboard.js, notifications.js
│   ├── services/
│   │   ├── asrService.js       # Whisper integration
│   │   ├── nlpService.js       # LLM-based NER + summarization
│   │   ├── voiceStressService.js  # Speech-emotion model
│   │   └── riskScoringService.js  # Fuses text + voice signals
│   ├── models/                # Firestore schema/helpers
│   └── index.js
├── docs/
│   └── PRD_PS26093_Trauma_Aware_Complaint_System.md
└── README.md
```

*(Structure is a suggested starting layout — adjust to match your actual repo as you build.)*

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase project (Firestore + Cloud Messaging enabled)
- OpenAI API key (Whisper + LLM access)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd nhaa-complaint-system

# Install dependencies
cd server && npm install
cd ../client && npm install
cd ../dashboard && npm install
```

### Environment Variables

Create a `.env` file in `server/`:

```
OPENAI_API_KEY=your_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
PORT=5000
```

### Run Locally

```bash
# Start backend
cd server && npm run dev

# Start victim-facing app
cd client && npm start

# Start official dashboard
cd dashboard && npm start
```

---

## Demo Flow

1. Open the victim app → tap the mic → speak a complaint (try it in Hindi or English)
2. Watch the live transcript and auto-generated summary appear
3. Review and submit → get a **Ticket ID** and download the PDF report
4. Go to **Track Complaint** and check status
5. Open the **Official Dashboard** in another tab → see the same case appear, sorted by risk level, with an expandable view showing the full transcript and why it was flagged

---

## Current Scope vs. Future Work

**Built for this hackathon:**
- Voice complaint capture, transcription, and structured summarization
- Combined voice-tone + text-sentiment risk detection (Low/Moderate/High/Critical)
- Victim ticketing, tracking, and PDF reports
- Official risk-sorted dashboard with full case drill-down

**Planned next:**
- BNS (Bharatiya Nyaya Sanhita) section auto-suggestion for officer reference
- Full 22 scheduled-language ASR support (via Bhashini or similar)
- Real e-FIR / police system integration
- Multi-modal evidence upload (photos, documents)
- End-to-end encryption and formal compliance audit

---

