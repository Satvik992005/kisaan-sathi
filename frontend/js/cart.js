/* ─── Cart Module ─────────────────────────────────────────────── */

/* Cart stored in memory + localStorage */
let cartItems = [];

function cartLoad() {
  try {
    cartItems = JSON.parse(localStorage.getItem('ks_cart') || '[]');
  } catch { cartItems = []; }
  updateCartBadge();
}

function cartSave() {
  localStorage.setItem('ks_cart', JSON.stringify(cartItems));
  updateCartBadge();
}

function cartClear() {
  cartItems = [];
  cartSave();
  renderCartPage();
}

function updateCartBadge() {
  const total = cartItems.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

/* ─── Add To Cart ───────────────────────────────────────────────── */
function addToCart(id, name, price, emoji = '🌾') {
  if (!KS.user) { openAuthModal('login'); return; }

  const existing = cartItems.find(i => i.id === id);
  if (existing) {
    existing.qty++;
    toast.success('Quantity Updated', `${name} qty: ${existing.qty}`);
  } else {
    cartItems.push({ id, name, price: Number(price), emoji, qty: 1 });
    toast.success('Added to Cart! 🛒', name);
  }
  cartSave();
}

/* ─── Remove from Cart ──────────────────────────────────────────── */
function removeFromCart(id) {
  cartItems = cartItems.filter(i => i.id !== id);
  cartSave();
  renderCartPage();
}

/* ─── Update Qty ────────────────────────────────────────────────── */
function updateQty(id, delta) {
  const item = cartItems.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  cartSave();
  renderCartPage();
}

/* ─── Cart Totals ───────────────────────────────────────────────── */
function getCartTotals() {
  const sub  = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const gst  = sub * 0.05;
  const total = sub + gst;
  return { sub, gst, total };
}

/* ─── Render Cart Page ──────────────────────────────────────────── */
function renderCartPage() {
  const list = document.getElementById('cart-items-list');
  if (!list) return;

  if (cartItems.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Browse the marketplace and add some fresh produce!</p>
        <button class="btn btn-primary" onclick="showSection('marketplace')">Browse Marketplace</button>
      </div>`;
    updateCartSummary({ sub: 0, gst: 0, total: 0 });
    return;
  }

  list.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <span class="cart-item-emoji">${item.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(item.name)}</div>
        <div class="cart-item-price">${formatINR(item.price)} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-total">${formatINR(item.price * item.qty)}</div>
      <button class="cart-remove" onclick="removeFromCart('${item.id}')" title="Remove">🗑</button>
    </div>`).join('');

  updateCartSummary(getCartTotals());
}

function updateCartSummary({ sub, gst, total }) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('cart-subtotal', formatINR(sub));
  set('cart-gst',      formatINR(gst));
  set('cart-total',    formatINR(total));
}

/* ─── Proceed to Checkout ───────────────────────────────────────── */
function proceedToCheckout() {
  if (!KS.user) { openAuthModal('login'); return; }
  if (cartItems.length === 0) { toast.warning('Cart Empty', 'Add items first!'); return; }
  showSection('checkout');
  renderCheckoutPage();
}
