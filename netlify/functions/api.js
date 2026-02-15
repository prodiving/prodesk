import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
};

const sendJson = (statusCode, data) => ({
  statusCode,
  headers,
  body: JSON.stringify(data || {}),
});

const sendError = (statusCode, message) =>
  sendJson(statusCode, { error: message });

export default async (req, context) => {
  const path = req.path || req.url.split('?')[0];
  const method = req.method;
  let body = null;

  try {
    if (req.body) body = JSON.parse(req.body);
  } catch (e) {
    // Invalid JSON - continue without body
  }

  if (method === 'OPTIONS') {
    return sendJson(200, {});
  }

  try {
    if (path === '/health' || path.endsWith('/health')) {
      return sendJson(200, { ok: true });
    }

    // GET /api/divers
    if (path.includes('/api/divers') && method === 'GET' && !path.includes('/api/divers/')) {
      const { data, error } = await supabase
        .from('divers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return sendJson(200, data || []);
    }

    // GET /api/divers/:id
    if (path.includes('/api/divers/') && method === 'GET') {
      const id = path.split('/').pop();
      const { data, error } = await supabase
        .from('divers')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? sendJson(200, data) : sendError(404, 'Not found');
    }

    // POST /api/divers
    if (path.includes('/api/divers') && method === 'POST' && !path.includes('/api/divers/')) {
      const { name, email, phone, certification_level, medical_cleared } = body || {};
      if (!name || !email) {
        return sendError(400, 'name and email are required');
      }
      const { data, error } = await supabase
        .from('divers')
        .insert([
          {
            id: uuidv4(),
            name,
            email,
            phone: phone || null,
            certification_level: certification_level || null,
            medical_cleared: medical_cleared ? true : false,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return sendJson(201, data);
    }

    // PUT /api/divers/:id
    if (path.includes('/api/divers/') && method === 'PUT') {
      const id = path.split('/').pop();
      const { name, email, phone, certification_level, medical_cleared } = body || {};
      const { data, error } = await supabase
        .from('divers')
        .update({
          name,
          email,
          phone: phone || null,
          certification_level: certification_level || null,
          medical_cleared: medical_cleared ? true : false,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return sendJson(200, data);
    }

    // GET /api/bookings
    if (path.includes('/api/bookings') && method === 'GET' && !path.includes('/api/bookings/')) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, divers(name), courses(name, price), groups(name, days), accommodations(name, price_per_night, tier)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Format response to match expected structure
      const formatted = (data || []).map(b => ({
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
        divers: b.divers ? { name: b.divers.name } : { name: null },
        courses: b.courses ? { name: b.courses.name, price: b.courses.price } : { name: null, price: null },
        groups: b.groups ? { name: b.groups.name, days: b.groups.days } : { name: null, days: null },
        accommodations: b.accommodations ? { name: b.accommodations.name, price_per_night: b.accommodations.price_per_night, tier: b.accommodations.tier } : { name: null, price_per_night: null, tier: null }
      }));
      return sendJson(200, formatted);
    }

    // GET /api/bookings/stats/last30days
    if (path.includes('/api/bookings/stats/last30days') && method === 'GET') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('bookings')
        .select('id, total_amount, payment_status, created_at')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      
      const booking_count = (data || []).length;
      const total_revenue = (data || [])
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const total_amount = (data || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);
      
      return sendJson(200, { booking_count, total_revenue, total_amount });
    }

    // POST /api/bookings
    if (path.includes('/api/bookings') && method === 'POST' && !path.includes('/api/bookings/')) {
      const {
        diver_id,
        course_id,
        group_id,
        accommodation_id,
        check_in,
        check_out,
        total_amount,
        notes,
      } = body || {};
      if (!diver_id) {
        return sendError(400, 'diver_id is required');
      }
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            id: uuidv4(),
            diver_id,
            course_id: course_id || null,
            group_id: group_id || null,
            accommodation_id: accommodation_id || null,
            check_in: check_in || null,
            check_out: check_out || null,
            total_amount: total_amount || 0,
            invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
            payment_status: 'unpaid',
            notes: notes || null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return sendJson(201, data);
    }

    // PUT /api/bookings/:id
    if (path.includes('/api/bookings/') && method === 'PUT') {
      const id = path.split('/').pop();
      const {
        diver_id,
        course_id,
        group_id,
        accommodation_id,
        check_in,
        check_out,
        total_amount,
        payment_status,
        notes,
      } = body || {};
      const { data, error } = await supabase
        .from('bookings')
        .update({
          diver_id,
          course_id: course_id || null,
          group_id: group_id || null,
          accommodation_id: accommodation_id || null,
          check_in: check_in || null,
          check_out: check_out || null,
          total_amount: total_amount || 0,
          payment_status: payment_status || 'unpaid',
          notes: notes || null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return sendJson(200, data);
    }

    // GET /api/courses
    if (path.includes('/api/courses') && method === 'GET') {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return sendJson(200, data || []);
    }

    // POST /api/courses
    if (path.includes('/api/courses') && method === 'POST') {
      const {
        name,
        price,
        duration_days,
        description,
        instructor_id,
        boat_id,
        start_date,
        end_date,
        max_students,
      } = body || {};
      if (!name) {
        return sendError(400, 'name is required');
      }
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            id: uuidv4(),
            name,
            price: price || 0,
            duration_days: duration_days || null,
            description: description || null,
            instructor_id: instructor_id || null,
            boat_id: boat_id || null,
            start_date: start_date || null,
            end_date: end_date || null,
            max_students: max_students || 6,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return sendJson(201, data);
    }

    // GET /api/groups
    if (path.includes('/api/groups') && method === 'GET') {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return sendJson(200, data || []);
    }

    // GET /api/accommodations
    if (path.includes('/api/accommodations') && method === 'GET') {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return sendJson(200, data || []);
    }

    // GET /api/equipment
    if (path.includes('/api/equipment') && method === 'GET' && !path.includes('/api/equipment/')) {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return sendJson(200, data || []);
    }

    return sendError(404, 'Endpoint not found');
  } catch (error) {
    console.error('API Error:', error);
    const message = error?.message || 'Internal server error';
    return sendError(500, message);
  }
};
