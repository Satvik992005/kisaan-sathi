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
    const data = await apiRequest('/auth/login', 'POST', { email, password });

    if (data.success) {
      localStorage.setItem("ks_token", data.token);
      localStorage.setItem("ks_user", JSON.stringify(data.user));

      toast.success("Login successful ✅", data.message);
      closeAuthModal();
      location.reload();
    } else {
      toast.error('Login Failed', data.message);
    }

  } catch (err) {
    console.error(err);
    toast.error("Error", "Server error");
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
  document.querySelectorAll('.farmer-only').forEach(el => {
    if (el.tagName === 'A') el.parentElement.style.display = user.role === 'farmer' ? '' : 'none';
    else el.style.display = user.role === 'farmer' ? '' : 'none';
  });
  
  const farmerAddBtn = document.getElementById('marketplace-farmer-add');
  if (farmerAddBtn) farmerAddBtn.style.display = user.role === 'farmer' ? '' : 'none';

  // Home Page Views
  const guestHome = document.getElementById('guest-home-view');
  const authHome  = document.getElementById('auth-home-view');
  if (guestHome) guestHome.style.display = 'none';
  if (authHome) {
    authHome.style.display = 'block';
    const nameEl = document.getElementById('auth-home-name');
    if (nameEl) nameEl.textContent = user.name.split(' ')[0]; // Show first name
  }

  // Initialize socket
  initSocket(user.id);
}

/* ─── Clear auth state ──────────────────────────────────────────── */
function clearAuthState() {
  document.getElementById('guest-actions').style.display = '';
  document.getElementById('user-nav').style.display      = 'none';
  document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
  document.getElementById('cart-nav-btn').style.display  = 'none';

  // Home Page Views
  const guestHome = document.getElementById('guest-home-view');
  const authHome  = document.getElementById('auth-home-view');
  if (guestHome) guestHome.style.display = 'block';
  if (authHome)  authHome.style.display = 'none';
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

/* ─── Password Show/Hide Toggle ─────────────────────────────────── */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

/* ─── Password Strength Meter ───────────────────────────────────── */
function checkPasswordStrength(password) {
  const container = document.getElementById('pwd-strength-container');
  const bar = document.getElementById('pwd-strength-bar');
  const text = document.getElementById('pwd-strength-text');
  
  if (!password) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  
  let strength = 0;
  
  if (password.length >= 6) strength += 25;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[^A-Za-z0-9]/.test(password)) strength += 10;
  
  let color = '#ef4444'; // Red (Weak)
  let label = 'Weak (Need 6+ chars, mix of numbers/letters)';
  
  if (strength >= 80) {
    color = '#22c55e'; // Green (Strong)
    label = 'Strong Password ✅';
  } else if (strength >= 50) {
    color = '#eab308'; // Yellow (Medium)
    label = 'Medium (Add symbols or numbers)';
  }
  
  bar.style.width = strength + '%';
  bar.style.backgroundColor = color;
  text.textContent = label;
  text.style.color = color;
}

