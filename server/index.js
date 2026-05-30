import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let dbMode = 'sqlite';
let sqliteDb;
let pool;

// Hybrid database wrapper
const db = {
  query: async (text, params = []) => {
    const safeParams = params.map(p => p === undefined ? null : p);
    if (dbMode === 'postgres') {
      return await pool.query(text, safeParams);
    } else {
      let sqliteText = text;
      // Convert Postgres-style $1, $2, $3 to SQLite-style ?
      sqliteText = sqliteText.replace(/\$\d+/g, '?');

      const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');

      if (isSelect) {
        const rows = await sqliteDb.all(sqliteText, safeParams);
        return { rows };
      } else {
        const result = await sqliteDb.run(sqliteText, safeParams);
        let rows = [];
        if (sqliteText.toUpperCase().includes('RETURNING')) {
          rows = [{ id: result.lastID }];
        }
        return { rows, lastID: result.lastID, changes: result.changes };
      }
    }
  }
};

// Database Initialization
(async () => {
  if (process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      // Test connection
      await pool.query('SELECT NOW()');
      dbMode = 'postgres';
      console.log('✅ Connected to PostgreSQL database!');
    } catch (err) {
      console.log('⚠️ PostgreSQL connection failed, falling back to SQLite:', err.message);
    }
  } else {
    console.log('ℹ️ No DATABASE_URL found. Initializing SQLite...');
  }

  if (dbMode === 'sqlite') {
    try {
      sqliteDb = await open({
        filename: path.join(process.cwd(), 'calorix.db'),
        driver: sqlite3.Database
      });
      console.log('✅ Connected to SQLite database: calorix.db');
    } catch (err) {
      console.error('❌ Failed to open SQLite database:', err.message);
    }
  }

  // Initialize schemas
  try {
    if (dbMode === 'postgres') {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          clerk_user_id TEXT PRIMARY KEY,
          name TEXT, email TEXT, age INTEGER, gender TEXT,
          height REAL, weight REAL, activity_level TEXT, goal_type TEXT,
          diet_preference TEXT, calorie_target INTEGER, protein_target INTEGER,
          carbs_target INTEGER, fats_target INTEGER, hydration_target INTEGER,
          onboarding_completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS meals (
          id SERIAL PRIMARY KEY, user_id TEXT,
          food_name TEXT, calories INTEGER, protein REAL,
          carbs REAL, fats REAL, meal_type TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY(user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS water_logs (
          id SERIAL PRIMARY KEY,
          user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          amount_ml INTEGER DEFAULT 0,
          UNIQUE(user_id, date)
        )
      `);
      console.log('✅ PostgreSQL schemas verified.');
    } else if (sqliteDb) {
      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
          clerk_user_id TEXT PRIMARY KEY,
          name TEXT, email TEXT, age INTEGER, gender TEXT,
          height REAL, weight REAL, activity_level TEXT, goal_type TEXT,
          diet_preference TEXT, calorie_target INTEGER, protein_target INTEGER,
          carbs_target INTEGER, fats_target INTEGER, hydration_target INTEGER,
          onboarding_completed BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS meals (
          id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT,
          food_name TEXT, calories INTEGER, protein REAL,
          carbs REAL, fats REAL, meal_type TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
        )
      `);
      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS water_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          amount_ml INTEGER DEFAULT 0,
          UNIQUE(user_id, date)
        )
      `);
      console.log('✅ SQLite schemas verified.');
    }
  } catch (err) {
    console.error('❌ Database schema initialization error:', err.message);
  }
})();

// Initialize Gemini AI
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: dbMode,
    message: `Calorix Backend running with ${dbMode} + Gemini AI` 
  });
});

// ── USERS ─────────────────────────────────────────────────────

app.post('/api/users', async (req, res) => {
  console.log('POST /api/users HIT');
  const {
    clerk_user_id, name, email, age, gender, height, weight,
    activity_level, goal_type, diet_preference, calorie_target,
    protein_target, carbs_target, fats_target, hydration_target,
    onboarding_completed
  } = req.body;

  try {
    const existing = await db.query('SELECT clerk_user_id FROM users WHERE clerk_user_id = $1', [clerk_user_id]);
    
    if (existing.rows.length > 0) {
      await db.query(`
        UPDATE users SET
          name = $2, email = $3, age = $4, gender = $5, height = $6, weight = $7,
          activity_level = $8, goal_type = $9, diet_preference = $10,
          calorie_target = $11, protein_target = $12, carbs_target = $13,
          fats_target = $14, hydration_target = $15, onboarding_completed = $16
        WHERE clerk_user_id = $1
      `, [clerk_user_id, name, email, age, gender, height, weight,
          activity_level, goal_type, diet_preference, calorie_target,
          protein_target, carbs_target, fats_target, hydration_target,
          onboarding_completed]);
    } else {
      await db.query(`
        INSERT INTO users (
          clerk_user_id, name, email, age, gender, height, weight,
          activity_level, goal_type, diet_preference, calorie_target,
          protein_target, carbs_target, fats_target, hydration_target,
          onboarding_completed
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      `, [clerk_user_id, name, email, age, gender, height, weight,
          activity_level, goal_type, diet_preference, calorie_target,
          protein_target, carbs_target, fats_target, hydration_target,
          onboarding_completed]);
    }

    console.log('✅ User saved:', clerk_user_id);
    res.json({ success: true, message: 'User profile saved' });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/:clerk_user_id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE clerk_user_id = $1',
      [req.params.clerk_user_id]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── MEALS ─────────────────────────────────────────────────────

app.post('/api/meals', async (req, res) => {
  const { user_id, food_name, calories, protein, carbs, fats, meal_type } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO meals (user_id, food_name, calories, protein, carbs, fats, meal_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [user_id, food_name, calories, protein, carbs, fats, meal_type]);
    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/meals/:user_id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM meals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/meals/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM meals WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── WATER TRACKING ────────────────────────────────────

app.get('/api/water/:user_id', async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  try {
    const result = await db.query(
      'SELECT * FROM water_logs WHERE user_id = $1 AND date = $2',
      [req.params.user_id, date]
    );
    res.json({ success: true, data: result.rows[0] || { amount_ml: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/water', async (req, res) => {
  const { user_id, date, amount_ml } = req.body;
  if (!user_id || amount_ml == null) {
    return res.status(400).json({ success: false, error: 'Missing user_id or amount_ml' });
  }
  const targetDate = date || new Date().toISOString().split('T')[0];
  try {
    const existing = await db.query(
      'SELECT id FROM water_logs WHERE user_id = $1 AND date = $2',
      [user_id, targetDate]
    );

    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE water_logs SET amount_ml = $3 WHERE user_id = $1 AND date = $2',
        [user_id, targetDate, amount_ml]
      );
    } else {
      await db.query(
        'INSERT INTO water_logs (user_id, date, amount_ml) VALUES ($1, $2, $3)',
        [user_id, targetDate, amount_ml]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving water log:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── GEMINI AI DIET PLANNER ────────────────────────────────────

app.post('/api/ai-diet', async (req, res) => {
  const { profile } = req.body;

  const fallbackPlan = {
    breakfast: profile?.diet_preference === 'Vegan'
      ? 'Smoothie bowl with oats, banana, flaxseeds, and almond milk. (320 kcal)'
      : profile?.diet_preference === 'Vegetarian'
        ? 'Poha with peanuts, curry leaves, and a glass of warm milk. (320 kcal)'
        : 'Omelette (2 eggs) with whole wheat toast and a banana. (380 kcal)',
    lunch: profile?.diet_preference === 'Non-Vegetarian'
      ? '2 Rotis, Chicken Curry, and Cucumber Raita. (520 kcal)'
      : '2 Rotis, Chana Masala, and Cucumber Raita. (480 kcal)',
    snack: 'Roasted Chana and green tea. (150 kcal)',
    dinner: profile?.diet_preference === 'Non-Vegetarian'
      ? 'Grilled Chicken with Dal and Brown Rice. (450 kcal)'
      : 'Moong Dal Khichdi with a small serving of pickle and curd. (380 kcal)',
    insight: `Since your goal is to ${profile?.goal_type || 'maintain weight'}, this balanced Indian diet ensures you get essential nutrients while staying within your ${profile?.calorie_target || 2000} kcal daily target.`
  };

  if (!genAI) {
    return res.json({ success: true, plan: fallbackPlan });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional Indian nutritionist AI. Generate a personalized full-day Indian diet plan for:
- Weight: ${profile?.weight || 70}kg
- Height: ${profile?.height || 170}cm
- Age: ${profile?.age || 25}
- Gender: ${profile?.gender || 'Male'}
- Goal: ${profile?.goal_type || 'Maintain Weight'}
- Daily calorie target: ${profile?.calorie_target || 2000} kcal
- Protein target: ${profile?.protein_target || 120}g
- Dietary preference: ${profile?.diet_preference || 'Vegetarian'}
- Activity level: ${profile?.activity_level || 'Moderately Active'}

Return ONLY a valid JSON object (no markdown, no code blocks) with exactly these keys:
{
  "breakfast": "meal description with calories",
  "lunch": "meal description with calories",
  "snack": "meal description with calories",
  "dinner": "meal description with calories",
  "insight": "one personalized nutrition tip based on their goal and targets"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(text);
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Gemini Error:', error.message);
    res.json({ success: true, plan: fallbackPlan });
  }
});

// ── AI INSIGHT ENDPOINT ───────────────────────────────────────

app.post('/api/ai-insight', async (req, res) => {
  const { profile, consumed, proteinConsumed, carbsConsumed, fatsConsumed } = req.body;

  const caloriesRemaining = (profile?.calorie_target || 2000) - (consumed || 0);
  const proteinRemaining = (profile?.protein_target || 120) - (proteinConsumed || 0);

  const fallbackInsight = consumed > 0
    ? `You've consumed ${consumed} kcal today. You still need ${proteinRemaining}g of protein. Consider adding ${profile?.diet_preference === 'Non-Vegetarian' ? 'chicken or eggs' : 'paneer or dal'} to your next meal.`
    : `You haven't logged any meals yet today. Start tracking to hit your ${profile?.goal_type || 'goal'} faster!`;

  if (!genAI) {
    return res.json({ success: true, insight: fallbackInsight });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a smart Indian nutrition coach. Give ONE short, personalized tip (max 2 sentences) based on:
- Goal: ${profile?.goal_type}
- Calories consumed today: ${consumed} / ${profile?.calorie_target} kcal
- Protein consumed: ${proteinConsumed}g / ${profile?.protein_target}g
- Dietary preference: ${profile?.diet_preference}
Be direct, practical, and mention a specific Indian food. Return only plain text, no formatting.`;

    const result = await model.generateContent(prompt);
    res.json({ success: true, insight: result.response.text().trim() });
  } catch (error) {
    console.error('Gemini Insight Error:', error.message);
    res.json({ success: true, insight: fallbackInsight });
  }
});

app.post('/api/ai-chat', async (req, res) => {
  const { message, profile, history } = req.body;

  const fallbackReply = "I am currently running in offline mode. Please ensure the backend is connected to Gemini AI.";

  if (!genAI) {
    return res.json({ success: true, reply: fallbackReply });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      systemInstruction: { parts: [{ text: `You are an Indian nutrition expert. User goal: ${profile?.goal_type}. Keep your response concise, friendly, and formatted in markdown if needed.` }] }
    });

    const result = await chat.sendMessage([{ text: message }]);
    res.json({ success: true, reply: result.response.text().trim() });
  } catch (error) {
    console.error('Gemini Chat Error:', error.message);
    res.json({ success: true, reply: fallbackReply });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Calorix Backend running on port ${PORT}`);
});
