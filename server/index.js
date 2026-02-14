import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getDb, initDb } from './db.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
await initDb();

// Simple auth middleware (for now, accepts any request with a user-id header)
function authMiddleware(req, res, next) {
  req.userId = req.headers['x-user-id'] || 'user-1';
  next();
}

app.use(authMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// GET /api/groups - list all groups with leader and members
app.get('/api/groups', (req, res) => {
  const db = getDb();

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

  const db = getDb();
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

  const db = getDb();
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

  const db = getDb();
  db.run('DELETE FROM group_members WHERE id = ?', [memberId], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// GET /api/divers - list all divers (for dropdowns)
app.get('/api/divers', (req, res) => {
  const db = getDb();

  db.all('SELECT id, name FROM divers ORDER BY name ASC', (err, divers) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(divers || []);
  });
});

// POST /api/divers - create a diver (for testing)
app.post('/api/divers', (req, res) => {
  const { name, email } = req.body;
  const id = uuidv4();

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const db = getDb();
  db.run(
    'INSERT INTO divers (id, name, email) VALUES (?, ?, ?)',
    [id, name, email],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT id, name FROM divers WHERE id = ?', [id], (err, diver) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(diver);
      });
    }
  );
});

// GET /api/courses - list all courses
app.get('/api/courses', (req, res) => {
  const db = getDb();
  db.all('SELECT id, name, price FROM courses ORDER BY name ASC', (err, courses) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(courses || []);
  });
});

// POST /api/courses - create a course
app.post('/api/courses', (req, res) => {
  const { name, price, duration_days, description } = req.body;
  const id = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const db = getDb();
  db.run(
    'INSERT INTO courses (id, name, price, duration_days, description) VALUES (?, ?, ?, ?, ?)',
    [id, name, price || 0, duration_days || null, description || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT id, name, price FROM courses WHERE id = ?', [id], (err, course) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json(course);
      });
    }
  );
});

// GET /api/accommodations - list all accommodations
app.get('/api/accommodations', (req, res) => {
  const db = getDb();
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

  const db = getDb();
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
  const db = getDb();

  db.all(`
    SELECT 
      b.id, b.diver_id, b.course_id, b.accommodation_id, b.check_in, b.check_out,
      b.total_amount, b.invoice_number, b.payment_status, b.notes, b.created_at,
      d.name as diver_name,
      c.name as course_name, c.price as course_price,
      a.name as accommodation_name, a.price_per_night, a.tier
    FROM bookings b
    LEFT JOIN divers d ON b.diver_id = d.id
    LEFT JOIN courses c ON b.course_id = c.id
    LEFT JOIN accommodations a ON b.accommodation_id = a.id
    ORDER BY b.created_at DESC
  `, (err, bookings) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    
    const result = (bookings || []).map(b => ({
      id: b.id,
      diver_id: b.diver_id,
      course_id: b.course_id,
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
      accommodations: { name: b.accommodation_name, price_per_night: b.price_per_night, tier: b.tier }
    }));
    res.json(result);
  });
});

// GET /api/bookings/stats/last30days - get bookings and revenue for last 30 days
app.get('/api/bookings/stats/last30days', (req, res) => {
  const db = getDb();
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
  const { diver_id, course_id, accommodation_id, check_in, check_out, total_amount, notes } = req.body;
  const id = uuidv4();
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  if (!diver_id) {
    return res.status(400).json({ error: 'diver_id is required' });
  }

  const db = getDb();
  db.run(
    `INSERT INTO bookings (id, diver_id, course_id, accommodation_id, check_in, check_out, total_amount, invoice_number, payment_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`,
    [id, diver_id, course_id || null, accommodation_id || null, check_in || null, check_out || null, total_amount || 0, invoiceNumber, notes || null],
    (err) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      db.get(`
        SELECT 
          b.id, b.diver_id, b.course_id, b.accommodation_id, b.check_in, b.check_out,
          b.total_amount, b.invoice_number, b.payment_status, b.notes, b.created_at,
          d.name as diver_name,
          c.name as course_name, c.price as course_price,
          a.name as accommodation_name, a.price_per_night, a.tier
        FROM bookings b
        LEFT JOIN divers d ON b.diver_id = d.id
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN accommodations a ON b.accommodation_id = a.id
        WHERE b.id = ?
      `, [id], (err, booking) => {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          id: booking.id,
          diver_id: booking.diver_id,
          course_id: booking.course_id,
          accommodation_id: booking.accommodation_id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          total_amount: booking.total_amount,
          invoice_number: booking.invoice_number,
          payment_status: booking.payment_status,
          notes: booking.notes,
          created_at: booking.created_at,
          divers: { name: booking.diver_name },
          courses: { name: booking.course_name, price: booking.course_price },
          accommodations: { name: booking.accommodation_name, price_per_night: booking.price_per_night, tier: booking.tier }
        });
      });
    }
  );
});

// PATCH /api/bookings/:id - update payment status
app.patch('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  const db = getDb();
  db.run('UPDATE bookings SET payment_status = ? WHERE id = ?', [payment_status, id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// DELETE /api/bookings/:id - delete a booking
app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;

  const db = getDb();
  db.run('DELETE FROM bookings WHERE id = ?', [id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
