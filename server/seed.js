import { initDb, getDb } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const divers = [
  { name: 'John Smith', email: 'john@example.com' },
  { name: 'Sarah Johnson', email: 'sarah@example.com' },
  { name: 'Mike Davis', email: 'mike@example.com' },
  { name: 'Emily Brown', email: 'emily@example.com' },
  { name: 'Alex Lee', email: 'alex@example.com' },
];

const instructors = [
  { name: 'Captain Tom', email: 'tom@example.com', certification: 'Divemaster' },
  { name: 'Lisa Chen', email: 'lisa@example.com', certification: 'Instructor' },
  { name: 'Marco Rossi', email: 'marco@example.com', certification: 'Master Instructor' },
];

const boats = [
  { name: 'Sea Explorer', capacity: 20 },
  { name: 'Ocean Wave', capacity: 15 },
  { name: 'Neptune\'s Dream', capacity: 25 },
];

const courses = [
  { name: 'Open Water Certification', price: 499 },
  { name: 'Advanced Open Water', price: 599 },
  { name: 'Rescue Diver', price: 699 },
  { name: 'Freediving Course', price: 299 },
];

const accommodations = [
  { name: 'Budget Dorm', price_per_night: 25, tier: 'budget' },
  { name: 'Standard Room', price_per_night: 75, tier: 'standard' },
  { name: 'Deluxe Suite', price_per_night: 150, tier: 'deluxe' },
  { name: 'Free with Course', price_per_night: 0, tier: 'free_with_course' },
];

const diveSites = [
  { name: 'Blue Coral Gardens', location: 'North Bay', max_depth: 25, difficulty: 'easy' },
  { name: 'The Wreck', location: 'Deep Channel', max_depth: 35, difficulty: 'moderate' },
  { name: 'Shark Alley', location: 'East Point', max_depth: 40, difficulty: 'challenging' },
  { name: 'Cathedral', location: 'South Ridge', max_depth: 45, difficulty: 'expert' },
  { name: 'Turtle Cove', location: 'West Beach', max_depth: 20, difficulty: 'easy' },
  { name: 'The Pinnacle', location: 'Central Banks', max_depth: 30, difficulty: 'moderate' },
];

const equipment = [
  { name: 'Diving Mask', category: 'masks', sku: 'MASK-001', price: 45, rent_price_per_day: 5, quantity_in_stock: 25, quantity_available_for_rent: 25, reorder_level: 5 },
  { name: 'Snorkel', category: 'snorkels', sku: 'SNOR-001', price: 25, rent_price_per_day: 3, quantity_in_stock: 30, quantity_available_for_rent: 30, reorder_level: 5 },
  { name: 'Fins (Pair)', category: 'fins', sku: 'FIN-001', price: 65, rent_price_per_day: 8, quantity_in_stock: 20, quantity_available_for_rent: 20, reorder_level: 5 },
  { name: 'Wetsuit 3mm', category: 'wetsuits', sku: 'WET-3MM', price: 120, rent_price_per_day: 15, quantity_in_stock: 15, quantity_available_for_rent: 15, reorder_level: 3 },
  { name: 'Wetsuit 5mm', category: 'wetsuits', sku: 'WET-5MM', price: 150, rent_price_per_day: 18, quantity_in_stock: 10, quantity_available_for_rent: 10, reorder_level: 3 },
  { name: 'Diving Tank (AL80)', category: 'tanks', sku: 'TANK-AL80', price: 199, rent_price_per_day: 25, quantity_in_stock: 8, quantity_available_for_rent: 8, reorder_level: 2 },
  { name: 'BCD (Buoyancy)', category: 'bcds', sku: 'BCD-001', price: 349, rent_price_per_day: 35, quantity_in_stock: 6, quantity_available_for_rent: 6, reorder_level: 2 },
  { name: 'Regulator Set', category: 'regs', sku: 'REG-001', price: 399, rent_price_per_day: 40, quantity_in_stock: 5, quantity_available_for_rent: 5, reorder_level: 2 },
  { name: 'Weight Belt', category: 'weights', sku: 'BELT-001', price: 35, rent_price_per_day: 5, quantity_in_stock: 12, quantity_available_for_rent: 12, reorder_level: 5 },
  { name: 'Diving Computer', category: 'computers', sku: 'COMP-001', price: 299, rent_price_per_day: 30, quantity_in_stock: 4, quantity_available_for_rent: 4, reorder_level: 1 },
  { name: 'Underwater Torch', category: 'lights', sku: 'TORCH-001', price: 89, rent_price_per_day: 10, quantity_in_stock: 8, quantity_available_for_rent: 8, reorder_level: 2 },
  { name: 'Dive Log Book', category: 'books', sku: 'LOG-001', price: 15, rent_price_per_day: 0, quantity_in_stock: 40, quantity_available_for_rent: 0, reorder_level: 10 },
];


console.log('Initializing database...');
await initDb();

console.log('Seeding data...');

const db = getDb();

db.serialize(() => {
  // Seed divers
  divers.forEach((diver) => {
    db.run(
      'INSERT OR IGNORE INTO divers (id, name, email) VALUES (?, ?, ?)',
      [uuidv4(), diver.name, diver.email],
      (err) => {
        if (!err) console.log(`Added diver: ${diver.name}`);
      }
    );
  });

  // Seed instructors
  instructors.forEach((instructor) => {
    db.run(
      'INSERT OR IGNORE INTO instructors (id, name, email, certification) VALUES (?, ?, ?, ?)',
      [uuidv4(), instructor.name, instructor.email, instructor.certification],
      (err) => {
        if (!err) console.log(`Added instructor: ${instructor.name}`);
      }
    );
  });

  // Seed boats
  boats.forEach((boat) => {
    db.run(
      'INSERT OR IGNORE INTO boats (id, name, capacity) VALUES (?, ?, ?)',
      [uuidv4(), boat.name, boat.capacity],
      (err) => {
        if (!err) console.log(`Added boat: ${boat.name}`);
      }
    );
  });

  // Seed courses
  courses.forEach((course) => {
    db.run(
      'INSERT OR IGNORE INTO courses (id, name, price) VALUES (?, ?, ?)',
      [uuidv4(), course.name, course.price],
      (err) => {
        if (!err) console.log(`Added course: ${course.name}`);
      }
    );
  });

  // Seed accommodations
  accommodations.forEach((acc) => {
    db.run(
      'INSERT OR IGNORE INTO accommodations (id, name, price_per_night, tier) VALUES (?, ?, ?, ?)',
      [uuidv4(), acc.name, acc.price_per_night, acc.tier],
      (err) => {
        if (!err) console.log(`Added accommodation: ${acc.name}`);
      }
    );
  });

  // Seed dive sites
  diveSites.forEach((site) => {
    db.run(
      'INSERT OR IGNORE INTO dive_sites (id, name, location, max_depth, difficulty) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), site.name, site.location, site.max_depth, site.difficulty],
      (err) => {
        if (!err) console.log(`Added dive site: ${site.name}`);
      }
    );
  });

  // Seed equipment
  equipment.forEach((item) => {
    db.run(
      'INSERT OR IGNORE INTO equipment (id, name, category, sku, price, can_buy, can_rent, rent_price_per_day, quantity_in_stock, quantity_available_for_rent, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), item.name, item.category, item.sku, item.price, 1, item.rent_price_per_day > 0 ? 1 : 0, item.rent_price_per_day, item.quantity_in_stock, item.quantity_available_for_rent, item.reorder_level],
      (err) => {
        if (!err) console.log(`Added equipment: ${item.name}`);
      }
    );
  });
});

db.close(() => {
  console.log('Seeding complete!');
});
