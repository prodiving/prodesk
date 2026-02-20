#!/usr/bin/env node
import { runDb, initDb } from './db-adapter.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Initializing DB (Postgres) and running migrations...');
  await initDb();

  const divers = [
    { name: 'John Smith', email: 'john@example.com' },
    { name: 'Sarah Johnson', email: 'sarah@example.com' },
    { name: 'Mike Davis', email: 'mike@example.com' },
    { name: 'Emily Brown', email: 'emily@example.com' },
    { name: 'Alex Lee', email: 'alex@example.com' },
  ];

  for (const d of divers) {
    const id = uuidv4();
    try {
      await runDb('INSERT INTO divers (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING', [id, d.name, d.email]);
      console.log('Inserted diver', d.email);
    } catch (e) {
      console.error('Failed to insert diver', d.email, e.message || e);
    }
  }

  const instructors = [
    { name: 'Captain Tom', email: 'tom@example.com', certification: 'Divemaster' },
    { name: 'Lisa Chen', email: 'lisa@example.com', certification: 'Instructor' },
    { name: 'Marco Rossi', email: 'marco@example.com', certification: 'Master Instructor' },
  ];

  for (const inst of instructors) {
    const id = uuidv4();
    try {
      await runDb('INSERT INTO instructors (id, name, email, certification) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING', [id, inst.name, inst.email, inst.certification]);
      console.log('Inserted instructor', inst.email);
    } catch (e) {
      console.error('Failed to insert instructor', inst.email, e.message || e);
    }
  }

  const boats = [
    { name: 'Sea Explorer', capacity: 20 },
    { name: 'Ocean Wave', capacity: 15 },
    { name: "Neptune's Dream", capacity: 25 },
  ];

  for (const b of boats) {
    const id = uuidv4();
    try {
      await runDb('INSERT INTO boats (id, name, capacity) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', [id, b.name, b.capacity]);
      console.log('Inserted boat', b.name);
    } catch (e) {
      console.error('Failed to insert boat', b.name, e.message || e);
    }
  }

  const courses = [
    { name: 'Open Water Certification', price: 499 },
    { name: 'Advanced Open Water', price: 599 },
    { name: 'Rescue Diver', price: 699 },
    { name: 'Freediving Course', price: 299 },
  ];

  for (const c of courses) {
    const id = uuidv4();
    try {
      await runDb('INSERT INTO courses (id, name, price) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', [id, c.name, c.price]);
      console.log('Inserted course', c.name);
    } catch (e) {
      console.error('Failed to insert course', c.name, e.message || e);
    }
  }

  const diveSites = [
    { name: 'Blue Coral Gardens', location: 'North Bay', max_depth: 25, difficulty: 'easy' },
    { name: 'The Wreck', location: 'Deep Channel', max_depth: 35, difficulty: 'moderate' },
    { name: 'Shark Alley', location: 'East Point', max_depth: 40, difficulty: 'challenging' },
    { name: 'Cathedral', location: 'South Ridge', max_depth: 45, difficulty: 'expert' },
    { name: 'Turtle Cove', location: 'West Beach', max_depth: 20, difficulty: 'easy' },
    { name: 'The Pinnacle', location: 'Central Banks', max_depth: 30, difficulty: 'moderate' },
  ];

  for (const s of diveSites) {
    const id = uuidv4();
    try {
      await runDb('INSERT INTO dive_sites (id, name, location, max_depth, difficulty) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING', [id, s.name, s.location, s.max_depth, s.difficulty]);
      console.log('Inserted dive site', s.name);
    } catch (e) {
      console.error('Failed to insert dive site', s.name, e.message || e);
    }
  }

  console.log('Postgres seeding complete');
}

seed().catch((e) => {
  console.error('Seed failed', e.message || e);
  process.exit(1);
});
