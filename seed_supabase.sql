-- Seed divers
INSERT INTO divers (name, email) VALUES
('John Smith', 'john@example.com'),
('Sarah Johnson', 'sarah@example.com'),
('Mike Davis', 'mike@example.com'),
('Emily Brown', 'emily@example.com'),
('Alex Lee', 'alex@example.com');

-- Seed instructors  
INSERT INTO instructors (name, email, certification) VALUES
('Captain Tom', 'tom@example.com', 'Divemaster'),
('Lisa Chen', 'lisa@example.com', 'Instructor'),
('Marco Rossi', 'marco@example.com', 'Master Instructor');

-- Seed boats
INSERT INTO boats (name, capacity) VALUES
('Sea Explorer', 20),
('Ocean Wave', 15),
('Neptune''s Dream', 25);

-- Seed dive sites
INSERT INTO dive_sites (name, location, max_depth, difficulty) VALUES
('Blue Coral Gardens', 'North Bay', 25, 'easy'),
('The Wreck', 'Deep Channel', 35, 'moderate'),
('Shark Alley', 'East Point', 40, 'challenging'),
('Cathedral', 'South Ridge', 45, 'expert'),
('Turtle Cove', 'West Beach', 20, 'easy'),
('The Pinnacle', 'Central Banks', 30, 'moderate');
