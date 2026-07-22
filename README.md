# 🔥 Calorix — AI-Powered Indian Nutrition Tracker

A production-ready, full-stack nutrition platform built for Indian users. Track calories, macros, hydration, and workouts with natural language meal logging powered by Google Gemini AI.

<div align="center">

### 🌐 [Live Demo → https://calorix-taupe.vercel.app](https://calorix-taupe.vercel.app)

![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=google)

</div>

---

## ✨ Features

- 🔐 **Clerk Authentication** — Secure sign up, sign in, and session management
- 🧭 **Smart Onboarding** — 6-step profile setup with automatic BMR/TDEE & macro calculation
- 📊 **Dynamic Dashboard** — Real-time calorie, macro, and hydration tracking with charts
- 🍛 **NLP Meal Logging** — Type what you ate naturally (e.g. *"2 masala dosas with sambar"*) and Gemini extracts macros instantly
- 🔍 **Food Search** — Searchable Indian food database with 500+ items and emoji previews
- 💧 **Hydration Tracker** — Log and monitor daily water intake against your personal target
- 🏋️ **Fitness / Workout Logger** — Log workouts with calories burned, duration, and intensity
- 🤖 **AI Diet Planner** — Get a personalized weekly meal plan tailored to your goals
- 💬 **AI Nutrition Assistant** — Chat with a Gemini-powered assistant about your diet
- 📈 **Analytics** — Weekly calorie trends, macro breakdowns, and progress visualizations
- 🎯 **Goal Management** — Update fitness goals anytime with instant recalculation
- 👤 **User Profile** — Persistent profile with editable biometrics synced to the database

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8 |
| **Styling** | TailwindCSS v4 + Framer Motion |
| **Authentication** | Clerk |
| **Routing** | React Router v7 (Hash Router) |
| **Charts** | Recharts |
| **Notifications** | Sonner |
| **Backend** | Node.js + Express 5 |
| **Database** | PostgreSQL (production) / SQLite (local fallback) |
| **AI** | Google Gemini (`@google/generative-ai`) |
| **Security** | Helmet, express-rate-limit, xss, validator |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A [Clerk](https://clerk.com) account (free)
- *(Optional)* A PostgreSQL database — SQLite is used automatically if no `DATABASE_URL` is set

### 1. Clone the repository
```bash
git clone https://github.com/ashwin2k23/Calorix.git
cd Calorix
```

### 2. Setup the Backend
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=5000
NODE_ENV=development

# Optional — falls back to SQLite if not set
DATABASE_URL=postgresql://your-db-url

# Optional — enables AI features
GEMINI_API_KEY=your-gemini-api-key

# Optional — for production CORS
FRONTEND_URL=https://your-frontend-url.vercel.app
```

Start the server:
```bash
node index.js
```

> ✅ If no `DATABASE_URL` is provided, the server automatically creates a local `calorix.db` SQLite file — no extra setup needed.

---

### 3. Setup the Frontend
```bash
cd client
npm install
```

Create a `.env` file in `client/` (copy from `.env.example`):
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
VITE_API_URL=http://localhost:5000
```

> Get your Clerk key at [dashboard.clerk.com](https://dashboard.clerk.com) → Your App → **API Keys**

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 📁 Project Structure

```
Calorix/
├── client/                        # React + Vite Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Public landing page
│   │   │   ├── Onboarding.jsx     # 6-step onboarding flow
│   │   │   ├── Dashboard.jsx      # Dashboard shell & navigation
│   │   │   └── dashboard/
│   │   │       ├── Overview.jsx   # Daily stats, ring charts & AI insights
│   │   │       ├── Meals.jsx      # NLP meal logging & food search
│   │   │       ├── Fitness.jsx    # Workout logger & calorie burn tracker
│   │   │       ├── Analytics.jsx  # Weekly trends & macro charts
│   │   │       ├── AIPlanner.jsx  # Gemini-powered weekly meal plan
│   │   │       ├── Assistant.jsx  # AI nutrition chat assistant
│   │   │       ├── Goals.jsx      # Fitness goal management
│   │   │       └── Profile.jsx    # User profile & biometrics editor
│   │   ├── components/            # Shared UI components
│   │   ├── lib/
│   │   │   ├── api.js             # API client (fetch wrapper)
│   │   │   └── foodDatabase.js    # Local Indian food data
│   │   ├── App.jsx                # Routes & Clerk auth guards
│   │   └── main.jsx               # App entry point
│   ├── .env.example               # Environment variable template
│   └── package.json
│
├── server/                        # Node.js + Express Backend
│   ├── index.js                   # All API routes, DB logic, AI endpoints
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server & DB health check |
| `POST` | `/api/users` | Create or update user profile |
| `GET` | `/api/users/:id` | Get user profile |
| `POST` | `/api/meals` | Log a meal |
| `GET` | `/api/meals/:user_id` | Get all meals for a user |
| `DELETE` | `/api/meals/:id` | Delete a meal |
| `GET` | `/api/water/:user_id` | Get daily water log |
| `PUT` | `/api/water` | Update daily water intake |
| `POST` | `/api/workouts` | Log a workout |
| `GET` | `/api/workouts/:user_id` | Get all workouts |
| `DELETE` | `/api/workouts/:id` | Delete a workout |
| `GET` | `/api/food-search?q=` | Search the food database |
| `POST` | `/api/ai-diet` | Generate AI meal plan |
| `POST` | `/api/ai-insight` | Get AI nutrition insights |
| `POST` | `/api/ai-chat` | Chat with AI assistant |

---

## 🌐 Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set **Root Directory** to `client`
3. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_URL` → your Render backend URL

### Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com)
2. Set **Root Directory** to `server`, **Start Command** to `node index.js`
3. Add environment variables:
   - `DATABASE_URL` → your PostgreSQL connection string
   - `GEMINI_API_KEY`
   - `FRONTEND_URL` → your Vercel frontend URL
   - `NODE_ENV=production`

---

## 👤 Author

**Ashwin** — [@ashwin2k23](https://github.com/ashwin2k23)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
