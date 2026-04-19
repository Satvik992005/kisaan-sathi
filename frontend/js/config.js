/* ─── Global Config & API Helpers ─────────────────────────────── */

// Dynamically point to backend backend when testing locally (unless we are served BY the backend server)
let BACKEND_URL = '';
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
  if (window.location.port !== '5000') {
    BACKEND_URL = 'http://localhost:5000';
  }
}

const API_URL    = `${BACKEND_URL}/api`;
const SOCKET_URL = BACKEND_URL;

/* ─── Global App State ────────────────────────────────────────── */
window.KS = {
  user:    null,
  token:   null,
  socket:  null,
  currentSection: 'home',
  selectedCategory: 'all',
  productsPage: 1,
  chatReceiverId: null,
  chatReceiverName: null
};

/* ─── API Request Helper ───────────────────────────────────────── */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (KS.token) headers['Authorization'] = `Bearer ${KS.token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res  = await fetch(`${API_URL}${endpoint}`, opts);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API error:', err);
    return { success: false, message: 'Cannot connect to server. Is the backend running?' };
  }
}

/* ─── Loader ───────────────────────────────────────────────────── */
function showLoader() { document.getElementById('loader').classList.remove('hidden'); }
function hideLoader() { document.getElementById('loader').classList.add('hidden'); }

/* ─── Debounce ─────────────────────────────────────────────────── */
function debounce(fn, delay = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
const debounceSearch = debounce(() => loadMarketplace(true), 400);

/* ─── Format Currency ──────────────────────────────────────────── */
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Format Date ──────────────────────────────────────────────── */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ─── Category Emoji Map ───────────────────────────────────────── */
const CAT_EMOJI = {
  grain: '🌾', vegetable: '🥦', fruit: '🍎',
  pulse: '🫘', oilseed: '🌻', spice: '🌶️', other: '📦'
};
