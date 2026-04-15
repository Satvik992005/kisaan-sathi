/* ─── Chat Module (Socket.IO) ─────────────────────────────────── */

let chatHistory = [];

/* ─── Load All Users ────────────────────────────────────────────── */
async function loadChatUsers() {
  if (!KS.user) return;

  const data = await apiRequest('/chat/users');
  const listEl = document.getElementById('chat-users-list');
  if (!listEl) return;

  if (!data.success || !data.users.length) {
    listEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--c-text-muted);font-size:0.85rem">
      <div style="font-size:2rem;margin-bottom:8px">👻</div>
      No other users yet. Ask someone to register!
    </div>`;
    return;
  }

  listEl.innerHTML = data.users.map(u => `
    <div class="chat-user-item" data-user-id="${u._id}" onclick="openChat('${u._id}','${escHtml(u.name)}')">
      <div class="chat-user-avatar">
        ${u.name[0].toUpperCase()}
        <span class="online-dot" style="display:none"></span>
      </div>
      <div class="chat-user-info">
        <div class="chat-user-name">${escHtml(u.name)}</div>
        <div class="chat-user-role">${u.role} · ${escHtml(u.location || 'India')}</div>
      </div>
    </div>`).join('');
}

/* ─── Open Chat with a User ─────────────────────────────────────── */
async function openChat(userId, userName) {
  KS.chatReceiverId   = userId;
  KS.chatReceiverName = userName;

  // Highlight selected user
  document.querySelectorAll('.chat-user-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.chat-user-item[data-user-id="${userId}"]`)?.classList.add('active');

  // Show chat area
  document.getElementById('chat-placeholder').style.display = 'none';
  const activeChat = document.getElementById('chat-active');
  activeChat.style.display = 'flex';

  document.getElementById('chat-user-avatar').textContent = userName[0].toUpperCase();
  document.getElementById('chat-user-name').textContent   = userName;
  document.getElementById('chat-user-status').textContent = 'Loading history…';

  // Load history
  const messagesEl = document.getElementById('chat-messages');
  messagesEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--c-text-dim)">Loading messages…</div>';

  const data = await apiRequest(`/chat/history/${userId}`);
  document.getElementById('chat-user-status').textContent = 'Online';

  if (!data.success) {
    messagesEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--c-error)">Failed to load messages.</div>`;
    return;
  }

  chatHistory = data.messages || [];
  messagesEl.innerHTML = '';

  if (chatHistory.length === 0) {
    messagesEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--c-text-dim);font-size:0.85rem">No messages yet. Say hello! 👋</div>`;
  } else {
    chatHistory.forEach(m => {
      const type = String(m.senderId) === String(KS.user.id) ? 'sent' : 'received';
      appendMessage(m.message, type, m.timestamp, false);
    });
  }
  scrollChatToBottom();
}

/* ─── Send Message ──────────────────────────────────────────────── */
function sendMessage() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text || !KS.chatReceiverId) return;

  if (!KS.socket) {
    toast.error('Chat Unavailable', 'Socket not connected. Is backend running?');
    return;
  }

  input.value = '';
  KS.socket.emit('sendMessage', {
    senderId:   KS.user.id,
    receiverId: KS.chatReceiverId,
    message:    text
  });
}

function handleChatEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

/* ─── Append a Message Bubble ───────────────────────────────────── */
function appendMessage(text, type = 'sent', timestamp = new Date(), scroll = true) {
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;

  // Clear placeholder on first real message
  if (messagesEl.querySelector('div[style]')) messagesEl.innerHTML = '';

  const time = formatTime(timestamp);
  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${type}`;
  bubble.innerHTML = `
    <div class="msg-content">${escHtml(text)}</div>
    <div class="msg-time">${time}</div>`;
  messagesEl.appendChild(bubble);
  if (scroll) scrollChatToBottom();
}

function scrollChatToBottom() {
  const el = document.getElementById('chat-messages');
  if (el) el.scrollTop = el.scrollHeight;
}

/* ─── Init Chat Section ─────────────────────────────────────────── */
function initChat() {
  if (!KS.user) { openAuthModal('login'); return; }
  loadChatUsers();
}
