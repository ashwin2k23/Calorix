import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import OpenAI from 'openai';

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
        name TEXT,
        email TEXT,
        age INTEGER,
        gender TEXT,
        height REAL,
        weight REAL,
        activity_level TEXT,
        goal_type TEXT,
        diet_preference TEXT,
        calorie_target INTEGER,
        protein_target INTEGER,
        carbs_target INTEGER,
        fats_target INTEGER,
        hydration_target INTEGER,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        food_name TEXT,
        calories INTEGER,
        protein REAL,
        carbs REAL,
        fats REAL,
        meal_type TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY(user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ PostgreSQL Database Initialized!');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
})();

// Initialize OpenAI API (optional)
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Calorix Backend is running with PostgreSQL' });
});

// ── USERS ─────────────────────────────────────────────────────

// Save / Update user profile (upsert)
app.post('/api/users', async (req, res) => {
  console.log('POST /api/users HIT with body:', req.body);
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
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height = EXCLUDED.height,
        weight = EXCLUDED.weight,
        activity_level = EXCLUDED.activity_level,
        goal_type = EXCLUDED.goal_type,
        diet_preference = EXCLUDED.diet_preference,
        calorie_target = EXCLUDED.calorie_target,
        protein_target = EXCLUDED.protein_target,
        carbs_target = EXCLUDED.carbs_target,
        fats_target = EXCLUDED.fats_target,
        hydration_target = EXCLUDED.hydration_target,
        onboarding_completed = EXCLUDED.onboarding_completed
    `, [
      clerk_user_id, name, email, age, gender, height, weight,
      activity_level, goal_type, diet_preference, calorie_target,
      protein_target, carbs_target, fats_target, hydration_target,
      onboarding_completed
    ]);

    console.log('✅ User profile saved for:', clerk_user_id);
    res.json({ success: true, message: 'User profile saved' });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile
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
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── MEALS ─────────────────────────────────────────────────────

// Add a meal
app.post('/api/meals', async (req, res) => {
  const { user_id, food_name, calories, protein, carbs, fats, meal_type } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO meals (user_id, food_name, calories, protein, carbs, fats, meal_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [user_id, food_name, calories, protein, carbs, fats, meal_type]);

    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get meals for user
app.get('/api/meals/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM meals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a meal
app.delete('/api/meals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM meals WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── AI DIET PLANNER ───────────────────────────────────────────

app.post('/api/ai-diet', async (req, res) => {
  const { profile } = req.body;

  if (!openai) {
    return res.json({
      success: true,
      plan: {
        breakfast: 'Poha with peanuts and a glass of warm milk. (320 kcal)',
        lunch: '2 Rotis, Chana Masala, and Cucumber Raita. (480 kcal)',
        snack: 'Roasted Chana and green tea. (150 kcal)',
        dinner: 'Moong Dal Khichdi with a small serving of pickle. (350 kcal)',
        insight: `Since your goal is to ${profile?.goal_type || 'maintain weight'}, this balanced Indian diet ensures you get essential nutrients.`
      }
    });
  }

  try {
    const prompt = `Generate a full-day Indian diet plan for a person weighing ${profile?.weight || 75}kg with the goal to ${profile?.goal_type || 'maintain weight'}.
    Return ONLY a raw JSON object with strictly these keys: "breakfast", "lunch", "snack", "dinner", "insight".
    Provide healthy, traditional Indian food options with approximate calories. The insight should be a 1-sentence personalized tip.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' }
    });

    const plan = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, plan });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI diet plan' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Calorix Backend running on port ${PORT}`);
});
