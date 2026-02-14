// Simple API client for the local SQLite backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const userId = 'user-1'; // In production, get from auth

export const apiClient = {
  async request(method: string, path: string, body: Record<string, unknown> | null = null) {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': userId,
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
};
