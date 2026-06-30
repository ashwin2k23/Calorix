/**
 * Calorix TSV Importer — OpenFoodFacts dataset
 * Usage: node import-tsv.js
 * Place dataset.tsv in the same directory (server/) before running.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const TSV_FILE  = 'dataset.tsv';
const DB_FILE   = 'calorix.db';

// ── EXACT column indices (OpenFoodFacts en.openfoodfacts.org/data) ─────────
const COL_NAME      = 7;   // product_name
const COL_SERVING   = 40;  // serving_size
const COL_CATEGORY  = 54;  // pnns_groups_1
const COL_ENERGY    = 63;  // energy_100g  (kJ — divide by 4.184 → kcal)
const COL_FAT       = 65;  // fat_100g
const COL_CARBS     = 101; // carbohydrates_100g
const COL_PROTEIN   = 112; // proteins_100g

const BATCH_SIZE = 5000; // commit every N rows for progress + safety

function getEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('pizza'))                           return '🍕';
  if (n.includes('burger') || n.includes('sandwich')) return '🍔';
  if (n.includes('juice') || n.includes('drink'))    return '🥤';
  if (n.includes('fries') || n.includes('chips'))    return '🍟';
  if (n.includes('salad'))                           return '🥗';
  if (n.includes('soup'))                            return '🥣';
  if (n.includes('rice') || n.includes('biryani'))   return '🍛';
  if (n.includes('chicken') || n.includes('kebab'))  return '🍗';
  if (n.includes('egg'))                             return '🍳';
  if (n.includes('pasta') || n.includes('noodles'))  return '🍝';
  if (n.includes('chocolate') || n.includes('cake')) return '🍰';
  if (n.includes('milk') || n.includes('yogurt') || n.includes('yoghurt')) return '🥛';
  if (n.includes('bread') || n.includes('roti') || n.includes('naan'))     return '🫓';
  if (n.includes('apple'))  return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('orange')) return '🍊';
  if (n.includes('mango'))  return '🥭';
  if (n.includes('coffee') || n.includes('latte') || n.includes('cappuccino')) return '☕';
  if (n.includes('tea') || n.includes('chai')) return '🍵';
  return '🍽️';
}

async function run() {
  const filePath = path.join(process.cwd(), TSV_FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`\n❌  File not found: ${filePath}`);
    console.log(`    Place your Kaggle TSV file as "${TSV_FILE}" inside the server/ folder.\n`);
    process.exit(1);
  }

  const db = await open({ filename: path.join(process.cwd(), DB_FILE), driver: sqlite3.Database });

  // Enable WAL for faster writes
  await db.exec('PRAGMA journal_mode=WAL;');
  await db.exec('PRAGMA synchronous=NORMAL;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS global_foods (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      name_lower  TEXT    NOT NULL,
      serving_size TEXT,
      calories    REAL,
      protein     REAL,
      carbs       REAL,
      fat         REAL,
      category    TEXT,
      emoji       TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name_lower)
    )
  `);

  // Full-text index for instant partial-match search
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_global_foods_name ON global_foods(name_lower);
  `);

  const stmt = await db.prepare(`
    INSERT OR IGNORE INTO global_foods
      (name, name_lower, serving_size, calories, protein, carbs, fat, category, emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let lineNum       = 0;
  let imported      = 0;
  let skipped       = 0;
  let batchCount    = 0;

  await db.exec('BEGIN TRANSACTION');

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue; // skip header

    if (lineNum % 10000 === 0) {
      process.stdout.write(`\r🔄  ${lineNum.toLocaleString()} lines read  |  ✅ ${imported.toLocaleString()} imported  |  ⏭  ${skipped.toLocaleString()} skipped`);
    }

    const cols = line.split('\t');

    const name    = cols[COL_NAME]?.trim();
    if (!name || name.length < 2) { skipped++; continue; }

    const nameLower = name.toLowerCase();

    const serving   = cols[COL_SERVING]?.trim() || null;
    const catRaw    = cols[COL_CATEGORY]?.trim() || null;
    const category  = catRaw && catRaw !== '' ? catRaw : null;

    const energyKJ  = parseFloat(cols[COL_ENERGY]);
    const calories  = isFinite(energyKJ) && energyKJ > 0 ? Math.round(energyKJ / 4.184) : null;
    const fat       = parseFloat(cols[COL_FAT]);
    const carbs     = parseFloat(cols[COL_CARBS]);
    const protein   = parseFloat(cols[COL_PROTEIN]);

    // Skip rows with no useful nutrition
    if (!calories && !isFinite(fat) && !isFinite(carbs) && !isFinite(protein)) { skipped++; continue; }

    const emoji = getEmoji(name);

    try {
      await stmt.run(
        name,
        nameLower,
        serving,
        calories ?? null,
        isFinite(protein) ? Math.round(protein * 10) / 10 : null,
        isFinite(carbs)   ? Math.round(carbs * 10) / 10   : null,
        isFinite(fat)     ? Math.round(fat * 10) / 10     : null,
        category,
        emoji,
      );
      imported++;
      batchCount++;
    } catch { skipped++; }

    if (batchCount >= BATCH_SIZE) {
      await db.exec('COMMIT');
      await db.exec('BEGIN TRANSACTION');
      batchCount = 0;
    }
  }

  await db.exec('COMMIT');
  await stmt.finalize();

  console.log(`\n\n🎉  Import complete!`);
  console.log(`    Lines processed : ${lineNum.toLocaleString()}`);
  console.log(`    Imported        : ${imported.toLocaleString()}`);
  console.log(`    Skipped         : ${skipped.toLocaleString()}`);
  console.log(`\n💡  Search these foods in the app using the "Google Web Search Mode" toggle.\n`);
}

run().catch(err => { console.error('\n❌  Import failed:', err); process.exit(1); });
