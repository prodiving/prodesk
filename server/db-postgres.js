import pkg from 'pg';
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
        total_amount DECIMAL(10,2) DEFAULT 0,
        invoice_number TEXT UNIQUE,
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(diver_id) REFERENCES divers(id) ON DELETE CASCADE
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
