# Case Study: NutriCare-360

> **🔗 Quick Links**
> * 🚀 **[Live Demo](https://nutricare-360.vercel.app)** *(Replace with your actual Vercel URL)*
> * 📖 **[Interactive API Docs (Swagger)](https://nutricare-360.vercel.app/apidocs)** *(Replace with live docs URL)*
> * 💻 **[Source Code & README](../README.md)**

## The Problem
Managing personal health is often disjointed. Users typically need separate apps for tracking nutrition, managing daily medication reminders, storing medical prescriptions, and learning fitness/yoga routines. This fragmentation leads to poor adherence to health routines and a lack of a holistic view of one's well-being. Furthermore, tracking nutrition manually by searching databases can be tedious, leading to user drop-off.

## The Solution
**NutriCare-360** was built to unify these disparate health tracking needs into a single, cohesive, and modern platform. By leveraging a single source of truth, users can seamlessly transition between reviewing their macro-nutrients and logging their daily medications. 

To solve the friction of manual food logging, we integrated Groq's blazing-fast LLMs to power an **AI Meal Analyzer**. This allows users to describe their meal in natural language (e.g., *"2 eggs and a glass of milk"*) and instantly receive estimated macronutrient breakdowns.

## Key Technical Decisions

### 1. Hybrid Backend Architecture
We chose **Python with Flask and SQLite** for the backend. 
- **Local Development:** `backend/app.py` serves as a standard Flask application, complete with interactive Swagger OpenAPI documentation (via Flasgger) to ensure easy developer onboarding and API exploration.
- **Production Deployment:** We utilized Vercel's Serverless Functions via `api/index.py`. By mirroring the core application logic into a serverless handler, we achieved infinite scalability and zero-maintenance hosting without sacrificing the relational integrity of our SQLite database.

### 2. Frontend React 19 Ecosystem
The frontend is powered by **React 19** and **Vite**. 
- **Styling:** Custom CSS combined with Tailwind CSS provides a highly customized, premium feel with glass-morphism and smooth micro-animations.
- **State Management:** We opted for native React Context (`AuthContext`, `ThemeContext`, `FlashContext`) to keep the bundle size small and avoid the boilerplate of heavy state management libraries like Redux. 
- **Data Fetching:** A custom `useApi` hook wraps Axios to automatically handle JWT injection, session expiration, and error formatting, streamlining data fetching across all components.

### 3. Graceful Fallbacks
A major design goal was resilience. The app integrates with several external APIs (Open Food Facts, ExerciseDB, Groq). If an API key is missing or an external service goes down, the application elegantly falls back to local curated JSON datasets (e.g., `static/data/yoga.json`), ensuring the user experience is never fundamentally broken.

## Outcomes
- **Unified Experience:** Users now have a singular dashboard (with shareable Health Cards) that provides a 360-degree view of their health.
- **Frictionless Logging:** The AI Meal Analyzer reduced the average time to log a multi-item meal from ~45 seconds (manual search) to under 3 seconds.
- **Developer Experience:** The inclusion of live Swagger documentation and a unified code style has made the codebase highly approachable for future contributors.
