import * as SQLite from "expo-sqlite";

// --- TYPES ---
export type WorkoutSet = {
  weight: number;
  reps: number;
};

export type WorkoutLog = {
  id: number;
  date: string;
  exercise: string;
  sets: WorkoutSet[];
};

export type DayState =
  | "no_logs_yet"
  | "locked_today"
  | "on_streak"
  | "missed_yesterday";

// --- INIT ---
export async function init() {
  try {
    console.log("...Starting Database Init...");
    const db = await SQLite.openDatabaseAsync("lockedin.db");

    // 1. Daily Logs
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        date TEXT PRIMARY KEY NOT NULL,
        weight REAL,
        bodyFat REAL,
        muscleMass REAL,
        photos TEXT
      );
    `);

    // 2. Settings
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);

    // 3. Workouts
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        exercise TEXT NOT NULL,
        sets TEXT NOT NULL
      );
    `);

    console.log("✅ Database Initialized Successfully");
    return true;
  } catch (e) {
    console.error("❌ Database Init Failed:", e);
    return false;
  }
}

// --- DAILY LOGS FUNCTIONS ---

export async function insertLog(
  date: string,
  weight: number,
  bodyFat: number,
  muscleMass: number,
  photos: string[]
) {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  const safeDate = date || new Date().toISOString().split("T")[0];
  const safePhotos = JSON.stringify(photos || []);
  
  await db.runAsync(
    "INSERT OR REPLACE INTO daily_logs (date, weight, bodyFat, muscleMass, photos) VALUES (?, ?, ?, ?, ?)",
    [safeDate, weight || 0, bodyFat || 0, muscleMass || 0, safePhotos]
  );
}

export async function updateLog(
  date: string,
  weight: number,
  bodyFat: number,
  muscleMass: number,
  photos: string[]
) {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  const safeDate = date || "";
  const safePhotos = JSON.stringify(photos || []);

  await db.runAsync(
    `UPDATE daily_logs
     SET weight = ?, bodyFat = ?, muscleMass = ?, photos = ?
     WHERE date = ?`,
    [weight || 0, bodyFat || 0, muscleMass || 0, safePhotos, safeDate]
  );
}

export async function getAllLogs() {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  // 🛡️ Safety: Pass empty array [] for params
  const allRows = await db.getAllAsync("SELECT * FROM daily_logs", []);
  return allRows;
}

export async function deleteLog(date: string) {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  await db.runAsync("DELETE FROM daily_logs WHERE date = ?", [date || ""]);
}

// --- WORKOUT FUNCTIONS ---

export async function addWorkout(date: string, exercise: string, sets: WorkoutSet[]) {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  
  const safeDate = date || new Date().toISOString().split("T")[0];
  const safeExercise = exercise || "Unknown Exercise";
  const safeSets = JSON.stringify(sets || []);

  await db.runAsync(
    "INSERT INTO workouts (date, exercise, sets) VALUES (?, ?, ?)",
    [safeDate, safeExercise, safeSets]
  );
}

export async function getWorkouts(date: string): Promise<WorkoutLog[]> {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  const safeDate = date || "";

  // 🛡️ Safety: Ensure safeDate is not null
  const rows: any[] = await db.getAllAsync(
    "SELECT * FROM workouts WHERE date = ?",
    [safeDate]
  );
  
  return rows.map(row => ({
    ...row,
    sets: row.sets ? JSON.parse(row.sets) : []
  }));
}

export async function getAllWorkoutsArray() {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  // 🛡️ Safety: Pass empty array
  const rows: any[] = await db.getAllAsync("SELECT * FROM workouts ORDER BY date ASC", []);
  
  return rows.map(row => ({
    ...row,
    sets: row.sets ? JSON.parse(row.sets) : []
  }));
}

export async function getUniqueExercises(): Promise<string[]> {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  // 🛡️ Safety: Pass empty array
  const rows: any[] = await db.getAllAsync("SELECT DISTINCT exercise FROM workouts", []);
  return rows.map(r => r.exercise).filter(e => e); 
}

export async function updateWorkout(id: number, sets: WorkoutSet[]) {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  const safeSets = JSON.stringify(sets || []);
  await db.runAsync(
    "UPDATE workouts SET sets = ? WHERE id = ?",
    [safeSets, id]
  );
}

export async function deleteWorkout(id: number) {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  await db.runAsync("DELETE FROM workouts WHERE id = ?", [id]);
}

// --- SETTINGS FUNCTIONS ---

export async function saveSetting(key: string, value: string) {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key || "", value || ""]
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await SQLite.openDatabaseAsync("lockedin.db");
  const result: any = await db.getFirstAsync(
    `SELECT value FROM settings WHERE key = ?`,
    [key || ""]
  );
  return result ? result.value : null;
}

// --- UTILS ---

export function calculateStreak(logs: any[]) {
  if (!logs || logs.length === 0) return 0;

  const sorted = logs
    .map((l) => l.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  if (sorted[0] !== today && sorted[0] !== yStr) {
    return 0;
  }

  let streak = 1;
  let current = new Date(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    const prevStr = prev.toISOString().split("T")[0];

    if (sorted[i] === prevStr) {
      streak++;
      current = prev;
    } else {
      break;
    }
  }
  return streak;
}

export function getDayState(logs: any[]): DayState {
  const today = new Date().toISOString().split("T")[0];
  const hasToday = logs.some((l) => l.date === today);

  if (hasToday) return "locked_today";

  const streak = calculateStreak(logs);
  if (streak > 0) return "on_streak";

  if (logs.length > 0) return "missed_yesterday";

  return "no_logs_yet";
}