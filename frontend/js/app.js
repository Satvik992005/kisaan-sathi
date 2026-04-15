const BASE_URL = "https://kisaan-sathi.onrender.com";
/* ─── Main App Controller ─────────────────────────────────────── */

/* ─── Navigation ────────────────────────────────────────────────── */
function showSection(name) {
  // Auth guard
  const protectedSections = ['dashboard', 'cart', 'checkout', 'orders', 'chat'];
  if (protectedSections.includes(name) && !KS.user) {
    openAuthModal('login');
    toast.info('Login Required', 'Please login to access this page.');
    return;
  }
  // Farmer guard
  if (name === 'dashboard' && KS.user && KS.user.role !== 'farmer') {
    toast.warning('Farmers Only', 'The dashboard is for farmers. Register as a farmer to access it.');
    return;
  }

  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  // Show target section
  const target = document.getElementById(`section-${name}`);
  if (!target) return;
  target.classList.add('active');
  KS.currentSection = name;

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === name);
  });

  // Close mobile menu
  document.getElementById('nav-links')?.classList.remove('open');

  // Section-specific init
  switch (name) {
    case 'marketplace': loadMarketplace(true); break;
    case 'dashboard':   loadDashboard();       break;
    case 'orders':      loadOrders();          break;
    case 'chat':        initChat();            break;
    case 'cart':        renderCartPage();      break;
    case 'checkout':    renderCheckoutPage();  break;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── Mobile Menu ───────────────────────────────────────────────── */
function toggleMobileMenu() {
  document.getElementById('nav-links').classList.toggle('open');
}

/* ─── Navbar scroll effect ──────────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
});

/* ─── App Initialization ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Restore auth from localStorage
  const storedToken = localStorage.getItem('ks_token');
  const storedUser  = localStorage.getItem('ks_user');

  if (storedToken && storedUser) {
    try {
      KS.token = storedToken;
      KS.user  = JSON.parse(storedUser);
      setAuthState(KS.user);
    } catch {
      localStorage.removeItem('ks_token');
      localStorage.removeItem('ks_user');
    }
  }

  // Load cart
  cartLoad();

  // Show home by default
  showSection('home');

  // Hide loader
  setTimeout(() => hideLoader(), 600);
});

/* ─── Keyboard shortcuts ────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAuthModal();
    document.getElementById('nav-links')?.classList.remove('open');
  }
});

/* ─── TEMP REGISTER USER (TEST) ───────────────────────── */

async function testRegister() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Satvik",
        email: "satvik@gmail.com",
        password: "123456"
      })
    });

    const data = await res.json();
    console.log("Register Response:", data);

  } catch (err) {
    console.error("Register Error:", err);
  }
}

// Run once
testRegister();

/* ─── Backend Connection Test ───────────────────────── */

async function testLoginConnection() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "test@gmail.com",
        password: "123456"
      })
    });

    const data = await res.json();
    console.log("Backend Response:", data);

  } catch (err) {
    console.error("Connection Error:", err);
  }
}

// Run once to test connection
testLoginConnection();
