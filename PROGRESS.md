# Calorix — Session Progress Log
> Last updated: 2026-07-22 | Author: Ashwin (@ashwin2k23)

---

## ✅ What Was Fixed This Session

### 1. Local Dev Environment — FULLY WORKING
- **Problem:** `npm install` had never been run on either `client/` or `server/`, causing all API calls to return 500 errors
- **Fix:** Ran `npm install` in both `d:\Calorix\client` and `d:\Calorix\server`
- **Status:** ✅ Done

### 2. Missing `.env` File — FIXED
- **Problem:** `client/.env` didn't exist → Clerk key was missing → authentication broken → "Launch Dashboard" button did nothing
- **Fix:** Created `d:\Calorix\client\.env` with:
  ```
  VITE_CLERK_PUBLISHABLE_KEY=pk_test_c3VtbWFyeS1zcGFycm93LTY2LmNsZXJrLmFjY291bnRzLmRldiQ
  VITE_API_URL=http://localhost:5000
  ```
- **Status:** ✅ Done (file exists locally, NOT committed to git)

### 3. `.gitignore` Updated — DONE
- **Problem:** `.env` was not in `.gitignore` — could have leaked the secret Clerk key to GitHub
- **Fix:** Added `.env`, `.env.*`, `!.env.example` rules to `client/.gitignore`
- **Status:** ✅ Committed & pushed

### 4. `.env.example` Created — DONE
- Created `client/.env.example` as a safe template for new contributors
- **Status:** ✅ Committed & pushed

### 5. README Updated — DONE
- Rewrote `README.md` with:
  - Accurate tech stack (Gemini AI, not OpenAI; TailwindCSS v4)
  - All 8 dashboard pages documented
  - Full API endpoint reference table
  - Vercel + Render deployment guide
  - `.env.example` setup instructions
- **Status:** ✅ Committed & pushed

---

## ⏳ What Is Still Pending (Production Site)

The **live site at https://calorix-taupe.vercel.app** is still broken. Fix requires:

### ❌ Fix 1 — Vercel Environment Variables (NOT YET DONE)
Go to: https://vercel.com/dashboard → Calorix project → **Settings → Environment Variables**

Add these:
| Variable | Value |
|----------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_c3VtbWFyeS1zcGFycm93LTY2LmNsZXJrLmFjY291bnRzLmRldiQ` |
| `VITE_API_URL` | `https://calorix-cpco.onrender.com` |

After saving → go to **Deployments → Redeploy** the latest deployment.

### ❌ Fix 2 — Render Backend Environment Variables (NOT YET DONE)
Go to: https://dashboard.render.com → Calorix backend service → **Environment**

Verify/add these:
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://calorix-taupe.vercel.app` |
| `DATABASE_URL` | *(your PostgreSQL connection string)* |
| `GEMINI_API_KEY` | *(your Google Gemini API key)* |

After adding → Render will auto-redeploy.

---

## 🖥️ Local Dev — How to Start

Every time you work locally, run these in **two separate terminals**:

**Terminal 1 — Backend:**
```bash
cd d:\Calorix\server
node index.js
# Should print: 🚀 Calorix Backend running on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd d:\Calorix\client
npm run dev
# Open http://localhost:5173
```

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `client/.env` | Local env vars (Clerk key + API URL) — **never commit** |
| `client/.env.example` | Safe template committed to git |
| `client/src/lib/api.js` | All API calls to the backend |
| `client/src/pages/Onboarding.jsx` | The "Launch Dashboard" button flow |
| `client/src/App.jsx` | Routes & Clerk auth guards |
| `server/index.js` | All Express routes + DB logic |
| `server/package.json` | Backend dependencies |

---

## 🔑 Credentials & Keys

| Service | Key / Detail |
|---------|-------------|
| **Clerk Publishable Key** | `pk_test_c3VtbWFyeS1zcGFycm93LTY2LmNsZXJrLmFjY291bnRzLmRldiQ` |
| **Clerk Dashboard** | https://dashboard.clerk.com |
| **GitHub Repo** | https://github.com/ashwin2k23/Calorix |
| **Live Frontend** | https://calorix-taupe.vercel.app |
| **Live Backend** | https://calorix-cpco.onrender.com |
| **Local Frontend** | http://localhost:5173 |
| **Local Backend** | http://localhost:5000 |

---

## 📋 Git Commits This Session

| Hash | Message |
|------|---------|
| `966dc5b` | fix: add .env to gitignore, add .env.example, install server deps |
| `3a78ff6` | docs: update README with full setup guide, API reference and project structure |

---

## 🔜 Suggested Next Steps

- [ ] Set Vercel env vars and redeploy (Fix 1 above)
- [ ] Set Render env vars and verify backend (Fix 2 above)
- [ ] Test full flow on live site: sign up → onboarding → Launch Dashboard
- [ ] Add a server `.env.example` file (similar to what was done for client)
