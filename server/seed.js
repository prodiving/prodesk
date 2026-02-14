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
});

db.close(() => {
  console.log('Seeding complete!');
});
