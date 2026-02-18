// Simple API client for local and production deployment
// Locally uses Express server at localhost:3000
// On Netlify/Production uses VITE_API_URL (Railway backend)

const isBrowser = typeof window !== 'undefined';
const isDevelopment = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE_URL = isDevelopment ? (import.meta.env.VITE_API_URL || 'http://localhost:3000') : (import.meta.env.VITE_API_URL || '');
const userId = 'user-1'; // In production, get from auth

export const apiClient = {
  async request(method: string, path: string, body: Record<string, unknown> | null = null) {
    const headers = {
      'Content-Type': 'application/json',
      // Removed x-user-id, server will use IP
    };

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  groups: {
    list: () => apiClient.request('GET', '/api/groups'),
    create: (payload) => apiClient.request('POST', '/api/groups', payload),
    addMember: (groupId, payload) => apiClient.request('POST', `/api/groups/${groupId}/members`, payload),
    removeMember: (groupId, memberId) => apiClient.request('DELETE', `/api/groups/${groupId}/members/${memberId}`),
  },

  divers: {
    list: () => apiClient.request('GET', '/api/divers'),
    get: (id) => apiClient.request('GET', `/api/divers/${id}`),
    create: (payload) => apiClient.request('POST', '/api/divers', payload),
    update: (id, payload) => apiClient.request('PUT', `/api/divers/${id}`, payload),
    delete: (id) => apiClient.request('DELETE', `/api/divers/${id}`),
    completeOnboarding: (id) => apiClient.request('PATCH', `/api/divers/${id}/onboarding`, {}),
  },

  courses: {
    list: () => apiClient.request('GET', '/api/courses'),
    create: (payload) => apiClient.request('POST', '/api/courses', payload),
    delete: (id) => apiClient.request('DELETE', `/api/courses/${id}`),
  },

  instructors: {
    list: () => apiClient.request('GET', '/api/instructors'),
    create: (payload) => apiClient.request('POST', '/api/instructors', payload),
  },

  boats: {
    list: () => apiClient.request('GET', '/api/boats'),
    create: (payload) => apiClient.request('POST', '/api/boats', payload),
  },

  accommodations: {
    list: () => apiClient.request('GET', '/api/accommodations'),
    create: (payload) => apiClient.request('POST', '/api/accommodations', payload),
  },

  bookings: {
    list: () => apiClient.request('GET', '/api/bookings'),
    create: (payload) => apiClient.request('POST', '/api/bookings', payload),
    update: (id, payload) => apiClient.request('PUT', `/api/bookings/${id}`, payload),
    delete: (id) => apiClient.request('DELETE', `/api/bookings/${id}`),
    getLast30Days: () => apiClient.request('GET', '/api/bookings/stats/last30days'),
    updateStatus: (id, status) => apiClient.request('PATCH', `/api/bookings/${id}`, { payment_status: status }),
  },

  waivers: {
    list: () => apiClient.request('GET', '/api/waivers'),
    get: (diverID) => apiClient.request('GET', `/api/waivers/${diverID}`),
    create: (payload) => apiClient.request('POST', '/api/waivers', payload),
  },

  diveSites: {
    list: () => apiClient.request('GET', '/api/dive-sites'),
    create: (payload) => apiClient.request('POST', '/api/dive-sites', payload),
    delete: (id) => apiClient.request('DELETE', `/api/dive-sites/${id}`),
  },

  groupItinerary: {
    get: (groupId) => apiClient.request('GET', `/api/groups/${groupId}/itinerary`),
    updateDay: (groupId, payload) => apiClient.request('POST', `/api/groups/${groupId}/itinerary`, payload),
  },

  equipment: {
    list: () => apiClient.request('GET', '/api/equipment'),
    get: (id) => apiClient.request('GET', `/api/equipment/${id}`),
    create: (payload) => apiClient.request('POST', '/api/equipment', payload),
    update: (id, payload) => apiClient.request('PUT', `/api/equipment/${id}`, payload),
    delete: (id) => apiClient.request('DELETE', `/api/equipment/${id}`),
  },

  rentalAssignments: {
    list: (bookingId) => apiClient.request('GET', `/api/rental-assignments${bookingId ? `?booking_id=${bookingId}` : ''}`),
    create: (payload) => apiClient.request('POST', '/api/rental-assignments', payload),
    delete: (id) => apiClient.request('DELETE', `/api/rental-assignments/${id}`),
  },

  transactions: {
    list: () => apiClient.request('GET', '/api/transactions'),
    get: (id) => apiClient.request('GET', `/api/transactions/${id}`),
    create: (payload) => apiClient.request('POST', '/api/transactions', payload),
  },

  payments: {
    list: () => apiClient.request('GET', '/api/payments'),
    create: (payload) => apiClient.request('POST', '/api/payments', payload),
  },

  pos: {
    getSummary: () => apiClient.request('GET', '/api/pos/summary'),
  },
};
