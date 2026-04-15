/* ─── Auth Module ─────────────────────────────────────────────── */

function openAuthModal(tab = 'login') {
  document.getElementById('auth-modal').classList.add('active');
  switchAuthTab(tab);
}
function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('active');
}
function handleModalBackdrop(e) {
  if (e.target === document.getElementById('auth-modal')) closeAuthModal();
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('login-form').style.display    = isLogin ? '' : 'none';
  document.getElementById('register-form').style.display = isLogin ? 'none' : '';
  document.getElementById('login-tab-btn').classList.toggle('active', isLogin);
  document.getElementById('register-tab-btn').classList.toggle('active', !isLogin);
}

/* ─── Login ────────────────────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch("https://kisaan-sathi.onrender.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("ks_token", data.token);
      localStorage.setItem("ks_user", JSON.stringify(data.user));

      alert("Login successful ✅");
      closeAuthModal();
      location.reload();
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

/* ─── Register ─────────────────────────────────────────────────── */
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-submit-btn');

  const payload = {
    name:     document.getElementById('reg-name').value.trim(),
    email:    document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value,
    role:     document.getElementById('reg-role').value,
    phone:    document.getElementById('reg-phone').value.trim(),
    location: document.getElementById('reg-location').value.trim()
  };

  if (!payload.name || !payload.email || !payload.password)
    return toast.error('Missing Fields', 'Please fill all required fields.');

  btn.disabled = true; btn.querySelector('.btn-text').textContent = 'Creating account…';

  const data = await apiRequest('/auth/register', 'POST', payload);

  btn.disabled = false; btn.querySelector('.btn-text').textContent = 'Create Account';

  if (data.success) {
    saveAuthData(data.token, data.user);
    closeAuthModal();
    toast.success('Welcome to Kisaan Sathi! 🌱', `Account created successfully`);
    setAuthState(data.user);
    showSection('home');
  } else {
    toast.error('Registration Failed', data.message);
  }
}

/* ─── Logout ───────────────────────────────────────────────────── */
function logout() {
  localStorage.removeItem('ks_token');
  localStorage.removeItem('ks_user');
  KS.user  = null;
  KS.token = null;
  if (KS.socket) { KS.socket.disconnect(); KS.socket = null; }
  clearAuthState();
  cartClear();
  showSection('home');
  toast.info('Logged Out', 'See you again soon!');
}

/* ─── Save auth data ────────────────────────────────────────────── */
function saveAuthData(token, user) {
  KS.token = token;
  KS.user  = user;
  localStorage.setItem('ks_token', token);
  localStorage.setItem('ks_user', JSON.stringify(user));
}

/* ─── Update UI for logged-in user ─────────────────────────────── */
function setAuthState(user) {
  KS.user = user;

  // Navbar
  document.getElementById('guest-actions').style.display = 'none';
  document.getElementById('user-nav').style.display      = 'flex';
  document.getElementById('nav-user-name').textContent   = user.name;
  document.getElementById('nav-user-role').textContent   = user.role;
  document.getElementById('nav-avatar').textContent      = user.name[0].toUpperCase();

  // Auth-required elements
  document.querySelectorAll('.auth-required').forEach(el => el.style.display = '');

  // Cart button
  document.getElementById('cart-nav-btn').style.display = '';

  // Farmer-only items (Dashboard)
  const dashLink = document.querySelector('.farmer-only');
  if (dashLink) {
    dashLink.parentElement.style.display = user.role === 'farmer' ? '' : 'none';
  }
  const farmerAddBtn = document.getElementById('marketplace-farmer-add');
  if (farmerAddBtn) farmerAddBtn.style.display = user.role === 'farmer' ? '' : 'none';

  // Initialize socket
  initSocket(user.id);
}

/* ─── Clear auth state ──────────────────────────────────────────── */
function clearAuthState() {
  document.getElementById('guest-actions').style.display = '';
  document.getElementById('user-nav').style.display      = 'none';
  document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
  document.getElementById('cart-nav-btn').style.display  = 'none';
}

/* ─── Initialize Socket ─────────────────────────────────────────── */
function initSocket(userId) {
  if (typeof io === 'undefined') return;
  if (KS.socket) KS.socket.disconnect();

  KS.socket = io(SOCKET_URL);
  KS.socket.emit('userOnline', userId);

  KS.socket.on('onlineUsers', (users) => {
    document.querySelectorAll('.online-dot').forEach(d => {
      const uid = d.closest('.chat-user-item')?.dataset.userId;
      d.style.display = users.includes(uid) ? '' : 'none';
    });
  });

  KS.socket.on('receiveMessage', (msg) => {
    // Show notification if not in chat section
    if (KS.currentSection !== 'chat') {
      toast.info('New Message 💬', `From ${msg.senderName || 'Someone'}`);
    }
    // Append if in active chat
    if (KS.chatReceiverId === msg.senderId) {
      appendMessage(msg.message, 'received', msg.timestamp);
    }
  });

  KS.socket.on('messageSent', (msg) => {
    appendMessage(msg.message, 'sent', msg.timestamp);
  });
}
