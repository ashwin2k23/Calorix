import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini API
let ai;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// User profile & goals
app.post('/api/goals', async (req, res) => {
  const { user_id, weight, height, age, goal_type, calorie_target } = req.body;
  try {
    const { data, error } = await supabase
      .from('goals')
      .upsert({ user_id, weight, height, age, goal_type, calorie_target }, { onConflict: 'user_id' })
      .select();
      
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Meals
app.post('/api/meals', async (req, res) => {
  const { user_id, food_name, calories, protein, carbs, fats, date } = req.body;
  try {
    const { data, error } = await supabase
      .from('meals')
      .insert([{ user_id, food_name, calories, protein, carbs, fats, date }])
      .select();
      
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/meals/:user_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', req.params.user_id)
      .order('date', { ascending: false });
      
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Diet Planner
app.post('/api/ai-diet', async (req, res) => {
  const { profile } = req.body;
  
  if (!ai) {
    // Fallback if no API key is provided
    return res.json({
      success: true,
      plan: {
        breakfast: 'Poha with peanuts and a glass of warm milk. (320 kcal)',
        lunch: '2 Rotis, Chana Masala, and Cucumber Raita. (480 kcal)',
        snack: 'Roasted Chana and green tea. (150 kcal)',
        dinner: 'Moong Dal Khichdi with a small serving of pickle. (350 kcal)',
        insight: `Since your goal is to ${profile?.goal || 'maintain weight'}, this balanced Indian diet ensures you get essential nutrients without overconsuming calories.`
      }
    });
  }

  try {
    const prompt = `Generate a full-day Indian diet plan for a person weighing ${profile?.weight || 75}kg with the goal to ${profile?.goal || 'maintain weight'}. 
    Return ONLY a raw JSON object with strictly these keys: "breakfast", "lunch", "snack", "dinner", "insight". 
    Provide healthy, traditional Indian food options with approximate calories. The insight should be a 1-sentence tip. Do not use markdown backticks.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(text);
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI diet plan' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
