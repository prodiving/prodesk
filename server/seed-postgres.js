import { v4 as uuidv4 } from 'uuid';
import { initPool } from './db-postgres.js';

async function run() {
  try {
    const pool = initPool();
    const client = await pool.connect();

    console.log('Seeding PostgreSQL...');

    // Divers
    const divers = [
      { name: 'John Smith', email: 'john@example.com' },
      { name: 'Sarah Johnson', email: 'sarah@example.com' },
      { name: 'Mike Davis', email: 'mike@example.com' },
      { name: 'Emily Brown', email: 'emily@example.com' },
      { name: 'Alex Lee', email: 'alex@example.com' },
    ];

    for (const d of divers) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO divers (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING`,
        [id, d.name, d.email]
      );
    }

    // Staff (instructors/divemasters/boat staff)
    const staff = [
      { name: 'Captain Jack', email: 'jack@diveshop.com', role: 'instructor' },
      { name: 'Maria Rodriguez', email: 'maria@diveshop.com', role: 'instructor' },
      { name: 'David Chen', email: 'david@diveshop.com', role: 'divemaster' },
      { name: 'Sarah Wilson', email: 'sarah@diveshop.com', role: 'divemaster' },
      { name: 'Mike Johnson', email: 'mike@diveshop.com', role: 'divemaster' },
      { name: 'Lisa Park', email: 'lisa@diveshop.com', role: 'boat_staff' },
      { name: 'Tom Anderson', email: 'tom@diveshop.com', role: 'boat_staff' },
      { name: 'Rachel Green', email: 'rachel@diveshop.com', role: 'boat_staff' },
    ];

    for (const s of staff) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO staff (id, name, email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        [id, s.name, s.email, s.role]
      );
    }

    // Boats
    const boats = [
      { name: 'Sea Explorer', capacity: 20 },
      { name: 'Ocean Wave', capacity: 15 },
      { name: "Neptune's Dream", capacity: 25 },
    ];

    for (const b of boats) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO boats (id, name, capacity) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [id, b.name, b.capacity]
      );
    }

    // Equipment (minimal)
    const equipment = [
      { name: 'Diving Mask', category: 'personal', quantity_in_stock: 50, quantity_available_for_rent: 50, rent_price_per_day: 5 },
      { name: 'Snorkel', category: 'personal', quantity_in_stock: 50, quantity_available_for_rent: 50, rent_price_per_day: 3 },
      { name: 'Fins (Pair)', category: 'personal', quantity_in_stock: 40, quantity_available_for_rent: 40, rent_price_per_day: 8 },
    ];

    for (const e of equipment) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO equipment (id, name, category, quantity_in_stock, quantity_available_for_rent, can_rent, rent_price_per_day) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (name) DO NOTHING`,
        [id, e.name, e.category, e.quantity_in_stock, e.quantity_available_for_rent, 1, e.rent_price_per_day]
      );
    }

    console.log('✅ Seed complete');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

run();
