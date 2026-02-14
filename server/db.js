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
          waiver_signed INTEGER DEFAULT 0,
          waiver_signed_date TEXT,
          onboarding_completed INTEGER DEFAULT 0,
          onboarding_date TEXT,
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

      // Instructors table
      db.run(`
        CREATE TABLE IF NOT EXISTS instructors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT,
          certification TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Boats table
      db.run(`
        CREATE TABLE IF NOT EXISTS boats (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          capacity INTEGER,
          location TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
          instructor_id TEXT,
          boat_id TEXT,
          start_date TEXT,
          end_date TEXT,
          max_students INTEGER DEFAULT 6,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(instructor_id) REFERENCES instructors(id) ON DELETE SET NULL,
          FOREIGN KEY(boat_id) REFERENCES boats(id) ON DELETE SET NULL
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
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE CASCADE,
          FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,
          FOREIGN KEY(accommodation_id) REFERENCES accommodations(id) ON DELETE SET NULL
        )
      `);

      // Waivers table
      db.run(`
        CREATE TABLE IF NOT EXISTS waivers (
          id TEXT PRIMARY KEY,
          diver_id TEXT NOT NULL,
          document_url TEXT,
          signature_data TEXT,
          signed_at DATETIME,
          status TEXT DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE CASCADE,
          UNIQUE(diver_id)
        )
      `);

      // Dive Sites table
      db.run(`
        CREATE TABLE IF NOT EXISTS dive_sites (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          max_depth REAL,
          difficulty TEXT,
          description TEXT,
          emergency_contacts TEXT,
          nearest_hospital TEXT,
          dan_info TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Group Dive Itinerary (plan which dive sites for each day of a group)
      db.run(`
        CREATE TABLE IF NOT EXISTS group_dive_itinerary (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL,
          day_number INTEGER NOT NULL,
          dive_site_id TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
          FOREIGN KEY(dive_site_id) REFERENCES dive_sites(id) ON DELETE SET NULL,
          UNIQUE(group_id, day_number)
        )
      `);

      // Equipment/Inventory table
      db.run(`
        CREATE TABLE IF NOT EXISTS equipment (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          sku TEXT UNIQUE,
          price REAL DEFAULT 0,
          can_buy INTEGER DEFAULT 1,
          can_rent INTEGER DEFAULT 1,
          rent_price_per_day REAL DEFAULT 0,
          quantity_in_stock INTEGER DEFAULT 0,
          quantity_available_for_rent INTEGER DEFAULT 0,
          reorder_level INTEGER DEFAULT 5,
          supplier TEXT,
          description TEXT,
          barcode TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Transactions/Sales table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          transaction_number TEXT UNIQUE NOT NULL,
          diver_id TEXT,
          booking_id TEXT,
          type TEXT NOT NULL,
          status TEXT DEFAULT 'completed',
          subtotal REAL DEFAULT 0,
          tax REAL DEFAULT 0,
          discount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE SET NULL,
          FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE SET NULL
        )
      `);

      // Transaction Items table (items in a sale)
      db.run(`
        CREATE TABLE IF NOT EXISTS transaction_items (
          id TEXT PRIMARY KEY,
          transaction_id TEXT NOT NULL,
          equipment_id TEXT NOT NULL,
          transaction_type TEXT DEFAULT 'buy',
          quantity INTEGER DEFAULT 1,
          rental_days INTEGER DEFAULT 0,
          unit_price REAL DEFAULT 0,
          subtotal REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
          FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
        )
      `);

      // Payments table
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          transaction_id TEXT NOT NULL,
          amount REAL NOT NULL,
          payment_method TEXT DEFAULT 'cash',
          payment_status TEXT DEFAULT 'completed',
          reference_number TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    db.close();
  });
}
