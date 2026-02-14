import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'db.sqlite');

export function getDb() {
  return new sqlite3.Database(dbPath);
}

export function initDb() {
  return new Promise((resolve, reject) => {
    const db = getDb();

    db.serialize(() => {
      // Divers table
      db.run(`
        CREATE TABLE IF NOT EXISTS divers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          certification_level TEXT,
          medical_cleared INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Groups table
      db.run(`
        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'fundive',
          leader_id TEXT,
          course_id TEXT,
          days INTEGER,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(leader_id) REFERENCES divers(id) ON DELETE SET NULL,
          FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL
        )
      `);

      // Group members table
      db.run(`
        CREATE TABLE IF NOT EXISTS group_members (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          diver_id TEXT NOT NULL,
          role TEXT,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
          FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE CASCADE,
          UNIQUE(group_id, diver_id)
        )
      `);

      // Courses table
      db.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL DEFAULT 0,
          duration_days INTEGER,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Accommodations table
      db.run(`
        CREATE TABLE IF NOT EXISTS accommodations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price_per_night REAL DEFAULT 0,
          tier TEXT DEFAULT 'standard',
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Bookings table
      db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          diver_id TEXT NOT NULL,
          course_id TEXT,
          accommodation_id TEXT,
          check_in TEXT,
          check_out TEXT,
          total_amount REAL DEFAULT 0,
          invoice_number TEXT UNIQUE,
          payment_status TEXT DEFAULT 'unpaid',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE CASCADE,
          FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,
          FOREIGN KEY(accommodation_id) REFERENCES accommodations(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    db.close();
  });
}
