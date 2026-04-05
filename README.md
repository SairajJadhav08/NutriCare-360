# NutriCare-360 🌿

![Live Demo](https://img.shields.io/badge/Live_Demo-nutri--care--360--396f.vercel.app-success?style=for-the-badge&logo=vercel)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) 
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)

Welcome to **NutriCare-360**, a full-stack health and wellness application designed to help you track and improve your well-being! Whether it's managing your daily nutrition, keeping up with your yoga routine, or organizing reminders for your medication, NutriCare-360 has you covered.

### 🔗 **Live URL:** [https://nutri-care-360-396f.vercel.app/](https://nutri-care-360-396f.vercel.app/)

## ✨ Key Features

- **Dashboard:** At-a-glance view of your health metrics, active prescriptions, and daily reminders.
- **Yoga & Wellness:** Access curated yoga poses based on body parts or goals. (Powered by ExerciseDB RapidAPI & fallback local JSON).
- **Nutrition Tracking:** Search for foods dynamically and log calories, proteins, and macro history. (Powered by OpenFoodFacts).
- **Medication Reminders:** Never forget a dose with a fully organized medication reminder list.
- **Prescription Storage:** Upload and securely save images or PDFs of your medical prescriptions for quick access.
- **Secure Profiles:** Safe JWT-based authentication system storing everything in a localized SQLite cloud instance.

## 🛠️ Technology Stack

- **Frontend Interface:** Built with React, Vite, and customized vanilla CSS for maximum design control. Uses React Router for seamless single-page navigation.
- **Backend API:** Built securely on Python using Flask. Exposes an API covering Auth, file uploads, external requests, and protected routes using `Flask-JWT-Extended`.
- **Database:** SQLite (Containerized for Vercel Serverless deployments).

---

## 💻 Local Development

Want to run the project locally? It's simple!

### 1. Start the Backend server
Open a terminal and navigate to the backend directory (or `api/` directory if you used the Vercel restructuring):
```bash
# Navigate to the backend directory
cd api 

# Install dependencies (use a virtual environment if you prefer)
pip install -r requirements.txt

# Start the Flask server
python index.py
```
*(The backend runs on `http://localhost:5000`)*

### 2. Start the Frontend server
Open a second terminal and navigate to the root directory where the Vite configuration is:
```bash
# Install the Node dependencies
npm install

# Start the Vite development server
npm run dev
```

*(Your frontend will be live on `http://localhost:5173`!)*
