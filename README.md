# NutriCare-360

> A full-stack personal health management platform — medications, nutrition, yoga, and prescriptions in one place.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask)](https://flask.palletsprojects.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

> **🔗 Quick Links**
> * 🚀 **[Live Demo](https://nutri-care-360.vercel.app/)**
> * 📖 **[Case Study](docs/CASE_STUDY.md)**
> * 📚 **[API Documentation](docs/API.md)**

---

## What it does

| Feature | Details |
|---|---|
| **Medicine Reminders** | CRUD reminders with daily mark-as-taken and adherence tracking |
| **Prescription Vault** | Upload and manage image/PDF prescriptions securely |
| **Nutrition Tracker** | Search via Open Food Facts, log meals, calorie goal progress bar |
| **AI Meal Analyzer** | Describe a meal in plain English → get macro breakdown (Groq/LLaMA3) |
| **Yoga & Fitness** | Curated pose library with category filters (ExerciseDB fallback to local JSON) |
| **Health Card** | One-click canvas-rendered PNG summary card to share |

---

## Tech Stack

```
frontend/   React 19 · Vite · Tailwind CSS · React Router v7 · Axios
backend/    Python · Flask · SQLite · Flask-JWT-Extended · Werkzeug
api/        Vercel serverless entry-point (mirrors backend/)
```

---

## Quick Start

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in JWT_SECRET_KEY (+ optional API keys)
pip install -r requirements.txt
python app.py               # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

---

## Project Structure

```
NutriCare-360/
├── backend/            Flask API + SQLite database
│   ├── app.py          All route handlers
│   ├── static/data/    nutrition.json · yoga.json (fallbacks)
│   └── .env.example    Environment variable template
├── frontend/           React SPA
│   └── src/
│       ├── pages/      One file per route
│       ├── components/ layout/ · ui/
│       ├── context/    Auth · Theme · Flash
│       ├── hooks/      useApi.js
│       └── styles/     index.css (single stylesheet)
├── api/                Vercel serverless mirror of backend/
├── docs/               API reference · Schema · Architecture · Case Study
└── vercel.json         Deployment rewrite rules
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET_KEY` | ✅ | Long random string for token signing |
| `RAPIDAPI_KEY` | Optional | ExerciseDB (yoga poses); falls back to local JSON |
| `GROQ_API_KEY` | Optional | Groq AI meal analyzer; feature disabled without it |

---

## Docs

| Document | Description |
|---|---|
| [API Reference](docs/API.md) | All endpoints, request/response shapes |
| [Database Schema](docs/SCHEMA.md) | Tables, columns, relationships |
| [System Architecture](docs/ARCHITECTURE.md) | Component diagram and data flow |
| [Case Study](docs/CASE_STUDY.md) | Problem, solution, decisions, outcomes |

---

## Deployment

The app is configured for **Vercel** (frontend + serverless Python backend):

```bash
vercel deploy
```

`vercel.json` routes `/api/*` → `api/index.py` and everything else → `index.html`.

---

*Built by [Sairaj Jadhav](https://github.com/SairajJadhav08)*
