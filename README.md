<div align="center">

# 🛡️ Sahayta — AI-Powered FIR Automation System

**A full-stack AI platform that automates FIR (First Information Report) filing, BNS section prediction, safe route analysis, and crime intelligence for law enforcement in India.**

[![Live Frontend](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue?logo=github)](https://myst-blazeio.github.io/Sahayta/)
[![Backend API](https://img.shields.io/badge/Backend-Render-green?logo=render)](https://final-year-project-xabd.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.x-black?logo=flask)](https://flask.palletsprojects.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Deployment](#live-deployment)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [ML Models](#ml-models)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**Sahayta** (Bengali: সহায়তা — _assistance_) is a Final Year Project that modernises FIR handling in Indian police stations through AI/ML automation.

Citizens can file FIRs online. The backend **automatically suggests relevant BNS (Bharatiya Nyaya Sanhita) sections** for each report using a BM25 semantic search engine powered by FIR keyword preprocessing and re-ranking. Police officers access a server-rendered dashboard to manage reports, view crime analytics, and use AI-powered safe route navigation.

Key achievements over a traditional paper-based system:

- ⚡ Instant BNS section suggestions — no manual legal lookup required
- 🗺️ Real-time safe route planning using live crime risk data (OSRM API + Leaflet)
- 📊 Ward-level crime prediction using a trained scikit-learn model
- 🔐 Dual-portal authentication (citizens & police) with JWT + role-based access

---

## Live Deployment

| Service                     | URL                                                  | Platform           |
| --------------------------- | ---------------------------------------------------- | ------------------ |
| **Citizen/Police Frontend** | https://myst-blazeio.github.io/Sahayta/              | GitHub Pages       |
| **Backend REST API**        | https://final-year-project-xabd.onrender.com         | Render (free tier) |
| **Police Server Portal**    | https://final-year-project-xabd.onrender.com/police/ | Render             |

> **Note:** The Render backend is on the free tier and may take 30–60s to wake from sleep on first request.

---

## Key Features

### 🧑‍💼 Citizen Portal (React SPA)

| Feature                          | Description                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| **Citizen Registration & Login** | JWT-authenticated sessions                                                                    |
| **FIR Filing**                   | Multi-step form with validation, auto-translate (Bengali/Hindi → English via Deep Translator) |
| **AI BNS Suggestions**           | Real-time BNS section predictions shown while filing                                          |
| **Dashboard**                    | Track live status of submitted FIRs                                                           |
| **PDF Export**                   | Download filed FIR as formatted PDF (jsPDF)                                                   |
| **Safe Route Advisor**           | Interactive Leaflet map showing safest paths based on ward crime scores                       |

### 👮 Police Portal (Server-rendered Flask + JS)

| Feature                 | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **Login**               | JWT cookie-based session, role-enforced access                                           |
| **FIR Inbox**           | View, search, filter all incoming FIRs                                                   |
| **FIR Management**      | Update status (Received → Under Investigation → Resolved), assign officers               |
| **Crime Analytics**     | Interactive charts — FIR trends by ward, time, and category                              |
| **Crime Prediction**    | AI prediction of expected crime count per ward/month using a trained Random Forest model |
| **Intelligence Search** | Natural language BNS section lookup                                                      |
| **Alert System**        | Ward-level crime spike alerts                                                            |

---

## Tech Stack

### Frontend

| Layer       | Technology                 |
| ----------- | -------------------------- |
| Framework   | React 18 + TypeScript      |
| Build Tool  | Vite 7                     |
| Routing     | React Router DOM v6        |
| HTTP Client | Axios                      |
| Maps        | Leaflet.js + React-Leaflet |
| Charts      | Recharts                   |
| Animations  | Framer Motion              |
| PDF         | jsPDF + jspdf-autotable    |
| Styling     | Tailwind CSS               |

### Backend

| Layer                 | Technology                                             |
| --------------------- | ------------------------------------------------------ |
| Framework             | Flask 3                                                |
| Auth                  | Flask-JWT-Extended                                     |
| Database              | MongoDB (Flask-PyMongo)                                |
| ML — BNS Search       | BM25Okapi (rank-bm25) + TF-IDF fallback (scikit-learn) |
| ML — Crime Prediction | scikit-learn Random Forest                             |
| Translation           | Deep Translator (Google Translate)                     |
| Maps/Routing          | OSRM public API + OSMnx                                |
| CORS                  | Flask-CORS                                             |
| Production Server     | Gunicorn                                               |

---

## Project Structure

```
Sahayta/
├── frontend/                      # React TypeScript SPA
│   ├── src/
│   │   ├── App.tsx                # Root router (public + protected routes)
│   │   ├── api/                   # Axios service layer
│   │   │   ├── authService.ts     # Login, register, logout
│   │   │   ├── firService.ts      # FIR CRUD & AI suggestions
│   │   │   └── policeService.ts   # Police dashboard API calls
│   │   ├── components/            # Shared UI components
│   │   │   ├── ProtectedRoute.tsx # JWT role-based route guard
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── auth/              # Login, CitizenSignup
│   │   │   ├── citizen/           # Dashboard, FileFIR, SafeRouteTab
│   │   │   └── police/            # Police-facing pages (redirects to server portal)
│   │   ├── context/               # React context (auth state)
│   │   └── types/                 # TypeScript interfaces
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                       # Flask REST API + server-rendered police portal
│   ├── app.py                     # App factory, blueprint registration, keep-alive
│   ├── config.py                  # Config class (Dev/Prod), env var paths
│   ├── db.py                      # PyMongo initialization
│   ├── ml_service.py              # ML singleton: BM25 BNS search + crime prediction
│   ├── requirements.txt
│   │
│   ├── routes/
│   │   ├── auth_routes.py         # /api/auth — login, register, me, logout
│   │   ├── fir_routes.py          # /api/fir  — file, list, update FIRs; BNS suggestions
│   │   ├── police_routes.py       # /api/police — dashboard stats, inbox, analytics, alerts
│   │   ├── intelligence_routes.py # /api/intelligence — BNS lookup, crime prediction
│   │   ├── safe_route_bp.py       # /api/safe-route — OSRM routing + crime risk scoring
│   │   └── police_views.py        # /police — server-rendered HTML portal (Jinja2)
│   │
│   ├── templates/                 # Jinja2 HTML templates for police portal
│   │   ├── base.html              # Base layout (navbar, profile modal, snackbar)
│   │   ├── index.html             # Police dashboard
│   │   ├── fir_inbox.html
│   │   ├── fir_archive.html
│   │   ├── analytics.html
│   │   ├── intelligence.html
│   │   └── alerts.html
│   │
│   ├── static/                    # Static assets for the police portal
│   │   ├── css/
│   │   └── js/
│   │       ├── police_dashboard.js
│   │       └── map.js
│   │
│   ├── assets/
│   │   └── models/
│   │       ├── bns/
│   │       │   ├── bns_assets.pkl     # Raw BNS DataFrame + SentenceTransformer embeddings
│   │       │   ├── bns_bm25.pkl       # BM25Okapi index (primary, ~1.2 MB)
│   │       │   └── bns_tfidf.pkl      # TF-IDF index (fallback, ~2.4 MB)
│   │       └── crime_prediction/
│   │           └── crime_model.pkl    # Trained sklearn crime prediction model
│   │
│   ├── scripts/
│   │   └── build_bns_index.py         # Rebuild bns_bm25.pkl + bns_tfidf.pkl from CSV
│   │
│   └── tests/
│       ├── test_ml_service.py         # Smoke tests for ML predictions
│       └── test_bns_dynamic.py        # Dynamic input length tests for BNS
│
└── scripts/                           # Root-level utility scripts
    ├── start_backend.bat              # Start Flask backend (Windows, one-click)
    ├── start_frontend.bat             # Start Vite dev server (Windows, one-click)
    ├── build_models.bat               # Rebuild ML indexes (Windows)
    ├── inspect_pkl.py                 # Universal .pkl file inspector
    └── crime_kolkata.csv              # Raw crime dataset used to train models
```

---

## Architecture

```
┌─────────────────────┐        HTTPS        ┌──────────────────────────────────────────┐
│   GitHub Pages      │◄────────────────────►│         Render (Flask + Gunicorn)        │
│   (React SPA)       │     Axios / REST     │                                          │
│                     │                      │  ┌─────────────┐  ┌────────────────────┐ │
│  Citizen Portal     │                      │  │  Auth API   │  │   Police Portal    │ │
│  • File FIR         │                      │  │  (JWT)      │  │   (Jinja2 HTML)    │ │
│  • Track FIRs       │                      │  └──────┬──────┘  └────────────────────┘ │
│  • Safe Routes      │                      │         │                                 │
│                     │                      │  ┌──────▼──────────────────────────────┐ │
└─────────────────────┘                      │  │         ml_service.py (Singleton)    │ │
                                             │  │  BM25 search + FIRPreprocessor      │ │
                                             │  │  Crime Prediction (Random Forest)   │ │
                                             │  └──────────────────────────────────────┘ │
                                             │                     │                     │
                                             │  ┌──────────────────▼──────────────────┐ │
                                             │  │        MongoDB Atlas                 │ │
                                             │  │  Collections: users, firs, alerts   │ │
                                             │  └─────────────────────────────────────┘ │
                                             └──────────────────────────────────────────┘
```

---

## API Reference

All endpoints require `Authorization: Bearer <JWT>` unless marked public.

### Auth (`/api/auth`)

| Method | Endpoint    | Auth   | Description              |
| ------ | ----------- | ------ | ------------------------ |
| POST   | `/login`    | Public | Login → returns JWT      |
| POST   | `/register` | Public | Citizen registration     |
| GET    | `/me`       | JWT    | Get current user profile |
| POST   | `/logout`   | JWT    | Invalidate session       |

### FIR (`/api/fir`)

| Method | Endpoint       | Auth        | Description                            |
| ------ | -------------- | ----------- | -------------------------------------- |
| POST   | `/file`        | Citizen JWT | File a new FIR (auto BNS suggestion)   |
| GET    | `/my-firs`     | Citizen JWT | List citizen's own FIRs                |
| GET    | `/status/<id>` | Citizen JWT | Get single FIR status                  |
| POST   | `/suggest-bns` | JWT         | Get BNS suggestions for arbitrary text |

### Police (`/api/police`)

| Method | Endpoint           | Auth       | Description             |
| ------ | ------------------ | ---------- | ----------------------- |
| GET    | `/inbox`           | Police JWT | All pending FIRs        |
| PATCH  | `/fir/<id>/status` | Police JWT | Update FIR status       |
| GET    | `/analytics`       | Police JWT | Crime analytics data    |
| GET    | `/alerts`          | Police JWT | Ward-level crime alerts |
| GET    | `/stats`           | Police JWT | Dashboard summary stats |

### Intelligence (`/api/intelligence`)

| Method | Endpoint         | Auth       | Description            |
| ------ | ---------------- | ---------- | ---------------------- |
| POST   | `/predict_bns`   | Police JWT | BNS section search     |
| POST   | `/predict_crime` | Police JWT | Crime count prediction |

### Safe Route (`/api/safe-route`)

| Method | Endpoint       | Auth   | Description                     |
| ------ | -------------- | ------ | ------------------------------- |
| POST   | `/route`       | Public | OSRM route + crime risk scoring |
| GET    | `/crime-zones` | Public | Crime risk zone GeoJSON         |

---

## ML Models

### BNS Section Prediction (`ml_service.predict_bns`)

A **three-layer pipeline** that operates entirely within 512 MB RAM (no torch / GPU):

```
Raw FIR Text
    │
    ▼
FIRPreprocessor
  • Strip dates, times, boilerplate phrases
  • Detect crime keywords from curated list of 80+ terms
  • Inject detected keywords (3×) at front of query for weight boosting
    │
    ▼
BM25Okapi Search
  • Tokenized corpus of 358 BNS sections
  • Returns top-k candidates by BM25 score
    │
    ▼
Keyword Re-Ranking
  • +25% bonus per keyword that appears in a candidate section's text
  • Re-sorts top candidates for maximum relevance
    │
    ▼
Top-k BNS Sections (with similarity scores)
```

**Fallback:** If `bns_bm25.pkl` is not found, falls back to TF-IDF cosine similarity (also with FIRPreprocessor query normalization).

### Crime Prediction (`ml_service.predict_crime`)

- **Model:** scikit-learn Random Forest Regressor
- **Input:** `ward` (int), `year` (int), `month` (int)
- **Output:** Predicted crime count for that ward/month combination
- **Training data:** `scripts/crime_kolkata.csv` — Kolkata ward crime dataset

---

## Getting Started (Local)

### Prerequisites

- **Python 3.10+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **MongoDB** — local or [MongoDB Atlas](https://mongodb.com/atlas) (free tier works)
- **Git**

### Option A — One-click (Windows)

```bat
# Start backend (creates venv, installs deps, builds ML indexes if needed)
scripts\start_backend.bat

# In a new terminal, start frontend
scripts\start_frontend.bat
```

### Option B — Manual

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv final_venv
final_venv\Scripts\activate      # Windows
# source final_venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Build ML indexes (required before first run)
python scripts/build_bns_index.py

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your MONGO_URI, JWT_SECRET_KEY, etc.

# Start the server
python app.py
```

Backend runs at: **http://localhost:5000**
Police portal: **http://localhost:5000/police**

#### Frontend

```bash
cd frontend

npm install

# Copy environment file
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:5000

npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Flask
SECRET_KEY=your_flask_secret_key
FLASK_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/fir_automation

# Auth
JWT_SECRET_KEY=your_jwt_secret

# Keep-alive (optional, for Render free tier)
KEEP_ALIVE_URL=https://your-app.onrender.com/health
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_BASE_URL=http://localhost:5000
```

In production (GitHub Pages), set `VITE_API_BASE_URL` to your Render backend URL.

---

## Deployment

### Backend → Render

1. Push to GitHub (`main` branch)
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Build Command:**
   ```bash
   pip install -r backend/requirements.txt && python backend/scripts/build_bns_index.py
   ```
4. Set **Start Command:**
   ```bash
   cd backend && gunicorn app:app
   ```
5. Add environment variables in the Render dashboard (see [Environment Variables](#environment-variables))

### Frontend → GitHub Pages

```bash
cd frontend
npm run deploy      # builds and pushes to gh-pages branch automatically
```

Configure `vite.config.ts` `base` path to match your GitHub Pages repo path.

---

## Default Test Credentials

> For local/demo testing only. Do NOT use in production.

| Role           | Email                        | Password   |
| -------------- | ---------------------------- | ---------- |
| Police Officer | `admin@police.com`           | `admin123` |
| Citizen        | Register via the signup form | —          |

---

## Dataset

`scripts/crime_kolkata.csv` — Ward-level monthly crime data for Kolkata used to:

- Train the crime prediction Random Forest model
- Generate crime risk scores for safe-route analysis

---

## License

This project is built as an academic Final Year Project. All rights reserved by the authors.

---

<div align="center">
  <sub>Built with ❤️ as a Final Year Project — Sahayta (Assistance)</sub>
</div>
