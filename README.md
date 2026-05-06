# 🔥 Calorix — AI-Powered Indian Nutrition Assistant

A production-ready, full-stack AI nutrition platform tailored for Indian users. Built with React, Node.js, Clerk Authentication, PostgreSQL, and OpenAI.

<div align="center">

### 🌐 [Live Demo → https://calorix-taupe.vercel.app](https://calorix-taupe.vercel.app)

![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)

</div>

---

## ✨ Features

- 🔐 **Clerk Authentication** — Secure sign up, sign in, session management
- 🧭 **Smart Onboarding** — Multi-step profile setup with BMR/TDEE auto-calculation
- 📊 **Dynamic Dashboard** — Real-time calorie, macro, and hydration tracking
- 🍛 **Indian Food Database** — Log meals with beautiful food photos from an extensive Indian cuisine library
- 🤖 **AI Diet Planner** — Personalized meal plans powered by OpenAI
- 🎯 **Goal Setting** — Update your fitness goals anytime with instant recalculation
- 👤 **User Profile** — Persistent profile synced to PostgreSQL database
- 📈 **Macro Charts** — Recharts-powered donut charts for protein, carbs, and fats
- 💡 **AI Insights** — Dynamic tips based on your logged meals and goals

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| React + Vite | Frontend Framework |
| TailwindCSS | Styling |
| shadcn/ui + Framer Motion | UI Components & Animations |
| Clerk | Authentication |
| Node.js + Express | Backend API |
| PostgreSQL (Render) | Cloud Database |
| OpenAI API | AI Diet Planning |
| Recharts | Data Visualization |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A [Clerk](https://clerk.com) account
- A [PostgreSQL](https://render.com) database (or local)

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
DATABASE_URL=postgresql://your-db-url
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=sk-your-key  # optional
```

Run the server:
```bash
node index.js
```

### 3. Setup the Frontend
```bash
cd client
npm install
```

Create a `.env` file in `client/`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
VITE_API_URL=http://localhost:5000
```

Run the frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
Calorix/
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx         # Landing page
│   │   │   ├── Onboarding.jsx      # Multi-step onboarding
│   │   │   ├── Dashboard.jsx       # Main dashboard layout
│   │   │   └── dashboard/
│   │   │       ├── Overview.jsx    # Stats & insights
│   │   │       ├── Meals.jsx       # Food logging
│   │   │       ├── Goals.jsx       # Goal management
│   │   │       ├── AIPlanner.jsx   # AI diet planner
│   │   │       └── Profile.jsx     # User profile
│   │   └── App.jsx
├── server/                  # Node.js + Express Backend
│   ├── index.js             # API routes + PostgreSQL
│   └── package.json
└── README.md
```

---

## 🌐 Live Demo

👉 **[https://calorix-taupe.vercel.app](https://calorix-taupe.vercel.app)**

---

## 👤 Author

**Ashwin** — [@ashwin2k23](https://github.com/ashwin2k23)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
