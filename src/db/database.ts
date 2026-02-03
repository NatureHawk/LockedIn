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
      muscleMass REAL,
      photos TEXT
    );
  `);

  // 🔁 Migration: add photos column if it doesn't exist
  try {
    await db.execAsync(`
      ALTER TABLE daily_logs ADD COLUMN photos TEXT;
    `);
  } catch (e) {
    // Column already exists → ignore
  }
}


export async function getAllLogs() {
  if (!db) await init();
  return db!.getAllAsync(
    "SELECT * FROM daily_logs ORDER BY date ASC"
  );
}

export async function insertLog(
  date: string,
  w: number,
  bf: number,
  mm: number,
  photos: string[] = []
) {
  if (!db) await init();
  await db!.runAsync(
    `INSERT OR REPLACE INTO daily_logs
     (date, weight, bodyFat, muscleMass, photos)
     VALUES (?, ?, ?, ?, ?)`,
    [date, w, bf, mm, JSON.stringify(photos)]
  );
}

/**
 * rows MUST be sorted ASC by date (oldest → newest)
 */
export function calculateStreak(rows: { date: string }[]) {
  if (rows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  for (let i = rows.length - 1; i >= 0; i--) {
    const [y, m, d] = rows[i].date.split("-").map(Number);
    const logged = new Date(y, m - 1, d);

    if (logged.getTime() === cursor.getTime()) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      const yesterday = new Date(cursor);
      yesterday.setDate(cursor.getDate() - 1);

      if (logged.getTime() === yesterday.getTime()) {
        streak = 1;
        cursor.setDate(cursor.getDate() - 2);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}
export type DayState =
  | "locked_today"
  | "on_streak"
  | "missed_yesterday"
  | "no_logs_yet";

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDayState(rows: { date: string }[]): DayState {
  if (rows.length === 0) return "no_logs_yet";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dates = rows.map(r => r.date);
  const todayStr = fmtLocal(today);
  const yesterdayStr = fmtLocal(yesterday);

  if (dates.includes(todayStr)) {
    return "locked_today";
  }

  if (dates.includes(yesterdayStr)) {
    return "on_streak";
  }

  return "missed_yesterday";
}
