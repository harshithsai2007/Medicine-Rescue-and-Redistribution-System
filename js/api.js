// Frontend API Layer — replaces localStorage db.js
// All calls go to Express backend which talks to MongoDB

const BASE = '/api';

function getToken() {
  return localStorage.getItem('mrrs_token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request(method, path, body = null) {
  const opts = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Server error');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  const user = await request('POST', '/auth/login', { email, password });
  localStorage.setItem('mrrs_token', user.token);
  localStorage.setItem('mrrs_current_user', JSON.stringify(user));
  return user;
}

export async function apiRegister(payload) {
  const user = await request('POST', '/auth/register', payload);
  return user;
}

export function apiLogout() {
  localStorage.removeItem('mrrs_token');
  localStorage.removeItem('mrrs_current_user');
}

export function getCurrentUser() {
  const raw = localStorage.getItem('mrrs_current_user');
  return raw ? JSON.parse(raw) : null;
}

// ── Donations ─────────────────────────────────────────────────────────────────
export async function getDonations() {
  return request('GET', '/donations');
}

export async function addDonation(data) {
  return request('POST', '/donations', data);
}

export async function approveDonation(id) {
  return request('PUT', `/donations/${id}/approve`);
}

export async function rejectDonation(id, rejectionReason) {
  return request('PUT', `/donations/${id}/reject`, { rejectionReason });
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export async function getInventory() {
  return request('GET', '/inventory');
}

// ── Requests ──────────────────────────────────────────────────────────────────
export async function getRequests() {
  return request('GET', '/requests');
}

export async function createRequest(inventoryId, quantity) {
  return request('POST', '/requests', { inventoryId, quantity });
}

export async function approveRequest(id) {
  return request('PUT', `/requests/${id}/approve`);
}

export async function deliverRequest(id) {
  return request('PUT', `/requests/${id}/deliver`);
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  return request('GET', '/admin/stats');
}

export async function getCharities() {
  return request('GET', '/admin/charities');
}

export async function approveCharity(id) {
  return request('PUT', `/admin/charities/${id}/approve`);
}

export async function rejectCharity(id) {
  return request('DELETE', `/admin/charities/${id}/reject`);
}

export async function getAllUsers() {
  return request('GET', '/admin/users');
}

// ── Public stats (no auth needed — uses token if present) ─────────────────────
export async function getPublicStats() {
  try {
    // Try authenticated stats first
    if (getToken()) return await getAdminStats();
    // Fallback static values for landing page when not logged in
    return { medicinesRescued: 230, patientsHelped: 40, connectedCharities: 1, completedDonations: 4 };
  } catch {
    return { medicinesRescued: 230, patientsHelped: 40, connectedCharities: 1, completedDonations: 4 };
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
export function isCloseToExpiry(dateStr) {
  const expiry = new Date(dateStr);
  const diffDays = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
  return diffDays < 90;
}
