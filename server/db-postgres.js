import pkg from 'pg';
import { v4 as uuidv4 } from 'uuid';
const { Client, Pool } = pkg;

let pool = null;

export function initPool() {
  if (pool) return pool;
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
  }
  
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for Railway
  });
  
  return pool;
}

// No synchronous `getDb()` for Postgres; db-adapter will provide a compatibility wrapper.

export function getDbConnection() {
  return initPool();
}

export async function initDb() {
  const pool = initPool();
  const client = await pool.connect();

  try {
    // Run all migration queries
    const createTableQueries = [
      // Divers table
      `CREATE TABLE IF NOT EXISTS divers (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Equipment table
      `CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        sku TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        can_buy INTEGER DEFAULT 1,
        can_rent INTEGER DEFAULT 1,
        rent_price_per_day DECIMAL(10,2) DEFAULT 0,
        quantity_in_stock INTEGER DEFAULT 0,
        quantity_available_for_rent INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 5,
        supplier TEXT,
        description TEXT,
        barcode TEXT,
        status TEXT DEFAULT 'available',
        maintenance_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        diver_id TEXT NOT NULL,
        course_id TEXT,
        group_id TEXT,
        accommodation_id TEXT,
        check_in TEXT,
        check_out TEXT,
        size TEXT,
        weight TEXT,
        height TEXT,
        agent_id TEXT,
        divemaster_id TEXT,
        boat_staff_id TEXT,
        total_amount DECIMAL(10,2) DEFAULT 0,
        invoice_number TEXT UNIQUE,
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE CASCADE,
        FOREIGN KEY(divemaster_id) REFERENCES staff(id) ON DELETE SET NULL,
        FOREIGN KEY(boat_staff_id) REFERENCES staff(id) ON DELETE SET NULL
      )`,

      // Rental assignments table
      `CREATE TABLE IF NOT EXISTS rental_assignments (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        equipment_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        check_in TEXT,
        check_out TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
      )`,

      // Courses table
      `CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(10,2),
        description TEXT,
        duration_days INTEGER,
        start_date TEXT,
        end_date TEXT,
        max_students INTEGER DEFAULT 6,
        instructor_id TEXT,
        boat_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Groups table
      `CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'fundive',
        leader_id TEXT,
        course_id TEXT,
        days INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Instructors table
      `CREATE TABLE IF NOT EXISTS instructors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        certification TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Staff table (consolidated for instructors, dive masters, boat staff)
      `CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        role TEXT NOT NULL,
        certification TEXT,
        specialties TEXT,
        certifications_valid_until TEXT,
        availability TEXT DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Boats table
      `CREATE TABLE IF NOT EXISTS boats (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        capacity INTEGER,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Accommodations table
      `CREATE TABLE IF NOT EXISTS accommodations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_per_night DECIMAL(10,2) DEFAULT 0,
        tier TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Dive sites table
      `CREATE TABLE IF NOT EXISTS dive_sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        max_depth INTEGER,
        difficulty TEXT,
        description TEXT,
        emergency_contacts TEXT,
        nearest_hospital TEXT,
        dan_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Trip assignments table
      `CREATE TABLE IF NOT EXISTS trip_assignments (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        diver_id TEXT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        transaction_number TEXT UNIQUE,
        diver_id TEXT,
        booking_id TEXT,
        type TEXT,
        status TEXT DEFAULT 'completed',
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Waivers table
      `CREATE TABLE IF NOT EXISTS waivers (
        id TEXT PRIMARY KEY,
        diver_id TEXT NOT NULL,
        document_url TEXT,
        signature_data TEXT,
        status TEXT DEFAULT 'pending',
        signed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE CASCADE
      )`,

      // Trips table
      `CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'regular',
        start_at TIMESTAMP,
        dive_site_id TEXT,
        boat_id TEXT,
        captain_id TEXT,
        number_of_dives INTEGER DEFAULT 1,
        boat_staff TEXT,
        products TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Schedules table
      `CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        departure_time TEXT,
        departure_location TEXT,
        boat_id TEXT,
        number_of_dives INTEGER DEFAULT 1,
        start_date TEXT,
        end_date TEXT,
        days_ahead INTEGER DEFAULT 30,
        days_of_week TEXT,
        dive_sites TEXT,
        products TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Maintenance records table
      `CREATE TABLE IF NOT EXISTS maintenance_records (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        reported_by TEXT,
        assigned_to TEXT,
        issue_description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY(reported_by) REFERENCES divers(id) ON DELETE SET NULL,
        FOREIGN KEY(assigned_to) REFERENCES divers(id) ON DELETE SET NULL
      )`,

      // Problem reports table
      `CREATE TABLE IF NOT EXISTS problem_reports (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        reported_by TEXT NOT NULL,
        assigned_to TEXT,
        problem_description TEXT NOT NULL,
        severity TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        resolution_notes TEXT,
        reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY(reported_by) REFERENCES divers(id) ON DELETE SET NULL,
        FOREIGN KEY(assigned_to) REFERENCES divers(id) ON DELETE SET NULL
      )`
    ];

    for (const query of createTableQueries) {
      try {
        await client.query(query);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    console.log('✅ PostgreSQL database initialized');

    // Auto-seed data for PostgreSQL if tables are empty (helps Railway deployments)
    // Temporarily disabled for debugging
    /*
    try {
      const countRes = await client.query('SELECT COUNT(*)::int as count FROM divers');
      const count = (countRes && countRes.rows && countRes.rows[0]) ? countRes.rows[0].count : 0;
      if (count === 0) {
        console.log('📊 PostgreSQL database is empty, auto-seeding with initial data...');

        const divers = [
          { name: 'John Smith', email: 'john@example.com' },
          { name: 'Sarah Johnson', email: 'sarah@example.com' },
          { name: 'Mike Davis', email: 'mike@example.com' },
          { name: 'Emily Brown', email: 'emily@example.com' },
          { name: 'Alex Lee', email: 'alex@example.com' },
        ];

        const equipment = [
          { name: 'Diving Mask', category: 'personal', quantity_in_stock: 50, quantity_available_for_rent: 50, can_rent: 1, rent_price_per_day: 5 },
          { name: 'Snorkel', category: 'personal', quantity_in_stock: 50, quantity_available_for_rent: 50, can_rent: 1, rent_price_per_day: 3 },
          { name: 'Fins (Pair)', category: 'personal', quantity_in_stock: 40, quantity_available_for_rent: 40, can_rent: 1, rent_price_per_day: 8 },
          { name: 'Wetsuit 3mm', category: 'personal', quantity_in_stock: 30, quantity_available_for_rent: 30, can_rent: 1, rent_price_per_day: 10 },
          { name: 'Wetsuit 5mm', category: 'personal', quantity_in_stock: 25, quantity_available_for_rent: 25, can_rent: 1, rent_price_per_day: 12 },
          { name: 'Diving Tank (AL80)', category: 'equipment', quantity_in_stock: 20, quantity_available_for_rent: 20, can_rent: 1, rent_price_per_day: 15 },
          { name: 'BCD (Buoyancy)', category: 'equipment', quantity_in_stock: 20, quantity_available_for_rent: 20, can_rent: 1, rent_price_per_day: 20 },
          { name: 'Regulator Set', category: 'equipment', quantity_in_stock: 15, quantity_available_for_rent: 15, can_rent: 1, rent_price_per_day: 25 },
        ];

        for (const d of divers) {
          const id = uuidv4();
          await client.query('INSERT INTO divers (id, name, email) VALUES ($1, $2, $3)', [id, d.name, d.email]);
        }

        for (const e of equipment) {
          const id = uuidv4();
          await client.query(
            'INSERT INTO equipment (id, name, category, quantity_in_stock, quantity_available_for_rent, can_rent, rent_price_per_day) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, e.name, e.category, e.quantity_in_stock, e.quantity_available_for_rent, e.can_rent, e.rent_price_per_day]
          );
        }

        console.log('✅ PostgreSQL seeding complete');
      }
    } catch (seedErr) {
      console.error('❌ PostgreSQL seeding failed:', seedErr);
    }
    */
  } finally {
    client.release();
  }
}

export async function queryDb(query, params = []) {
  const pool = initPool();
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

export async function getDbRow(query, params = []) {
  const results = await queryDb(query, params);
  return results[0] || null;
}

export async function runDb(query, params = []) {
  const pool = initPool();
  try {
    await pool.query(query, params);
  } catch (err) {
    console.error('Database run error:', err);
    throw err;
  }
}

export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
