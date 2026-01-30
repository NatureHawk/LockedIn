// src/db/database.ts
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";

let db: SQLiteDatabase | null = null;

export async function init() {
  if (db) return;

  db = await openDatabaseAsync("lockedin.db");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      date TEXT PRIMARY KEY NOT NULL,
      weight REAL,
      bodyFat REAL,
      muscleMass REAL
    );
  `);
}


export async function getAllLogs() {
  if (!db) throw new Error("DB not initialized");
  return await db.getAllAsync("SELECT * FROM daily_logs ORDER BY date DESC");
}

export async function insertLog(date: string, w: number, bf: number, mm: number) {
  if (!db) throw new Error("DB not initialized");
  await db.runAsync(
    "INSERT OR REPLACE INTO daily_logs (date, weight, bodyFat, muscleMass) VALUES (?, ?, ?, ?)",
    [date, w, bf, mm]
  );
}
export function calculateStreak(rows: any[]) {
  if (rows.length === 0) return 0;

  const dates = rows
    .map(r => r.date)
    .sort((a, b) => (a < b ? 1 : -1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let current = new Date(today);

  for (let d of dates) {
    const logged = new Date(d);
    logged.setHours(0, 0, 0, 0);

    if (logged.getTime() === current.getTime()) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else if (
      streak === 0 &&
      logged.getTime() === current.getTime() - 86400000
    ) {
      // allow starting from yesterday
      streak++;
      current.setDate(current.getDate() - 2);
    } else {
      break;
    }
  }

  return streak;
}
