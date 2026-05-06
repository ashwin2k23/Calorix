import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
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

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Auto-create tables on startup
(async () => {
  try {
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
    console.log('✅ PostgreSQL Database Initialized!');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
})();

// Initialize Gemini AI
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Calorix Backend running with PostgreSQL + Gemini AI' });
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
    await pool.query(`
      INSERT INTO users (
        clerk_user_id, name, email, age, gender, height, weight,
        activity_level, goal_type, diet_preference, calorie_target,
        protein_target, carbs_target, fats_target, hydration_target,
        onboarding_completed
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        name = EXCLUDED.name, email = EXCLUDED.email, age = EXCLUDED.age,
        gender = EXCLUDED.gender, height = EXCLUDED.height, weight = EXCLUDED.weight,
        activity_level = EXCLUDED.activity_level, goal_type = EXCLUDED.goal_type,
        diet_preference = EXCLUDED.diet_preference, calorie_target = EXCLUDED.calorie_target,
        protein_target = EXCLUDED.protein_target, carbs_target = EXCLUDED.carbs_target,
        fats_target = EXCLUDED.fats_target, hydration_target = EXCLUDED.hydration_target,
        onboarding_completed = EXCLUDED.onboarding_completed
    `, [clerk_user_id, name, email, age, gender, height, weight,
        activity_level, goal_type, diet_preference, calorie_target,
        protein_target, carbs_target, fats_target, hydration_target,
        onboarding_completed]);

    console.log('✅ User saved:', clerk_user_id);
    res.json({ success: true, message: 'User profile saved' });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/:clerk_user_id', async (req, res) => {
  try {
    const result = await pool.query(
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
    const result = await pool.query(`
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
    const result = await pool.query(
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
    await pool.query('DELETE FROM meals WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
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
    // Return fallback instead of erroring
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Calorix Backend running on port ${PORT} with Gemini AI`);
});
