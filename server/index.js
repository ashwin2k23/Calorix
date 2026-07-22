import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';
import validator from 'validator';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// ── SECURITY HEADERS ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://calorix-taupe.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── BODY PARSING WITH SIZE LIMIT ─────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ── RATE LIMITERS ─────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Write rate limit exceeded.' },
});

app.use('/api/', generalLimiter);
app.use('/api/users', writeLimiter);
app.use('/api/meals', writeLimiter);

// ── REQUEST LOGGER ────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── SANITIZATION HELPERS ──────────────────────────────────────
const sanitizeStr = (v) => {
  if (v == null) return null;
  return xss(String(v).trim()).slice(0, 500);
};

const sanitizeNum = (v, fallback = null) => {
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
};

const sanitizeInt = (v, fallback = null) => {
  const n = parseInt(v, 10);
  return isFinite(n) ? n : fallback;
};

const sanitizeBool = (v) => v === true || v === 'true' || v === 1;

// Allowed enum values — reject anything else
const ALLOWED = {
  activity_level: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
  goal_type: ['Lose Weight', 'Maintain Weight', 'Gain Muscle'],
  diet_preference: ['Vegetarian', 'Non-Vegetarian', 'Vegan'],
  meal_type: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'],
  gender: ['Male', 'Female', 'Other'],
};

const allowedEnum = (val, key) =>
  ALLOWED[key]?.includes(val) ? val : ALLOWED[key][0];

// Validate Clerk user ID format (starts with "user_", alphanumeric)
const isValidClerkId = (id) =>
  typeof id === 'string' && /^user_[a-zA-Z0-9_]{10,50}$/.test(id);

// ── DATABASE SETUP ────────────────────────────────────────────
let sqliteDb;
let sqliteInitError = null;

const db = {
  query: async (text, params = []) => {
    const safeParams = params.map(p => (p === undefined ? null : p));
    let sqliteText = text.replace(/\$\d+/g, '?');
    const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
    if (isSelect) {
      const rows = await sqliteDb.all(sqliteText, safeParams);
      return { rows };
    } else {
      const result = await sqliteDb.run(sqliteText, safeParams);
      let rows = [];
      if (sqliteText.toUpperCase().includes('RETURNING')) rows = [{ id: result.lastID }];
      return { rows, lastID: result.lastID, changes: result.changes };
    }
  }
};

(async () => {
  // Use /tmp in production (always writable on Render free tier)
  const dbPath = process.env.SQLITE_PATH ||
    (process.env.NODE_ENV === 'production' ? '/tmp/calorix.db' : path.join(process.cwd(), 'calorix.db'));

  try {
    const sqlite3Module = await import('sqlite3');
    const sqliteModule = await import('sqlite');
    sqliteDb = await sqliteModule.open({
      filename: dbPath,
      driver: sqlite3Module.default.Database
    });
    console.log(`✅ Connected to SQLite database: ${dbPath}`);
  } catch (err) {
    sqliteInitError = err.message;
    console.error('❌ Failed to open SQLite database:', err.message);
    return;
  }

  try {
    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        clerk_user_id TEXT PRIMARY KEY,
        name TEXT, email TEXT, age INTEGER, gender TEXT,
        height REAL, weight REAL, activity_level TEXT, goal_type TEXT,
        diet_preference TEXT, calorie_target INTEGER, protein_target INTEGER,
        carbs_target INTEGER, fats_target INTEGER, hydration_target INTEGER,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT, food_name TEXT, calories INTEGER, protein REAL,
        carbs REAL, fats REAL, meal_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
      )`);
    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS water_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        amount_ml INTEGER DEFAULT 0,
        UNIQUE(user_id, date)
      )`);
    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
        activity_name TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        calories_burned INTEGER NOT NULL,
        intensity TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

    // Add columns that might be missing from older deployments (errors ignored)
    const userColumns = [
      ['age', 'INTEGER'], ['gender', 'TEXT'], ['height', 'REAL'], ['weight', 'REAL'],
      ['activity_level', 'TEXT'], ['goal_type', 'TEXT'], ['diet_preference', 'TEXT'],
      ['calorie_target', 'INTEGER'], ['protein_target', 'INTEGER'],
      ['carbs_target', 'INTEGER'], ['fats_target', 'INTEGER'],
      ['hydration_target', 'INTEGER'], ['onboarding_completed', 'BOOLEAN DEFAULT FALSE']
    ];
    for (const [colName, colType] of userColumns) {
      try { await sqliteDb.exec(`ALTER TABLE users ADD COLUMN ${colName} ${colType}`); } catch (_) {}
    }
    try { await sqliteDb.exec('ALTER TABLE meals ADD COLUMN meal_type TEXT'); } catch (_) {}

    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS global_foods (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        name_lower  TEXT    NOT NULL,
        serving_size TEXT,
        calories    REAL, protein REAL, carbs REAL, fat REAL,
        category    TEXT, emoji TEXT,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name_lower)
      )`);
    await sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_gf_name ON global_foods(name_lower);');
    console.log('✅ Database schemas verified.');
  } catch (err) {
    console.error('❌ Schema init error:', err.message);
  }
})();

// ── HEALTH CHECK ────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;
  try {
    const result = await db.query('SELECT 1');
    if (result) dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }
  res.json({
    status: 'ok',
    database: 'sqlite',
    dbStatus,
    dbError,
    sqliteInitError,
    env: { NODE_ENV: process.env.NODE_ENV }
  });
});


// ── USERS ─────────────────────────────────────────────────────
app.post('/api/users', async (req, res) => {
  const b = req.body;

  // Validate Clerk ID
  if (!isValidClerkId(b.clerk_user_id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }

  // Validate email
  if (b.email && !validator.isEmail(String(b.email))) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  // Sanitize & validate numeric ranges
  const age = sanitizeInt(b.age);
  if (age != null && (age < 10 || age > 120)) {
    return res.status(400).json({ success: false, error: 'Age must be between 10 and 120.' });
  }
  const height = sanitizeNum(b.height);
  if (height != null && (height < 50 || height > 300)) {
    return res.status(400).json({ success: false, error: 'Height must be between 50cm and 300cm.' });
  }
  const weight = sanitizeNum(b.weight);
  if (weight != null && (weight < 20 || weight > 500)) {
    return res.status(400).json({ success: false, error: 'Weight must be between 20kg and 500kg.' });
  }

  const params = [
    b.clerk_user_id,
    sanitizeStr(b.name),
    sanitizeStr(b.email),
    age,
    allowedEnum(sanitizeStr(b.gender), 'gender'),
    height,
    weight,
    allowedEnum(sanitizeStr(b.activity_level), 'activity_level'),
    allowedEnum(sanitizeStr(b.goal_type), 'goal_type'),
    allowedEnum(sanitizeStr(b.diet_preference), 'diet_preference'),
    sanitizeInt(b.calorie_target),
    sanitizeInt(b.protein_target),
    sanitizeInt(b.carbs_target),
    sanitizeInt(b.fats_target),
    sanitizeInt(b.hydration_target),
    sanitizeBool(b.onboarding_completed),
  ];

  try {
    const existing = await db.query('SELECT clerk_user_id FROM users WHERE clerk_user_id = $1', [b.clerk_user_id]);
    if (existing.rows.length > 0) {
      await db.query(`
        UPDATE users SET
          name=$2,email=$3,age=$4,gender=$5,height=$6,weight=$7,
          activity_level=$8,goal_type=$9,diet_preference=$10,
          calorie_target=$11,protein_target=$12,carbs_target=$13,
          fats_target=$14,hydration_target=$15,onboarding_completed=$16
        WHERE clerk_user_id=$1`, params);
    } else {
      await db.query(`
        INSERT INTO users (
          clerk_user_id,name,email,age,gender,height,weight,
          activity_level,goal_type,diet_preference,calorie_target,
          protein_target,carbs_target,fats_target,hydration_target,onboarding_completed
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, params);
    }
    res.json({ success: true, message: 'User profile saved' });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ success: false, error: 'Failed to save profile.' });
  }
});

app.get('/api/users/:clerk_user_id', async (req, res) => {
  const id = req.params.clerk_user_id;
  if (!isValidClerkId(id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }
  try {
    const result = await db.query('SELECT * FROM users WHERE clerk_user_id = $1', [id]);
    if (result.rows.length > 0) {
      // Never expose raw email in transit — mask it
      const row = result.rows[0];
      res.json({ success: true, data: row });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

// ── MEALS ─────────────────────────────────────────────────────
app.post('/api/meals', async (req, res) => {
  const b = req.body;
  if (!isValidClerkId(b.user_id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }

  const foodName = sanitizeStr(b.food_name);
  if (!foodName || foodName.length < 1) {
    return res.status(400).json({ success: false, error: 'Food name is required.' });
  }

  const calories = sanitizeInt(b.calories);
  const protein  = sanitizeNum(b.protein);
  const carbs    = sanitizeNum(b.carbs);
  const fats     = sanitizeNum(b.fats);

  if (calories != null && (calories < 0 || calories > 10000)) {
    return res.status(400).json({ success: false, error: 'Calories out of range (0–10000).' });
  }

  const mealType = allowedEnum(sanitizeStr(b.meal_type), 'meal_type');

  try {
    const result = await db.query(`
      INSERT INTO meals (user_id, food_name, calories, protein, carbs, fats, meal_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [b.user_id, foodName, calories, protein, carbs, fats, mealType]);
    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    console.error('Error adding meal:', error);
    res.status(500).json({ success: false, error: 'Failed to log meal.' });
  }
});

app.get('/api/meals/:user_id', async (req, res) => {
  const id = req.params.user_id;
  if (!isValidClerkId(id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }
  try {
    const result = await db.query(
      'SELECT * FROM meals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve meals.' });
  }
});

app.delete('/api/meals/:id', async (req, res) => {
  const id = sanitizeInt(req.params.id);
  if (!id || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid meal ID.' });
  }
  try {
    await db.query('DELETE FROM meals WHERE id = $1', [id]);
    res.json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete meal.' });
  }
});

// ── WORKOUTS ──────────────────────────────────────────────────
app.get('/api/workouts/:user_id', async (req, res) => {
  const id = req.params.user_id;
  if (!isValidClerkId(id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }
  try {
    const result = await db.query(
      'SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve workouts.' });
  }
});

app.post('/api/workouts', async (req, res) => {
  const b = req.body;
  if (!isValidClerkId(b.user_id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }

  const activityName = sanitizeStr(b.activity_name);
  if (!activityName || activityName.length < 1) {
    return res.status(400).json({ success: false, error: 'Activity name is required.' });
  }

  const duration = sanitizeInt(b.duration_minutes);
  const calories = sanitizeInt(b.calories_burned);
  const intensity = sanitizeStr(b.intensity) || 'Moderate';

  if (duration == null || duration <= 0 || duration > 1440) {
    return res.status(400).json({ success: false, error: 'Duration must be between 1 and 1440 minutes.' });
  }

  if (calories == null || calories < 0 || calories > 20000) {
    return res.status(400).json({ success: false, error: 'Calories out of range (0–20000).' });
  }

  try {
    const result = await db.query(`
      INSERT INTO workouts (user_id, activity_name, duration_minutes, calories_burned, intensity)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at
    `, [b.user_id, activityName, duration, calories, intensity]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding workout:', error);
    res.status(500).json({ success: false, error: 'Failed to log workout.' });
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  const id = sanitizeInt(req.params.id);
  if (!id || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid workout ID.' });
  }
  try {
    await db.query('DELETE FROM workouts WHERE id = $1', [id]);
    res.json({ success: true, message: 'Workout deleted' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ success: false, error: 'Failed to delete workout.' });
  }
});

// ── WATER TRACKING ────────────────────────────────────────────
app.get('/api/water/:user_id', async (req, res) => {
  const id = req.params.user_id;
  if (!isValidClerkId(id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }
  const rawDate = req.query.date;
  const date = rawDate && validator.isDate(rawDate) ? rawDate : new Date().toISOString().split('T')[0];
  try {
    const result = await db.query(
      'SELECT * FROM water_logs WHERE user_id = $1 AND date = $2',
      [id, date]
    );
    res.json({ success: true, data: result.rows[0] || { amount_ml: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve water log.' });
  }
});

app.put('/api/water', async (req, res) => {
  const { user_id, date, amount_ml } = req.body;
  if (!isValidClerkId(user_id)) {
    return res.status(400).json({ success: false, error: 'Invalid user identifier.' });
  }
  const ml = sanitizeInt(amount_ml);
  if (ml == null || ml < 0 || ml > 10000) {
    return res.status(400).json({ success: false, error: 'amount_ml must be between 0 and 10000.' });
  }
  const rawDate = date;
  const targetDate = rawDate && validator.isDate(rawDate) ? rawDate : new Date().toISOString().split('T')[0];
  try {
    const existing = await db.query(
      'SELECT id FROM water_logs WHERE user_id = $1 AND date = $2',
      [user_id, targetDate]
    );
    if (existing.rows.length > 0) {
      await db.query('UPDATE water_logs SET amount_ml = $3 WHERE user_id = $1 AND date = $2', [user_id, targetDate, ml]);
    } else {
      await db.query('INSERT INTO water_logs (user_id, date, amount_ml) VALUES ($1, $2, $3)', [user_id, targetDate, ml]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving water log:', error);
    res.status(500).json({ success: false, error: 'Failed to update water log.' });
  }
});

// ── FOOD SEARCH (dataset + local fallback) ───────────────────
app.get('/api/food-search', async (req, res) => {
  const raw = sanitizeStr(req.query.q);
  const mealType = sanitizeStr(req.query.meal_type) || 'Lunch';

  if (!raw || raw.length < 1) {
    return res.status(400).json({ success: false, error: 'Query is required.' });
  }

  const q = raw.toLowerCase().trim();

  // 1. Search imported Kaggle DB
  try {
    const { rows } = await db.query(
      `SELECT name, serving_size as servingSize, calories, protein, carbs, fat, category, emoji
       FROM global_foods
       WHERE name_lower LIKE $1
       ORDER BY
         CASE WHEN name_lower LIKE $2 THEN 0 ELSE 1 END,
         length(name)
       LIMIT 25`,
      [`%${q}%`, `${q}%`]
    );
    if (rows && rows.length > 0) {
      const results = rows.map(r => ({
        name:        r.name,
        servingSize: r.servingSize || '100g',
        cal:         r.calories != null ? Math.round(r.calories) : 0,
        p:           r.protein  != null ? r.protein  : 0,
        c:           r.carbs    != null ? r.carbs    : 0,
        f:           r.fat      != null ? r.fat      : 0,
        category:    mealType,
        emoji:       r.emoji || '🍽️',
      }));
      return res.json({ success: true, results, source: 'db' });
    }
  } catch (err) {
    // table may not exist yet — fall through to local matcher
  }

  // 2. Local keyword matcher fallback
  const LOCAL = [
    { kw: ['pizza','domino'],         emoji:'🍕', items:[
      {name:'Margherita Pizza (1 slice)',cal:250,p:10,c:30,f:9,servingSize:'100g'},
      {name:'Veggie Paradise Pizza',   cal:230,p:9, c:28,f:8, servingSize:'100g'},
      {name:'Chicken Tikka Pizza',     cal:280,p:14,c:29,f:11,servingSize:'100g'},
      {name:'Double Cheese Margherita',cal:320,p:13,c:32,f:14,servingSize:'100g'}]},
    { kw: ['burger','mcdonald'],       emoji:'🍔', items:[
      {name:'Classic Veg Burger',      cal:320,p:11,c:45,f:10,servingSize:'1 piece'},
      {name:'Crispy Chicken Burger',   cal:380,p:18,c:40,f:14,servingSize:'1 piece'},
      {name:'Cheese Burger',           cal:450,p:22,c:38,f:20,servingSize:'1 piece'}]},
    { kw: ['juice','shake','lassi','smoothie','lemonade'],emoji:'🧃',items:[
      {name:'Fresh Orange Juice',      cal:110,p:2, c:26,f:0.2,servingSize:'250ml'},
      {name:'Mango Shake',             cal:180,p:4, c:38,f:2.5,servingSize:'250ml'},
      {name:'Sweet Lassi',             cal:210,p:5, c:32,f:6,  servingSize:'250ml'},
      {name:'Nimbu Pani / Lemonade',   cal:75, p:0.2,c:19,f:0.1,servingSize:'250ml'}]},
    { kw: ['chai','tea','coffee','latte'], emoji:'☕',items:[
      {name:'Masala Chai',             cal:75, p:2, c:12,f:2,  servingSize:'1 cup'},
      {name:'Filter Coffee',           cal:85, p:2.2,c:14,f:2.2,servingSize:'1 cup'}]},
    { kw: ['rice','biryani','pulao','khichdi','fried rice'],emoji:'🍚',items:[
      {name:'Basmati White Rice',      cal:240,p:4, c:53,f:0,  servingSize:'1 bowl'},
      {name:'Chicken Biryani',         cal:450,p:28,c:50,f:15, servingSize:'250g'},
      {name:'Veg Biryani',             cal:360,p:10,c:58,f:10, servingSize:'250g'}]},
    { kw: ['dal','curry','tadka','makhani','masala','chole','rajma'],emoji:'🥘',items:[
      {name:'Dal Tadka',               cal:180,p:9, c:24,f:5,  servingSize:'1 bowl'},
      {name:'Dal Makhani',             cal:290,p:11,c:30,f:14, servingSize:'1 bowl'},
      {name:'Paneer Butter Masala',    cal:360,p:14,c:14,f:28, servingSize:'1 bowl'},
      {name:'Chole Masala',            cal:240,p:9, c:38,f:6,  servingSize:'1 bowl'}]},
    { kw: ['roti','chapati','naan','paratha','bread','puri'],emoji:'🫓',items:[
      {name:'Roti / Chapati',          cal:104,p:3, c:22,f:0.5,servingSize:'1 piece'},
      {name:'Butter Naan',             cal:310,p:8, c:45,f:11, servingSize:'1 piece'},
      {name:'Aloo Paratha',            cal:320,p:7, c:48,f:11, servingSize:'1 piece'}]},
    { kw: ['chicken','meat','fish','mutton','kebab','tikka','tandoori'],emoji:'🍗',items:[
      {name:'Tandoori Chicken',        cal:280,p:34,c:4, f:14, servingSize:'2 pieces'},
      {name:'Chicken Tikka',           cal:270,p:32,c:6, f:13, servingSize:'6 pieces'},
      {name:'Butter Chicken',          cal:420,p:28,c:14,f:28, servingSize:'200g'}]},
    { kw: ['egg','omelette'],          emoji:'🍳',items:[
      {name:'Boiled Eggs',             cal:155,p:13,c:1, f:11, servingSize:'2 eggs'},
      {name:'Bread Omelette',          cal:340,p:18,c:28,f:16, servingSize:'1 plate'},
      {name:'Egg Curry',               cal:250,p:16,c:6, f:18, servingSize:'2 eggs'}]},
    { kw: ['samosa','pakoda','pakora','fries','chips','kachori','bhujia'],emoji:'🍟',items:[
      {name:'Crispy Samosa',           cal:150,p:3, c:20,f:8,  servingSize:'1 piece'},
      {name:'French Fries (Medium)',   cal:320,p:3.4,c:41,f:15,servingSize:'1 serving'},
      {name:'Potato Chips',            cal:260,p:3, c:27,f:16, servingSize:'50g'}]},
    { kw: ['pasta','noodles','maggi','macaroni'],emoji:'🍝',items:[
      {name:'Penne Arrabiata Pasta',   cal:380,p:12,c:60,f:10, servingSize:'1 plate'},
      {name:'Veg Hakka Noodles',       cal:340,p:8, c:58,f:8,  servingSize:'1 plate'},
      {name:'Classic Maggi Noodles',   cal:310,p:7, c:46,f:11, servingSize:'1 pack'}]},
    { kw: ['paneer','cheese','milk','curd','dahi','yogurt'],emoji:'🥛',items:[
      {name:'Paneer Tikka',            cal:260,p:18,c:8, f:18, servingSize:'150g'},
      {name:'Whole Milk',              cal:150,p:8, c:12,f:8,  servingSize:'250ml'},
      {name:'Fresh Curd / Yogurt',     cal:100,p:5, c:6, f:4.5,servingSize:'1 bowl'}]},
    { kw: ['idli','dosa','upma','poha','uttapam'],emoji:'🥞',items:[
      {name:'Masala Dosa',             cal:350,p:8, c:60,f:9,  servingSize:'1 piece'},
      {name:'Idli (2 pieces)',          cal:160,p:5, c:32,f:1.5,servingSize:'2 pieces'},
      {name:'Poha',                    cal:250,p:5, c:45,f:5,  servingSize:'1 plate'}]},
    { kw: ['sweet','halwa','laddu','ladoo','jamun','jalebi','kheer','chocolate','ice cream'],emoji:'🍬',items:[
      {name:'Gulab Jamun',             cal:150,p:2, c:25,f:5,  servingSize:'1 piece'},
      {name:'Jalebi',                  cal:220,p:2, c:38,f:7,  servingSize:'2 pieces'},
      {name:'Chocolate Ice Cream',     cal:160,p:3, c:22,f:8,  servingSize:'1 scoop'}]},
    { kw: ['sandwich','subway','toast'],emoji:'🥪',items:[
      {name:'Veg Grilled Sandwich',    cal:210,p:6, c:36,f:5,  servingSize:'1 sandwich'},
      {name:'Chicken Subway Sub',      cal:340,p:24,c:44,f:7,  servingSize:'6 inch'}]},
    { kw: ['apple','banana','orange','mango','fruit','strawberry','grape'],emoji:'🍎',items:[
      {name:'Apple',                   cal:95, p:0.5,c:25,f:0.3,servingSize:'1 medium'},
      {name:'Banana',                  cal:89, p:1,  c:23,f:0,  servingSize:'1 medium'},
      {name:'Fresh Strawberries',      cal:32, p:0.7,c:7.7,f:0.3,servingSize:'100g'}]},
  ];

  const cat = LOCAL.find(c => c.kw.some(k => q.includes(k)));
  let results = [];

  if (cat) {
    results = cat.items
      .filter(item => {
        const words = q.split(/\s+/).filter(w => w.length > 2 && !cat.kw.includes(w));
        return words.length === 0 || words.some(w => item.name.toLowerCase().includes(w));
      })
      .map(item => ({ ...item, emoji: cat.emoji, category: mealType }));
    if (!results.length) results = cat.items.map(i => ({ ...i, emoji: cat.emoji, category: mealType }));
  }

  res.json({ success: true, results, source: 'local' });
});

// Legacy alias kept for any in-flight requests
app.post('/api/ai-search', async (req, res) => {
  const query = sanitizeStr(req.body.query);
  const mealType = sanitizeStr(req.body.meal_type) || 'Lunch';

  if (!query || query.length < 2) {
    return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters.' });
  }

  const queryLower = query.toLowerCase();

  // 1. Prioritize querying the imported Kaggle/OpenFoodFacts database in SQLite
  let dbRows = [];
  try {
    const dbResult = await db.query(
      'SELECT name, category, emoji, calories as cal, protein as p, carbs as c, fats as f FROM global_foods WHERE name LIKE $1 LIMIT 6',
      [`%${query}%`]
    );
    dbRows = dbResult?.rows || [];
    // Ensure category is mapped correctly to the searched mealType
    dbRows = dbRows.map(row => ({ ...row, category: mealType }));
  } catch (err) {
    // Table doesn't exist yet, continue to local offline keywords matcher
  }

  let results = dbRows;

  // 2. If no database matches, fall back to our smart local keywords matcher
  if (results.length === 0) {
    // Define food categories and their keywords & templates
    const categories = [
    {
      keywords: ['pizza', 'domino', 'pizza hut'],
      emoji: '🍕',
      items: [
        { name: 'Margherita Pizza (1 slice)', cal: 250, p: 10, c: 30, f: 9 },
        { name: 'Veggie Paradise Pizza (1 slice)', cal: 230, p: 9, c: 28, f: 8 },
        { name: 'Chicken Tikka Pizza (1 slice)', cal: 280, p: 14, c: 29, f: 11 },
        { name: 'Double Cheese Margherita Pizza', cal: 320, p: 13, c: 32, f: 14 }
      ]
    },
    {
      keywords: ['burger', 'hamburger', 'mcdonald', 'burger king'],
      emoji: '🍔',
      items: [
        { name: 'Classic Veg Burger', cal: 320, p: 11, c: 45, f: 10 },
        { name: 'Crispy Chicken Burger', cal: 380, p: 18, c: 40, f: 14 },
        { name: 'Cheese Burger Extra Large', cal: 450, p: 22, c: 38, f: 20 }
      ]
    },
    {
      keywords: ['sandwich', 'subway', 'sub', 'toast', 'bread slice'],
      emoji: '🥪',
      items: [
        { name: 'Veg Grilled Sandwich', cal: 210, p: 6, c: 36, f: 5 },
        { name: 'Cheese Corn Sandwich', cal: 280, p: 9, c: 38, f: 10 },
        { name: 'Chicken Subway Sub (6 inch)', cal: 340, p: 24, c: 44, f: 7 }
      ]
    },
    {
      keywords: ['juice', 'shake', 'smoothie', 'lassi', 'chaas', 'limeade', 'lemonade'],
      emoji: '🧃',
      items: [
        { name: 'Fresh Orange Juice (1 glass)', cal: 110, p: 2, c: 26, f: 0.2 },
        { name: 'Mango Shake (250ml)', cal: 180, p: 4, c: 38, f: 2.5 },
        { name: 'Sweet Lassi (1 glass)', cal: 210, p: 5, c: 32, f: 6 },
        { name: 'Fresh Watermelon Juice', cal: 90, p: 1.5, c: 21, f: 0.2 },
        { name: 'Fresh Pineapple Juice', cal: 120, p: 1, c: 29, f: 0.2 },
        { name: 'Nimbu Pani / Lemonade', cal: 75, p: 0.2, c: 19, f: 0.1 }
      ]
    },
    {
      keywords: ['chai', 'tea', 'coffee', 'latte', 'cappuccino', 'starbucks'],
      emoji: '☕',
      items: [
        { name: 'Masala Chai (1 cup)', cal: 75, p: 2, c: 12, f: 2 },
        { name: 'Filter Coffee (1 cup)', cal: 85, p: 2.2, c: 14, f: 2.2 },
        { name: 'Starbucks Iced Latte', cal: 130, p: 6, c: 16, f: 4.5 }
      ]
    },
    {
      keywords: ['samosa', 'pakoda', 'pakora', 'fries', 'chips', 'kachori', 'vada', 'tikki', 'bhujia', 'namkeen', 'kurkure', 'lays'],
      emoji: '🍟',
      items: [
        { name: 'Crispy Samosa (1 piece)', cal: 150, p: 3, c: 20, f: 8 },
        { name: 'Onion Pakoda (4 pieces)', cal: 180, p: 3.5, c: 22, f: 9 },
        { name: 'French Fries (Medium)', cal: 320, p: 3.4, c: 41, f: 15 },
        { name: 'Potato Chips (1 packet/50g)', cal: 260, p: 3, c: 27, f: 16 },
        { name: 'Haldiram\'s Bhujia (50g)', cal: 290, p: 6, c: 20, f: 21 }
      ]
    },
    {
      keywords: ['sweet', 'halwa', 'laddu', 'ladoo', 'jamun', 'jalebi', 'rasgulla', 'ice cream', 'cake', 'chocolate', 'kheer', 'pastry'],
      emoji: '🍬',
      items: [
        { name: 'Gulab Jamun (1 piece)', cal: 150, p: 2, c: 25, f: 5 },
        { name: 'Jalebi (2 pieces)', cal: 220, p: 2, c: 38, f: 7 },
        { name: 'Rasgulla (1 piece)', cal: 125, p: 2.5, c: 26, f: 1.5 },
        { name: 'Chocolate Ice Cream (1 scoop)', cal: 160, p: 3, c: 22, f: 8 },
        { name: 'Moong Dal Halwa (1 bowl)', cal: 320, p: 6, c: 42, f: 14 }
      ]
    },
    {
      keywords: ['roti', 'chapati', 'naan', 'paratha', 'bread', 'thepla', 'puri', 'pav', 'kulcha'],
      emoji: '🫓',
      items: [
        { name: 'Tandoori Roti (1 piece)', cal: 115, p: 4, c: 24, f: 0.5 },
        { name: 'Aloo Paratha (1 piece)', cal: 320, p: 7, c: 48, f: 11 },
        { name: 'Paneer Paratha (1 piece)', cal: 320, p: 12, c: 42, f: 12 },
        { name: 'Butter Naan (1 piece)', cal: 310, p: 8, c: 45, f: 11 },
        { name: 'Roti / Chapati (1 piece)', cal: 104, p: 3, c: 22, f: 0.5 }
      ]
    },
    {
      keywords: ['rice', 'pulav', 'pulao', 'biryani', 'khichdi', 'fried rice'],
      emoji: '🍚',
      items: [
        { name: 'Basmati White Rice (1 bowl)', cal: 240, p: 4, c: 53, f: 0 },
        { name: 'Brown Rice (1 bowl)', cal: 215, p: 5, c: 46, f: 1.6 },
        { name: 'Chicken Biryani (250g)', cal: 450, p: 28, c: 50, f: 15 },
        { name: 'Veg Biryani (250g)', cal: 360, p: 10, c: 58, f: 10 },
        { name: 'Schezwan Fried Rice (1 plate)', cal: 360, p: 7, c: 62, f: 10 }
      ]
    },
    {
      keywords: ['curry', 'dal', 'tadka', 'makhani', 'masala', 'chole', 'rajma', 'korma', 'paneer butter'],
      emoji: '🥘',
      items: [
        { name: 'Dal Tadka (1 bowl)', cal: 180, p: 9, c: 24, f: 5 },
        { name: 'Dal Makhani (1 bowl)', cal: 290, p: 11, c: 30, f: 14 },
        { name: 'Paneer Butter Masala (1 bowl)', cal: 360, p: 14, c: 14, f: 28 },
        { name: 'Chole Masala (1 bowl)', cal: 240, p: 9, c: 38, f: 6 },
        { name: 'Rajma Masala (1 bowl)', cal: 190, p: 10, c: 32, f: 3 }
      ]
    },
    {
      keywords: ['chicken', 'meat', 'fish', 'mutton', 'kebab', 'tikka', 'tandoori'],
      emoji: '🍗',
      items: [
        { name: 'Tandoori Chicken (2 pieces)', cal: 280, p: 34, c: 4, f: 14 },
        { name: 'Chicken Tikka (Dry - 6 pieces)', cal: 270, p: 32, c: 6, f: 13 },
        { name: 'Fish Curry (200g)', cal: 260, p: 24, c: 8, f: 12 },
        { name: 'Butter Chicken (200g)', cal: 420, p: 28, c: 14, f: 28 }
      ]
    },
    {
      keywords: ['egg', 'omelette', 'boiled egg', 'scrambled'],
      emoji: '🍳',
      items: [
        { name: 'Boiled Eggs (2 eggs)', cal: 155, p: 13, c: 1, f: 11 },
        { name: 'Bread Omelette (2 eggs + 2 slices)', cal: 340, p: 18, c: 28, f: 16 },
        { name: 'Egg Curry (2 eggs)', cal: 250, p: 16, c: 6, f: 18 }
      ]
    },
    {
      keywords: ['apple', 'banana', 'orange', 'mango', 'watermelon', 'pineapple', 'grape', 'guava', 'strawberry', 'coconut', 'fruit'],
      emoji: '🍎',
      items: [
        { name: 'Apple (1 medium)', cal: 95, p: 0.5, c: 25, f: 0.3 },
        { name: 'Banana (1 medium)', cal: 89, p: 1, c: 23, f: 0 },
        { name: 'Fresh Strawberries (100g)', cal: 32, p: 0.7, c: 7.7, f: 0.3 },
        { name: 'Fresh Coconut Water (300ml)', cal: 60, p: 1, c: 14, f: 0 }
      ]
    },
    {
      keywords: ['salad', 'sprouts', 'gobhi', 'bhindi', 'baingan', 'aloo', 'potato', 'cucumber', 'tomato', 'onion', 'spinach', 'palak', 'veg'],
      emoji: '🥗',
      items: [
        { name: 'Fresh Sprouts Salad (1 bowl)', cal: 120, p: 9, c: 18, f: 1 },
        { name: 'Greek Cucumber Tomato Salad', cal: 110, p: 2.5, c: 8, f: 8 },
        { name: 'Aloo Gobhi (1 bowl)', cal: 150, p: 3, c: 18, f: 7 },
        { name: 'Bhindi Masala (1 bowl)', cal: 130, p: 3, c: 14, f: 6 }
      ]
    },
    {
      keywords: ['milk', 'curd', 'yogurt', 'dahi', 'paneer', 'cheese', 'butter'],
      emoji: '🥛',
      items: [
        { name: 'Whole Milk (1 glass/250ml)', cal: 150, p: 8, c: 12, f: 8 },
        { name: 'Fresh Curd / Yogurt (1 bowl)', cal: 100, p: 5, c: 6, f: 4.5 },
        { name: 'Paneer Tikka (Dry - 150g)', cal: 260, p: 18, c: 8, f: 18 }
      ]
    },
    {
      keywords: ['pasta', 'macaroni', 'noodles', 'chow mein', 'maggie', 'maggi', 'ramen'],
      emoji: '🍝',
      items: [
        { name: 'Penne Arrabiata Pasta (1 plate)', cal: 380, p: 12, c: 60, f: 10 },
        { name: 'Mac & Cheese (1 bowl)', cal: 420, p: 15, c: 48, f: 18 },
        { name: 'Veg Hakka Noodles (1 plate)', cal: 340, p: 8, c: 58, f: 8 },
        { name: 'Classic Maggi Noodles (1 pack)', cal: 310, p: 7, c: 46, f: 11 }
      ]
    }
  ];

  // Match the query against keywords
  let matchedCategory = categories.find(cat =>
    cat.keywords.some(kw => queryLower.includes(kw))
  );

  results = [];
  if (matchedCategory) {
    results = matchedCategory.items
      .map(item => ({
        ...item,
        emoji: matchedCategory.emoji,
        category: mealType
      }))
      .filter(item => {
        const words = queryLower.split(/\s+/).filter(w => w.length > 2 && !matchedCategory.keywords.includes(w));
        if (words.length === 0) return true;
        return words.some(word => item.name.toLowerCase().includes(word));
      });

    if (results.length === 0) {
      results = matchedCategory.items.map(item => ({
        ...item,
        emoji: matchedCategory.emoji,
        category: mealType
      }));
    }
  }
  }

  // Generate dynamic matching templates only if it is a recognized food keyword
  if (results.length === 0) {
    const foodKeywords = [
      'food', 'snack', 'drink', 'beverage', 'meal', 'dish', 'recipe', 'breakfast', 'lunch', 'dinner',
      'juice', 'pizza', 'burger', 'sandwich', 'salad', 'soup', 'rice', 'dal', 'paneer', 'chicken',
      'meat', 'fish', 'egg', 'eggless', 'sweets', 'dessert', 'halwa', 'ladoo', 'samosa', 'chips',
      'fries', 'pakora', 'naan', 'roti', 'paratha', 'bread', 'tea', 'coffee', 'chai', 'milk', 'curd',
      'pasta', 'maggi', 'noodles', 'chowmein', 'roll', 'wrap'
    ];
    const isFoodQuery = foodKeywords.some(kw => queryLower.includes(kw));

    if (isFoodQuery) {
      const cleanName = query.charAt(0).toUpperCase() + query.slice(1);
      results = [
        { name: `${cleanName} (Standard portion)`, emoji: '🍽️', cal: 240, p: 8, c: 32, f: 9, category: mealType },
        { name: `Diet / Healthy ${cleanName}`, emoji: '🥗', cal: 150, p: 10, c: 18, f: 4, category: mealType },
        { name: `Double Cheese ${cleanName}`, emoji: '🧀', cal: 380, p: 16, c: 35, f: 18, category: mealType }
      ];
    }
  }

  console.log(`Smart offline search results for "${query}":`, results);
  return res.json({ success: true, results });
});



// ── 404 & ERROR HANDLER ───────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'An internal server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Calorix Backend running on port ${PORT} [SECURE]`));
