import express from 'express';
import path from 'path';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import * as dbAdapter from './db-adapter.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', '127.0.0.1:5173', 'https://main.dc9vnrm1vnw2f.amplifyapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Authorization'],
}));
app.use(express.json());

// Serve static frontend if present (production single-service setup)
const distPath = path.resolve(process.cwd(), '..', 'dist');
try {
  app.use(express.static(distPath));
  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });
  console.log('📦 Static frontend serving enabled from', distPath);
} catch (e) {
  // ignore if dist not present during local dev
}

// Initialize database
await dbAdapter.initDb();

// Auto-seed database if empty (ensures Railway has data on startup)
const db = dbAdapter.getDb();
if (db && db.get) {
  // SQLite callback-based
  db.get('SELECT COUNT(*) as count FROM divers', (err, result) => {
    if (!err && result && result.count === 0) {
      console.log('📊 Database is empty, auto-seeding with initial data...');
      seedDatabase();
    }
    db.close();
  });
} else {
  // PostgreSQL async-based (seeding handled separately)
  console.log('✅ Using PostgreSQL - run migrations separately');
}

async function seedDatabase() {
  try {
    const db = dbAdapter.getDb();
    
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
    
    // Seed divers
    for (const diver of divers) {
      const diverId = uuidv4();
      db.run('INSERT INTO divers (id, name, email) VALUES (?, ?, ?)', [diverId, diver.name, diver.email]);
    }
    
    // Seed equipment
    for (const item of equipment) {
      const eqId = uuidv4();
      db.run(
        'INSERT INTO equipment (id, name, category, quantity_in_stock, quantity_available_for_rent, can_rent, rent_price_per_day) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [eqId, item.name, item.category, item.quantity_in_stock, item.quantity_available_for_rent, item.can_rent, item.rent_price_per_day]
      );
    }
    
    db.close();
    console.log('✅ Database seeding complete');
  } catch (err) {
    console.error('❌ Database seeding failed:', err);
  }
}

// Simple auth middleware (for now, accepts any request with a user-id header)
function authMiddleware(req, res, next) {
  // Use client IP as userId for IP-based "login"
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  req.userId = clientIP.replace(/\./g, '-').replace(/:/g, '-'); // Normalize for use as ID
  next();
}

app.use(authMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// GET /api/groups - list all groups with leader and members
app.get('/api/groups', (req, res) => {
  const db = dbAdapter.getDb();

  db.all(`
    SELECT id, name, type, leader_id, course_id, days, description, created_at FROM groups ORDER BY created_at DESC
  `, (err, groups) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }

    // Fetch leader, course, and members for each group
    let processed = 0;
    const result = groups.map(g => ({ ...g, leader: null, course: null, members: [] }));

    if (groups.length === 0) {
      db.close();
      return res.json(result);
    }

    groups.forEach((group, i) => {
      // Fetch leader
      if (group.leader_id) {
        db.get('SELECT id, name FROM divers WHERE id = ?', [group.leader_id], (err, leader) => {
          if (!err && leader) result[i].leader = leader;
          processed++;
          if (processed === groups.length * 3) {
            db.close();
            res.json(result);
          }
        });
      } else {
        processed++;
      }

      // Fetch course
      if (group.course_id) {
        db.get('SELECT id, name, price FROM courses WHERE id = ?', [group.course_id], (err, course) => {
          if (!err && course) result[i].course = course;
          processed++;
          if (processed === groups.length * 3) {
            db.close();
            res.json(result);
          }
        });
      } else {
        processed++;
      }

      // Fetch members with diver info
      db.all(`
        SELECT gm.id, gm.role, d.id as diver_id, d.name
        FROM group_members gm
        JOIN divers d ON gm.diver_id = d.id
        WHERE gm.group_id = ?
      `, [group.id], (err, members) => {
        if (!err && members) {
          result[i].members = members.map(m => ({
            id: m.id,
            role: m.role,
            diver: { id: m.diver_id, name: m.name }
          }));
        }
        processed++;
        if (processed === groups.length * 3) {
          db.close();
          res.json(result);
        }
      });
    });
  });
});

// POST /api/groups - create a group
app.post('/api/groups', (req, res) => {
  const { name, type, leader_id, course_id, days, description } = req.body;
  const id = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    'INSERT INTO groups (id, name, type, leader_id, course_id, days, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, type || 'fundive', leader_id || null, course_id || null, days || null, description || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      // Fetch and return the created group
      db.get('SELECT id, name, type, leader_id, course_id, days, description, created_at FROM groups WHERE id = ?', [id], (err, group) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          id: group.id, 
          name: group.name, 
          type: group.type,
          leader_id: group.leader_id, 
          course_id: group.course_id,
          days: group.days,
          description: group.description, 
          created_at: group.created_at, 
          leader: null, 
          course: null,
          members: [] 
        });
      });
    }
  );
});

// POST /api/groups/:groupId/members - add a member
app.post('/api/groups/:groupId/members', (req, res) => {
  const { diver_id, role } = req.body;
  const { groupId } = req.params;
  const id = uuidv4();

  if (!diver_id) {
    return res.status(400).json({ error: 'diver_id is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    'INSERT INTO group_members (id, group_id, diver_id, role) VALUES (?, ?, ?, ?)',
    [id, groupId, diver_id, role || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      // Fetch and return the created member
      db.get(`
        SELECT gm.id, gm.role, d.id as diver_id, d.name
        FROM group_members gm
        JOIN divers d ON gm.diver_id = d.id
        WHERE gm.id = ?
      `, [id], (err, member) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          id: member.id,
          role: member.role,
          diver: { id: member.diver_id, name: member.name }
        });
      });
    }
  );
});

// DELETE /api/groups/:groupId/members/:memberId - remove a member
app.delete('/api/groups/:groupId/members/:memberId', (req, res) => {
  const { memberId } = req.params;

  const db = dbAdapter.getDb();
  db.run('DELETE FROM group_members WHERE id = ?', [memberId], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// GET /api/divers - list all divers (for dropdowns)
app.get('/api/divers', (req, res) => {
  const db = dbAdapter.getDb();

  db.all('SELECT * FROM divers ORDER BY name ASC', (err, divers) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(divers || []);
  });
});

// GET /api/divers/:id - get a specific diver
app.get('/api/divers/:id', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();

  db.get('SELECT * FROM divers WHERE id = ?', [id], (err, diver) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!diver) return res.status(404).json({ error: 'Diver not found' });
    res.json(diver);
  });
});

// POST /api/divers - create a diver
app.post('/api/divers', (req, res) => {
  const { name, email, phone, certification_level, medical_cleared } = req.body;
  const id = uuidv4();

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    `INSERT INTO divers (id, name, email, phone, certification_level, medical_cleared) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, email, phone || null, certification_level || null, medical_cleared ? 1 : 0],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM divers WHERE id = ?', [id], (err, diver) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(diver);
      });
    }
  );
});

// GET /api/courses - list all courses
app.get('/api/courses', (req, res) => {
  const db = dbAdapter.getDb();
  db.all(`
    SELECT c.id, c.name, c.price, c.description, c.duration_days, c.start_date, c.end_date, c.max_students,
           c.instructor_id, i.name as instructor_name,
           c.boat_id, b.name as boat_name
    FROM courses c
    LEFT JOIN instructors i ON c.instructor_id = i.id
    LEFT JOIN boats b ON c.boat_id = b.id
    ORDER BY c.created_at DESC
  `, (err, courses) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json((courses || []).map(c => ({
      id: c.id,
      name: c.name,
      price: c.price,
      description: c.description,
      duration_days: c.duration_days,
      start_date: c.start_date,
      end_date: c.end_date,
      max_students: c.max_students,
      instructor_id: c.instructor_id,
      instructors: { name: c.instructor_name },
      boat_id: c.boat_id,
      boats: { name: c.boat_name }
    })));
  });
});

// POST /api/courses - create a course
app.post('/api/courses', (req, res) => {
  const { name, price, duration_days, description, instructor_id, boat_id, start_date, end_date, max_students } = req.body;
  const id = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    `INSERT INTO courses (id, name, price, duration_days, description, instructor_id, boat_id, start_date, end_date, max_students) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, price || 0, duration_days || null, description || null, instructor_id || null, boat_id || null, start_date || null, end_date || null, max_students || 6],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get(`
        SELECT c.id, c.name, c.price, c.description, c.duration_days, c.start_date, c.end_date, c.max_students,
               c.instructor_id, i.name as instructor_name,
               c.boat_id, b.name as boat_name
        FROM courses c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        LEFT JOIN boats b ON c.boat_id = b.id
        WHERE c.id = ?
      `, [id], (err, course) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          id: course.id,
          name: course.name,
          price: course.price,
          description: course.description,
          duration_days: course.duration_days,
          start_date: course.start_date,
          end_date: course.end_date,
          max_students: course.max_students,
          instructor_id: course.instructor_id,
          instructors: { name: course.instructor_name },
          boat_id: course.boat_id,
          boats: { name: course.boat_name }
        });
      });
    }
  );
});

// DELETE /api/courses/:id - delete a course
app.delete('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();
  db.run('DELETE FROM courses WHERE id = ?', [id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// GET /api/instructors - list all instructors
app.get('/api/instructors', (req, res) => {
  const db = dbAdapter.getDb();
  db.all('SELECT id, name, email, phone, certification FROM instructors ORDER BY name ASC', (err, instructors) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(instructors || []);
  });
});

// POST /api/instructors - create an instructor
app.post('/api/instructors', (req, res) => {
  const { name, email, phone, certification } = req.body;
  const id = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    'INSERT INTO instructors (id, name, email, phone, certification) VALUES (?, ?, ?, ?, ?)',
    [id, name, email || null, phone || null, certification || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT id, name, email, phone, certification FROM instructors WHERE id = ?', [id], (err, instructor) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(instructor);
      });
    }
  );
});

// GET /api/boats - list all boats
app.get('/api/boats', (req, res) => {
  const db = dbAdapter.getDb();
  db.all('SELECT id, name, capacity, location FROM boats ORDER BY name ASC', (err, boats) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(boats || []);
  });
});

// POST /api/boats - create a boat
app.post('/api/boats', (req, res) => {
  const { name, capacity, location } = req.body;
  const id = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    'INSERT INTO boats (id, name, capacity, location) VALUES (?, ?, ?, ?)',
    [id, name, capacity || null, location || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT id, name, capacity, location FROM boats WHERE id = ?', [id], (err, boat) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(boat);
      });
    }
  );
});

// GET /api/accommodations - list all accommodations
app.get('/api/accommodations', (req, res) => {
  const db = dbAdapter.getDb();
  db.all('SELECT id, name, price_per_night, tier FROM accommodations ORDER BY name ASC', (err, accs) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(accs || []);
  });
});

// POST /api/accommodations - create an accommodation
app.post('/api/accommodations', (req, res) => {
  const { name, price_per_night, tier, description } = req.body;
  const id = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    'INSERT INTO accommodations (id, name, price_per_night, tier, description) VALUES (?, ?, ?, ?, ?)',
    [id, name, price_per_night || 0, tier || 'standard', description || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT id, name, price_per_night, tier FROM accommodations WHERE id = ?', [id], (err, acc) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(acc);
      });
    }
  );
});

// GET /api/bookings - list all bookings with related data
app.get('/api/bookings', (req, res) => {
  const db = dbAdapter.getDb();

  db.all(`
    SELECT 
      b.id, b.diver_id, b.course_id, b.group_id, b.accommodation_id, b.check_in, b.check_out,
      b.size, b.weight, b.height, b.agent_id,
      b.total_amount, b.invoice_number, b.payment_status, b.notes, b.created_at,
      d.name as diver_name,
      c.name as course_name, c.price as course_price,
      g.name as group_name, g.days as group_days,
      a.name as accommodation_name, a.price_per_night, a.tier,
      i.id as agent_id, i.name as agent_name
    FROM bookings b
    LEFT JOIN divers d ON b.diver_id = d.id
    LEFT JOIN courses c ON b.course_id = c.id
    LEFT JOIN groups g ON b.group_id = g.id
    LEFT JOIN accommodations a ON b.accommodation_id = a.id
    LEFT JOIN instructors i ON b.agent_id = i.id
    ORDER BY b.created_at DESC
  `, (err, bookings) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    
    const result = (bookings || []).map(b => ({
      id: b.id,
      diver_id: b.diver_id,
      course_id: b.course_id,
      group_id: b.group_id,
      accommodation_id: b.accommodation_id,
      check_in: b.check_in,
      check_out: b.check_out,
      total_amount: b.total_amount,
      invoice_number: b.invoice_number,
      payment_status: b.payment_status,
      notes: b.notes,
      created_at: b.created_at,
      divers: { name: b.diver_name },
      courses: { name: b.course_name, price: b.course_price },
      groups: { name: b.group_name, days: b.group_days },
      accommodations: { name: b.accommodation_name, price_per_night: b.price_per_night, tier: b.tier }
      ,
      size: b.size,
      weight: b.weight,
      height: b.height,
      agent: b.agent_id ? { id: b.agent_id, name: b.agent_name } : null
    }));
    res.json(result);
  });
});

// GET /api/bookings/stats/last30days - get bookings and revenue for last 30 days
app.get('/api/bookings/stats/last30days', (req, res) => {
  const db = dbAdapter.getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  db.get(`
    SELECT 
      COUNT(*) as booking_count,
      SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
      SUM(total_amount) as total_amount
    FROM bookings
    WHERE created_at >= ?
  `, [thirtyDaysAgo], (err, stats) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      booking_count: stats?.booking_count || 0,
      total_revenue: stats?.total_revenue || 0,
      total_amount: stats?.total_amount || 0
    });
  });
});

// POST /api/bookings - create a booking
app.post('/api/bookings', (req, res) => {
  const { diver_id, course_id, group_id, accommodation_id, check_in, check_out, size, weight, height, agent_id, total_amount, notes } = req.body;
  const id = uuidv4();
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  if (!diver_id) {
    return res.status(400).json({ error: 'diver_id is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    `INSERT INTO bookings (id, diver_id, course_id, group_id, accommodation_id, check_in, check_out, size, weight, height, agent_id, total_amount, invoice_number, payment_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`,
    [id, diver_id, course_id || null, group_id || null, accommodation_id || null, check_in || null, check_out || null, size || null, weight || null, height || null, agent_id || null, total_amount || 0, invoiceNumber, notes || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get(`
        SELECT 
          b.id, b.diver_id, b.course_id, b.group_id, b.accommodation_id, b.check_in, b.check_out,
          b.size, b.weight, b.height, b.agent_id,
          b.total_amount, b.invoice_number, b.payment_status, b.notes, b.created_at,
          d.name as diver_name,
          c.name as course_name, c.price as course_price,
          g.name as group_name, g.days as group_days,
          a.name as accommodation_name, a.price_per_night, a.tier,
          i.id as agent_id, i.name as agent_name
        FROM bookings b
        LEFT JOIN divers d ON b.diver_id = d.id
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN groups g ON b.group_id = g.id
        LEFT JOIN accommodations a ON b.accommodation_id = a.id
        LEFT JOIN instructors i ON b.agent_id = i.id
        WHERE b.id = ?
      `, [id], (err, booking) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          id: booking.id,
          diver_id: booking.diver_id,
          course_id: booking.course_id,
          group_id: booking.group_id,
          accommodation_id: booking.accommodation_id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          size: booking.size,
          weight: booking.weight,
          height: booking.height,
          agent_id: booking.agent_id,
          total_amount: booking.total_amount,
          invoice_number: booking.invoice_number,
          payment_status: booking.payment_status,
          notes: booking.notes,
          created_at: booking.created_at,
          divers: { name: booking.diver_name },
          courses: { name: booking.course_name, price: booking.course_price },
          groups: { name: booking.group_name, days: booking.group_days },
          accommodations: { name: booking.accommodation_name, price_per_night: booking.price_per_night, tier: booking.tier },
          agent: booking.agent_id ? { id: booking.agent_id, name: booking.agent_name } : null
        });
      });
    }
  );
});

// PATCH /api/bookings/:id - update payment status
app.patch('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  const db = dbAdapter.getDb();
  db.run('UPDATE bookings SET payment_status = ? WHERE id = ?', [payment_status, id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// DELETE /api/bookings/:id - delete a booking
app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;

  const db = dbAdapter.getDb();
  db.run('DELETE FROM bookings WHERE id = ?', [id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// PUT /api/divers/:id - update a diver
app.put('/api/divers/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, certification_level, medical_cleared } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    `UPDATE divers SET name = ?, email = ?, phone = ?, certification_level = ?, medical_cleared = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, email, phone || null, certification_level || null, medical_cleared ? 1 : 0, id],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM divers WHERE id = ?', [id], (err, diver) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(diver);
      });
    }
  );
});

// DELETE /api/divers/:id - delete a diver
app.delete('/api/divers/:id', (req, res) => {
  const { id } = req.params;

  const db = dbAdapter.getDb();
  db.run('DELETE FROM divers WHERE id = ?', [id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// PUT /api/bookings/:id - update a booking
app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { diver_id, course_id, group_id, accommodation_id, check_in, check_out, size, weight, height, agent_id, total_amount, payment_status, notes } = req.body;

  if (!diver_id) {
    return res.status(400).json({ error: 'diver_id is required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    `UPDATE bookings SET diver_id = ?, course_id = ?, group_id = ?, accommodation_id = ?, check_in = ?, check_out = ?, size = ?, weight = ?, height = ?, agent_id = ?, total_amount = ?, payment_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [diver_id, course_id || null, group_id || null, accommodation_id || null, check_in || null, check_out || null, size || null, weight || null, height || null, agent_id || null, total_amount || 0, payment_status || 'unpaid', notes || null, id],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get(`
        SELECT 
          b.id, b.diver_id, b.course_id, b.group_id, b.accommodation_id, b.check_in, b.check_out,
          b.size, b.weight, b.height, b.agent_id,
          b.total_amount, b.invoice_number, b.payment_status, b.notes, b.created_at, b.updated_at,
          d.name as diver_name,
          c.name as course_name, c.price as course_price,
          g.name as group_name, g.days as group_days,
          a.name as accommodation_name, a.price_per_night, a.tier,
          i.id as agent_id, i.name as agent_name
        FROM bookings b
        LEFT JOIN divers d ON b.diver_id = d.id
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN groups g ON b.group_id = g.id
        LEFT JOIN accommodations a ON b.accommodation_id = a.id
        LEFT JOIN instructors i ON b.agent_id = i.id
        WHERE b.id = ?
      `, [id], (err, booking) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          id: booking.id,
          diver_id: booking.diver_id,
          course_id: booking.course_id,
          group_id: booking.group_id,
          accommodation_id: booking.accommodation_id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          size: booking.size,
          weight: booking.weight,
          height: booking.height,
          agent_id: booking.agent_id,
          total_amount: booking.total_amount,
          invoice_number: booking.invoice_number,
          payment_status: booking.payment_status,
          notes: booking.notes,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          divers: { name: booking.diver_name },
          courses: { name: booking.course_name, price: booking.course_price },
          groups: { name: booking.group_name, days: booking.group_days },
          accommodations: { name: booking.accommodation_name, price_per_night: booking.price_per_night, tier: booking.tier },
          agent: booking.agent_id ? { id: booking.agent_id, name: booking.agent_name } : null
        });
      });
    }
  );
});

// GET /api/waivers - list all waivers
app.get('/api/waivers', (req, res) => {
  const db = dbAdapter.getDb();

  db.all(`
    SELECT w.id, w.diver_id, w.status, w.signed_at, w.notes, w.created_at, d.name as diver_name, d.email as diver_email
    FROM waivers w
    LEFT JOIN divers d ON w.diver_id = d.id
    ORDER BY w.created_at DESC
  `, (err, waivers) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(waivers || []);
  });
});

// GET /api/waivers/:diver_id - get waiver for a specific diver
app.get('/api/waivers/:diver_id', (req, res) => {
  const { diver_id } = req.params;
  const db = dbAdapter.getDb();

  db.get(`
    SELECT w.id, w.diver_id, w.document_url, w.signature_data, w.status, w.signed_at, w.notes, w.created_at, d.name as diver_name, d.email as diver_email
    FROM waivers w
    LEFT JOIN divers d ON w.diver_id = d.id
    WHERE w.diver_id = ?
  `, [diver_id], (err, waiver) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(waiver || null);
  });
});

// POST /api/waivers - create/update waiver
app.post('/api/waivers', (req, res) => {
  const { diver_id, document_url, signature_data, notes } = req.body;
  const id = uuidv4();

  if (!diver_id) {
    return res.status(400).json({ error: 'diver_id is required' });
  }

  const db = dbAdapter.getDb();

  // Check if waiver exists for this diver
  db.get('SELECT id FROM waivers WHERE diver_id = ?', [diver_id], (err, existing) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }

    if (existing) {
      // Update existing waiver
      db.run(
        `UPDATE waivers SET document_url = ?, signature_data = ?, status = 'signed', signed_at = CURRENT_TIMESTAMP, notes = ?
         WHERE diver_id = ?`,
        [document_url || null, signature_data || null, notes || null, diver_id],
        (err) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: err.message });
          }

          // Also update diver's waiver_signed flag
          db.run(
            `UPDATE divers SET waiver_signed = 1, waiver_signed_date = CURRENT_TIMESTAMP WHERE id = ?`,
            [diver_id],
            (err) => {
              db.get('SELECT * FROM waivers WHERE diver_id = ?', [diver_id], (err, waiver) => {
                db.close();
                if (err) return res.status(500).json({ error: err.message });
                res.json(waiver);
              });
            }
          );
        }
      );
    } else {
      // Create new waiver
      db.run(
        `INSERT INTO waivers (id, diver_id, document_url, signature_data, status, signed_at, notes)
         VALUES (?, ?, ?, ?, 'signed', CURRENT_TIMESTAMP, ?)`,
        [id, diver_id, document_url || null, signature_data || null, notes || null],
        (err) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: err.message });
          }

          // Update diver's waiver_signed flag
          db.run(
            `UPDATE divers SET waiver_signed = 1, waiver_signed_date = CURRENT_TIMESTAMP WHERE id = ?`,
            [diver_id],
            (err) => {
              db.get('SELECT * FROM waivers WHERE id = ?', [id], (err, waiver) => {
                db.close();
                if (err) return res.status(500).json({ error: err.message });
                res.json(waiver);
              });
            }
          );
        }
      );
    }
  });
});

// PATCH /api/divers/:id/onboarding - complete onboarding
app.patch('/api/divers/:id/onboarding', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();

  db.run(
    `UPDATE divers SET onboarding_completed = 1, onboarding_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM divers WHERE id = ?', [id], (err, diver) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(diver);
      });
    }
  );
});

// GET /api/dive-sites - list all dive sites
app.get('/api/dive-sites', (req, res) => {
  const db = dbAdapter.getDb();
  db.all('SELECT id, name, location, max_depth, difficulty, description FROM dive_sites ORDER BY name ASC', (err, sites) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(sites || []);
  });
});

// POST /api/dive-sites - create a dive site
app.post('/api/dive-sites', (req, res) => {
  const { name, location, max_depth, difficulty, description, emergency_contacts, nearest_hospital, dan_info } = req.body;
  const id = uuidv4();

  if (!name || !location) {
    return res.status(400).json({ error: 'name and location are required' });
  }

  const db = dbAdapter.getDb();
  db.run(
    `INSERT INTO dive_sites (id, name, location, max_depth, difficulty, description, emergency_contacts, nearest_hospital, dan_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, location, max_depth || null, difficulty || null, description || null, emergency_contacts || null, nearest_hospital || null, dan_info || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT id, name, location, max_depth, difficulty, description FROM dive_sites WHERE id = ?', [id], (err, site) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(site);
      });
    }
  );
});

// DELETE /api/dive-sites/:id - delete a dive site
app.delete('/api/dive-sites/:id', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();
  db.run('DELETE FROM dive_sites WHERE id = ?', [id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// GET /api/groups/:id/itinerary - get dive itinerary for a group
app.get('/api/groups/:id/itinerary', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();

  db.all(`
    SELECT gdi.id, gdi.group_id, gdi.day_number, gdi.dive_site_id, gdi.notes,
           ds.name as site_name, ds.location, ds.max_depth, ds.difficulty
    FROM group_dive_itinerary gdi
    LEFT JOIN dive_sites ds ON gdi.dive_site_id = ds.id
    WHERE gdi.group_id = ?
    ORDER BY gdi.day_number ASC
  `, [id], (err, itinerary) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(itinerary || []);
  });
});

// POST /api/groups/:id/itinerary - add or update dive plan for a day
app.post('/api/groups/:id/itinerary', (req, res) => {
  const { id } = req.params;
  const { day_number, dive_site_id, notes } = req.body;

  if (!day_number) {
    return res.status(400).json({ error: 'day_number is required' });
  }

  const db = dbAdapter.getDb();
  
  // Check if entry exists for this group and day
  db.get('SELECT id FROM group_dive_itinerary WHERE group_id = ? AND day_number = ?', [id, day_number], (err, existing) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }

    if (existing) {
      // Update
      db.run(
        `UPDATE group_dive_itinerary SET dive_site_id = ?, notes = ? WHERE group_id = ? AND day_number = ?`,
        [dive_site_id || null, notes || null, id, day_number],
        (err) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: err.message });
          }
          
          db.get(`
            SELECT gdi.id, gdi.group_id, gdi.day_number, gdi.dive_site_id, gdi.notes,
                   ds.name as site_name, ds.location, ds.max_depth, ds.difficulty
            FROM group_dive_itinerary gdi
            LEFT JOIN dive_sites ds ON gdi.dive_site_id = ds.id
            WHERE gdi.group_id = ? AND gdi.day_number = ?
          `, [id, day_number], (err, result) => {
            db.close();
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
          });
        }
      );
    } else {
      // Insert
      const itineraryId = uuidv4();
      db.run(
        `INSERT INTO group_dive_itinerary (id, group_id, day_number, dive_site_id, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [itineraryId, id, day_number, dive_site_id || null, notes || null],
        (err) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: err.message });
          }
          
          db.get(`
            SELECT gdi.id, gdi.group_id, gdi.day_number, gdi.dive_site_id, gdi.notes,
                   ds.name as site_name, ds.location, ds.max_depth, ds.difficulty
            FROM group_dive_itinerary gdi
            LEFT JOIN dive_sites ds ON gdi.dive_site_id = ds.id
            WHERE gdi.id = ?
          `, [itineraryId], (err, result) => {
            db.close();
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
          });
        }
      );
    }
  });
});

// ========== TRIPS ENDPOINTS ==========

// GET /api/trips - list all trips
app.get('/api/trips', (req, res) => {
  const db = dbAdapter.getDb();
  db.all(`
    SELECT t.id, t.name, t.type, t.start_at, t.dive_site_id, t.boat_id, t.captain_id, t.number_of_dives, t.boat_staff, t.products, t.description, t.created_at, t.updated_at,
           ds.name as site_name, ds.location as site_location,
           b.name as boat_name,
           i.name as captain_name
    FROM trips t
    LEFT JOIN dive_sites ds ON t.dive_site_id = ds.id
    LEFT JOIN boats b ON t.boat_id = b.id
    LEFT JOIN instructors i ON t.captain_id = i.id
    ORDER BY t.start_at DESC
  `, (err, trips) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(trips || []);
  });
});

// POST /api/trips - create a trip
app.post('/api/trips', (req, res) => {
  const { name, type, start_at, dive_site_id, boat_id, captain_id, number_of_dives, boat_staff, products, description } = req.body;
  
  if (!name || !start_at) {
    return res.status(400).json({ error: 'name and start_at are required' });
  }

  const id = uuidv4();
  const db = dbAdapter.getDb();

  db.run(
    `INSERT INTO trips (id, name, type, start_at, dive_site_id, boat_id, captain_id, number_of_dives, boat_staff, products, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, type || 'regular', start_at, dive_site_id || null, boat_id || null, captain_id || null, number_of_dives || 1, boat_staff || null, products || null, description || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get(`
        SELECT t.id, t.name, t.type, t.start_at, t.dive_site_id, t.boat_id, t.captain_id, t.number_of_dives, t.boat_staff, t.products, t.description, t.created_at, t.updated_at,
               ds.name as site_name, ds.location as site_location,
               b.name as boat_name,
               i.name as captain_name
        FROM trips t
        LEFT JOIN dive_sites ds ON t.dive_site_id = ds.id
        LEFT JOIN boats b ON t.boat_id = b.id
        LEFT JOIN instructors i ON t.captain_id = i.id
        WHERE t.id = ?
      `, [id], (err, trip) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(trip);
      });
    }
  );
});

// ========== SCHEDULES ENDPOINTS ==========

// GET /api/schedules - list all schedules
app.get('/api/schedules', (req, res) => {
  const db = dbAdapter.getDb();
  db.all(`
    SELECT id, name, departure_time, departure_location, boat_id, number_of_dives, start_date, end_date, days_ahead, days_of_week, dive_sites, products, created_at, updated_at
    FROM schedules
    ORDER BY start_date DESC
  `, (err, schedules) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(schedules || []);
  });
});

// POST /api/schedules - create a schedule
app.post('/api/schedules', (req, res) => {
  const { name, departure_time, departure_location, boat_id, number_of_dives, start_date, end_date, days_ahead, days_of_week, dive_sites, products } = req.body;
  
  if (!name || !start_date) {
    return res.status(400).json({ error: 'name and start_date are required' });
  }

  const id = uuidv4();
  const db = dbAdapter.getDb();

  db.run(
    `INSERT INTO schedules (id, name, departure_time, departure_location, boat_id, number_of_dives, start_date, end_date, days_ahead, days_of_week, dive_sites, products)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, departure_time || null, departure_location || null, boat_id || null, number_of_dives || 1, start_date, end_date || null, days_ahead || 30, JSON.stringify(days_of_week) || null, dive_sites || null, products || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get(
        `SELECT id, name, departure_time, departure_location, boat_id, number_of_dives, start_date, end_date, days_ahead, days_of_week, dive_sites, products, created_at, updated_at
         FROM schedules WHERE id = ?`,
        [id],
        (err, schedule) => {
          db.close();
          if (err) return res.status(500).json({ error: err.message });
          res.json(schedule);
        }
      );
    }
  );
});

// ========== TRIP ASSIGNMENTS ENDPOINTS ==========

// GET /api/trips/:id/assignments - get all divers assigned to a trip
app.get('/api/trips/:id/assignments', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();

  db.all(`
    SELECT ta.id, ta.trip_id, ta.diver_id, ta.assigned_at,
           d.name as diver_name, d.certification_level
    FROM trip_assignments ta
    LEFT JOIN divers d ON ta.diver_id = d.id
    WHERE ta.trip_id = ?
    ORDER BY ta.assigned_at DESC
  `, [id], (err, assignments) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(assignments || []);
  });
});

// POST /api/trips/:id/assignments - assign a diver to a trip
app.post('/api/trips/:id/assignments', (req, res) => {
  const { id } = req.params;
  const { diver_id } = req.body;

  if (!diver_id) {
    return res.status(400).json({ error: 'diver_id is required' });
  }

  const assignmentId = uuidv4();
  const db = dbAdapter.getDb();

  db.run(
    `INSERT INTO trip_assignments (id, trip_id, diver_id)
     VALUES (?, ?, ?)`,
    [assignmentId, id, diver_id],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get(`
        SELECT ta.id, ta.trip_id, ta.diver_id, ta.assigned_at,
               d.name as diver_name, d.certification_level
        FROM trip_assignments ta
        LEFT JOIN divers d ON ta.diver_id = d.id
        WHERE ta.id = ?
      `, [assignmentId], (err, assignment) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(assignment);
      });
    }
  );
});

// DELETE /api/trips/:id/assignments/:diver_id - unassign a diver from a trip
app.delete('/api/trips/:id/assignments/:diver_id', (req, res) => {
  const { id, diver_id } = req.params;
  const db = dbAdapter.getDb();

  db.run(
    `DELETE FROM trip_assignments WHERE trip_id = ? AND diver_id = ?`,
    [id, diver_id],
    (err) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

// ========== EQUIPMENT / INVENTORY ENDPOINTS ==========

// GET /api/equipment - list all equipment
app.get('/api/equipment', (req, res) => {
  const db = dbAdapter.getDb();
  db.all('SELECT * FROM equipment ORDER BY category, name', (err, equipment) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(equipment || []);
  });
});

// GET /api/equipment/:id - get equipment by id
app.get('/api/equipment/:id', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();
  db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, equipment) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(equipment || {});
  });
});

// POST /api/equipment - create new equipment
app.post('/api/equipment', (req, res) => {
  const { name, category, sku, price, can_buy, can_rent, rent_price_per_day, quantity_in_stock, quantity_available_for_rent, reorder_level, supplier, description, barcode } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category required' });

  const db = dbAdapter.getDb();
  const id = uuidv4();
  db.run(
    'INSERT INTO equipment (id, name, category, sku, price, can_buy, can_rent, rent_price_per_day, quantity_in_stock, quantity_available_for_rent, reorder_level, supplier, description, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, category, sku || null, price || 0, can_buy !== false ? 1 : 0, can_rent !== false ? 1 : 0, rent_price_per_day || 0, quantity_in_stock || 0, quantity_available_for_rent || 0, reorder_level || 5, supplier || null, description || null, barcode || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, equipment) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(equipment);
      });
    }
  );
});

// PUT /api/equipment/:id - update equipment
app.put('/api/equipment/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, sku, price, can_buy, can_rent, rent_price_per_day, quantity_in_stock, quantity_available_for_rent, reorder_level, supplier, description, barcode } = req.body;

  const db = dbAdapter.getDb();
  db.run(
    'UPDATE equipment SET name = ?, category = ?, sku = ?, price = ?, can_buy = ?, can_rent = ?, rent_price_per_day = ?, quantity_in_stock = ?, quantity_available_for_rent = ?, reorder_level = ?, supplier = ?, description = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, category, sku || null, price || 0, can_buy !== false ? 1 : 0, can_rent !== false ? 1 : 0, rent_price_per_day || 0, quantity_in_stock || 0, quantity_available_for_rent || 0, reorder_level || 5, supplier || null, description || null, barcode || null, id],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, equipment) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(equipment);
      });
    }
  );
});

// DELETE /api/equipment/:id - soft delete equipment
app.delete('/api/equipment/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, category, sku, price, can_buy, can_rent, rent_price_per_day,
    quantity_in_stock, quantity_available_for_rent, reorder_level, supplier, description, barcode
  } = req.body;

  const db = dbAdapter.getDb();
  // Read existing equipment and merge fields to avoid overwriting required NOT NULL columns with null
  db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, existing) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }
    if (!existing) {
      db.close();
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const merged = {
      name: name !== undefined ? name : existing.name,
      category: category !== undefined ? category : existing.category,
      sku: sku !== undefined ? sku : existing.sku,
      price: price !== undefined ? price : existing.price,
      can_buy: can_buy !== undefined ? (can_buy ? 1 : 0) : existing.can_buy,
      can_rent: can_rent !== undefined ? (can_rent ? 1 : 0) : existing.can_rent,
      rent_price_per_day: rent_price_per_day !== undefined ? rent_price_per_day : existing.rent_price_per_day,
      quantity_in_stock: quantity_in_stock !== undefined ? quantity_in_stock : existing.quantity_in_stock,
      quantity_available_for_rent: quantity_available_for_rent !== undefined ? quantity_available_for_rent : existing.quantity_available_for_rent,
      reorder_level: reorder_level !== undefined ? reorder_level : existing.reorder_level,
      supplier: supplier !== undefined ? supplier : existing.supplier,
      description: description !== undefined ? description : existing.description,
      barcode: barcode !== undefined ? barcode : existing.barcode,
    };

    db.run(
      'UPDATE equipment SET name = ?, category = ?, sku = ?, price = ?, can_buy = ?, can_rent = ?, rent_price_per_day = ?, quantity_in_stock = ?, quantity_available_for_rent = ?, reorder_level = ?, supplier = ?, description = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [merged.name, merged.category, merged.sku || null, merged.price || 0, merged.can_buy, merged.can_rent, merged.rent_price_per_day || 0, merged.quantity_in_stock || 0, merged.quantity_available_for_rent || 0, merged.reorder_level || 5, merged.supplier || null, merged.description || null, merged.barcode || null, id],
      (err2) => {
        db.close();
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ok: true });
      }
    );
  });
});

// GET /api/transactions - list all transactions
app.get('/api/transactions', (req, res) => {
  const db = dbAdapter.getDb();
  db.all(`
    SELECT 
      t.id, t.transaction_number, t.diver_id, t.booking_id, t.type, t.status,
      t.subtotal, t.tax, t.discount, t.total, t.notes, t.created_at,
      d.name as diver_name, d.email as diver_email,
      b.invoice_number as booking_invoice
    FROM transactions t
    LEFT JOIN divers d ON t.diver_id = d.id
    LEFT JOIN bookings b ON t.booking_id = b.id
    ORDER BY t.created_at DESC
  `, (err, transactions) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(transactions || []);
  });
});

// GET /api/transactions/:id - get transaction with items
app.get('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();
  db.get(`
    SELECT 
      t.id, t.transaction_number, t.diver_id, t.booking_id, t.type, t.status,
      t.subtotal, t.tax, t.discount, t.total, t.notes, t.created_at,
      d.name as diver_name, d.email as diver_email
    FROM transactions t
    LEFT JOIN divers d ON t.diver_id = d.id
    WHERE t.id = ?
  `, [id], (err, transaction) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }
    if (!transaction) {
      db.close();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get transaction items
    db.all(`
      SELECT 
        ti.id, ti.transaction_id, ti.equipment_id, ti.quantity, ti.unit_price, ti.subtotal,
        ti.transaction_type, ti.rental_days,
        e.name as equipment_name, e.category, e.sku
      FROM transaction_items ti
      LEFT JOIN equipment e ON ti.equipment_id = e.id
      WHERE ti.transaction_id = ?
    `, [id], (err, items) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...transaction, items: items || [] });
    });
  });
});

// POST /api/transactions - create new transaction
app.post('/api/transactions', (req, res) => {
  const { diver_id, booking_id, items, tax, discount, notes } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'At least one item required' });
  }

  const db = dbAdapter.getDb();
  const transactionId = uuidv4();
  const transactionNumber = `TXN-${Date.now()}`;
  
  // Calculate totals
  let subtotal = 0;
  items.forEach(item => {
    const itemPrice = item.transaction_type === 'rent' 
      ? (item.unit_price || 0) * (item.quantity || 1) * (item.rental_days || 1)
      : (item.unit_price || 0) * (item.quantity || 1);
    subtotal += itemPrice;
  });
  
  const taxAmount = tax || 0;
  const discountAmount = discount || 0;
  const total = subtotal + taxAmount - discountAmount;

  db.run(
    'INSERT INTO transactions (id, transaction_number, diver_id, booking_id, type, subtotal, tax, discount, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [transactionId, transactionNumber, diver_id || null, booking_id || null, 'pos_sale', subtotal, taxAmount, discountAmount, total, notes || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      // Insert transaction items
      let completed = 0;
      items.forEach(item => {
        const itemId = uuidv4();
        const itemPrice = item.transaction_type === 'rent' 
          ? (item.unit_price || 0) * (item.quantity || 1) * (item.rental_days || 1)
          : (item.unit_price || 0) * (item.quantity || 1);
        const transactionType = item.transaction_type || 'buy';
        const rentalDays = item.rental_days || 0;
        
        db.run(
          'INSERT INTO transaction_items (id, transaction_id, equipment_id, quantity, unit_price, subtotal, transaction_type, rental_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [itemId, transactionId, item.equipment_id, item.quantity || 1, item.unit_price || 0, itemPrice, transactionType, rentalDays],
          (err) => {
            completed++;
            if (completed === items.length) {
              // Update equipment quantities based on transaction type
              items.forEach(item => {
                const transactionType = item.transaction_type || 'buy';
                if (transactionType === 'rent') {
                  db.run(
                    'UPDATE equipment SET quantity_available_for_rent = quantity_available_for_rent - ? WHERE id = ?',
                    [item.quantity || 1, item.equipment_id]
                  );
                } else {
                  db.run(
                    'UPDATE equipment SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?',
                    [item.quantity || 1, item.equipment_id]
                  );
                }
              });

              db.get('SELECT * FROM transactions WHERE id = ?', [transactionId], (err, transaction) => {
                db.close();
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json(transaction);
              });
            }
          }
        );
      });
    }
  );
});

// ========== PAYMENT ENDPOINTS ==========

// GET /api/payments - list all payments
app.get('/api/payments', (req, res) => {
  const db = dbAdapter.getDb();
  db.all(`
    SELECT 
      p.id, p.transaction_id, p.amount, p.payment_method, p.payment_status, p.reference_number, p.notes, p.created_at,
      t.transaction_number, t.total as transaction_total
    FROM payments p
    LEFT JOIN transactions t ON p.transaction_id = t.id
    ORDER BY p.created_at DESC
  `, (err, payments) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(payments || []);
  });
});

// POST /api/payments - create new payment
app.post('/api/payments', (req, res) => {
  const { transaction_id, amount, payment_method, reference_number, notes } = req.body;
  if (!transaction_id || !amount) {
    return res.status(400).json({ error: 'transaction_id and amount required' });
  }

  const db = dbAdapter.getDb();
  const id = uuidv4();
  db.run(
    'INSERT INTO payments (id, transaction_id, amount, payment_method, reference_number, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [id, transaction_id, amount, payment_method || 'cash', reference_number || null, notes || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT * FROM payments WHERE id = ?', [id], (err, payment) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(payment);
      });
    }
  );
});

// GET /api/pos/summary - get POS summary (daily sales, etc)
app.get('/api/pos/summary', (req, res) => {
  const db = dbAdapter.getDb();
  const today = new Date().toISOString().split('T')[0];
  
  db.all(`
    SELECT 
      COUNT(DISTINCT t.id) as transaction_count,
      SUM(t.total) as total_sales,
      SUM(p.amount) as total_paid,
      COUNT(DISTINCT p.id) as payment_count
    FROM transactions t
    LEFT JOIN payments p ON t.id = p.transaction_id
    WHERE DATE(t.created_at) = ?
  `, [today], (err, summary) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }

    // Get low stock items
    db.all('SELECT id, name, category, quantity_in_stock, reorder_level FROM equipment WHERE quantity_in_stock <= reorder_level ORDER BY quantity_in_stock ASC', (err, lowStock) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        today: summary[0] || {},
        low_stock_items: lowStock || []
      });
    });
  });
});

// GET /api/rental-assignments - list all rental assignments
app.get('/api/rental-assignments', (req, res) => {
  const { booking_id } = req.query;
  const db = dbAdapter.getDb();
  
  let query = `
    SELECT 
      ra.id, ra.booking_id, ra.equipment_id, ra.quantity, ra.check_in, ra.check_out,
      ra.status, ra.notes, ra.created_at,
      e.name as equipment_name, e.category, e.sku, e.rent_price_per_day,
      b.diver_id as diver_id, d.name as diver_name
    FROM rental_assignments ra
    LEFT JOIN equipment e ON ra.equipment_id = e.id
    LEFT JOIN bookings b ON ra.booking_id = b.id
    LEFT JOIN divers d ON b.diver_id = d.id
  `;
  
  let params = [];
  if (booking_id) {
    query += ' WHERE ra.booking_id = ?';
    params.push(booking_id);
  }
  
  query += ' ORDER BY ra.created_at DESC';
  
  db.all(query, params, (err, assignments) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(assignments || []);
  });
});

// POST /api/rental-assignments - create rental assignment
app.post('/api/rental-assignments', (req, res) => {
  const { booking_id, equipment_id, quantity, check_in, check_out, notes } = req.body;
  
  if (!booking_id || !equipment_id || !check_in || !check_out) {
    return res.status(400).json({ error: 'booking_id, equipment_id, check_in, and check_out are required' });
  }

  const db = dbAdapter.getDb();
  const id = uuidv4();
  
  db.run(
    `INSERT INTO rental_assignments (id, booking_id, equipment_id, quantity, check_in, check_out, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    [id, booking_id, equipment_id, quantity || 1, check_in, check_out, notes || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        `SELECT ra.id, ra.booking_id, ra.equipment_id, ra.quantity, ra.check_in, ra.check_out, ra.status, ra.notes, ra.created_at,
                e.name as equipment_name, e.category, e.sku, e.rent_price_per_day
         FROM rental_assignments ra
         LEFT JOIN equipment e ON ra.equipment_id = e.id
         WHERE ra.id = ?`,
        [id],
        (err, assignment) => {
          db.close();
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json(assignment);
        }
      );
    }
  );
});

// DELETE /api/rental-assignments/:id - delete rental assignment
app.delete('/api/rental-assignments/:id', (req, res) => {
  const { id } = req.params;
  const db = dbAdapter.getDb();
  
  db.run('DELETE FROM rental_assignments WHERE id = ?', [id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// GET /api/finance/summary - get comprehensive financial summary
app.get('/api/finance/summary', (req, res) => {
  const { startDate, endDate } = req.query;
  const db = dbAdapter.getDb();

  if (!startDate || !endDate) {
    db.close();
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  // Get transaction totals
  db.all(`
    SELECT 
      COUNT(DISTINCT t.id) as total_transactions,
      SUM(t.total) as total_revenue,
      SUM(t.tax) as total_tax,
      SUM(t.discount) as total_discount,
      p.payment_method,
      COUNT(DISTINCT p.id) as payment_count,
      SUM(p.amount) as payment_amount
    FROM transactions t
    LEFT JOIN payments p ON t.id = p.transaction_id
    WHERE DATE(t.created_at) BETWEEN ? AND ?
    GROUP BY p.payment_method
  `, [startDate, endDate], (err, paymentData) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }

    // Get daily revenue
    db.all(`
      SELECT 
        DATE(t.created_at) as date,
        SUM(t.total) as amount,
        COUNT(DISTINCT t.id) as count
      FROM transactions t
      WHERE DATE(t.created_at) BETWEEN ? AND ?
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
    `, [startDate, endDate], (err, dailyRevenue) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      // Get top selling equipment
      db.all(`
        SELECT 
          e.name,
          SUM(ti.quantity) as quantity,
          SUM(ti.subtotal) as revenue
        FROM transaction_items ti
        JOIN equipment e ON ti.equipment_id = e.id
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        GROUP BY e.id
        ORDER BY SUM(ti.subtotal) DESC
        LIMIT 10
      `, [startDate, endDate], (err, topEquipment) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: err.message });
        }

        // Get inventory valuation
        db.all(`
          SELECT 
            SUM(e.quantity_in_stock * e.price) as inventory_value,
            SUM(e.quantity_in_stock) as total_items
          FROM equipment e
          WHERE deleted_at IS NULL
        `, (err, inventoryData) => {
          db.close();
          if (err) return res.status(500).json({ error: err.message });

          // Calculate aggregates
          const paymentMethods = {};
          const paymentMethodCounts = {};
          let totalRevenue = 0;
          let totalTransactions = 0;
          let totalTax = 0;
          let totalDiscount = 0;

          paymentData.forEach(row => {
            if (row.payment_method) {
              paymentMethods[row.payment_method] = (paymentMethods[row.payment_method] || 0) + (row.payment_amount || 0);
              paymentMethodCounts[row.payment_method] = (paymentMethodCounts[row.payment_method] || 0) + (row.payment_count || 0);
            }
            totalRevenue += row.total_revenue || 0;
            totalTransactions += row.total_transactions || 0;
            totalTax += row.total_tax || 0;
            totalDiscount += row.total_discount || 0;
          });

          const summary = {
            totalRevenue: totalRevenue || 0,
            totalTransactions: totalTransactions || 0,
            averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
            totalTax: totalTax || 0,
            totalDiscount: totalDiscount || 0,
            paymentMethods: paymentMethods,
            paymentMethodCounts: paymentMethodCounts,
            dailyRevenue: dailyRevenue || [],
            topEquipment: topEquipment || [],
            equipmentInventoryValue: inventoryData[0]?.inventory_value || 0,
            equipmentCost: inventoryData[0]?.inventory_value || 0,
          };

          res.json(summary);
        });
      });
    });
  });
});

// GET /api/finance/export - export financial data
app.get('/api/finance/export', (req, res) => {
  const { startDate, endDate, format } = req.query;
  const db = dbAdapter.getDb();

  if (!startDate || !endDate || !format) {
    db.close();
    return res.status(400).json({ error: 'startDate, endDate, and format are required' });
  }

  // Get transaction data
  db.all(`
    SELECT 
      t.transaction_number,
      t.type,
      t.subtotal,
      t.tax,
      t.discount,
      t.total,
      t.created_at,
      p.payment_method,
      p.amount as paid_amount,
      d.name as diver_name,
      COUNT(ti.id) as item_count
    FROM transactions t
    LEFT JOIN payments p ON t.id = p.transaction_id
    LEFT JOIN divers d ON t.diver_id = d.id
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    WHERE DATE(t.created_at) BETWEEN ? AND ?
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `, [startDate, endDate], (err, transactions) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: err.message });
    }

    db.close();

    // Convert to CSV
    if (format === 'csv') {
      const headers = ['Transaction #', 'Date', 'Diver', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method', 'Amount Paid', 'Items'];
      const rows = transactions.map(t => [
        t.transaction_number || '',
        t.created_at || '',
        t.diver_name || 'Walk-in',
        t.subtotal || 0,
        t.tax || 0,
        t.discount || 0,
        t.total || 0,
        t.payment_method || 'N/A',
        t.paid_amount || 0,
        t.item_count || 0,
      ]);

      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="financial-report-${startDate}-${endDate}.csv"`);
      res.send(csv);
    } else if (format === 'excel') {
      // For Excel, we'll send a structured JSON that can be parsed on frontend
      res.json({
        format: 'excel',
        data: transactions,
        startDate,
        endDate,
      });
    } else if (format === 'pdf') {
      // For PDF, send data that can be rendered on frontend
      res.json({
        format: 'pdf',
        data: transactions,
        startDate,
        endDate,
        title: 'Financial Report',
      });
    } else {
      res.status(400).json({ error: 'Invalid format' });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
