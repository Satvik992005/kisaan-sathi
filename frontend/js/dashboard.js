/* ─── Farmer Dashboard Module ─────────────────────────────────── */

async function loadDashboard() {
  if (!KS.user) { showSection('home'); openAuthModal('login'); return; }

  document.getElementById('dashboard-welcome').textContent =
    `Welcome, ${KS.user.name}! Here are your listings.`;

  const data = await apiRequest('/products/my/listings');
  if (!data.success) { toast.error('Error', data.message); return; }

  const products = data.products || [];

  // Stats
  const totalQty = products.reduce((s, p) => s + p.quantity, 0);
  const revenue  = products.reduce((s, p) => s + p.price * p.quantity, 0);
  document.getElementById('stat-products').textContent = products.length;
  document.getElementById('stat-totalqty').textContent = totalQty;
  document.getElementById('stat-revenue').textContent  = '₹' + (revenue / 1000).toFixed(1) + 'k';

  // Listings
  const listEl = document.getElementById('my-products-list');
  if (products.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p>No listings yet. Add your first crop above!</p></div>`;
    return;
  }

  listEl.innerHTML = `<div class="my-products-list">${products.map(p => `
    <div class="my-product-item">
      <span class="my-product-emoji">${p.emoji || '🌾'}</span>
      <div class="my-product-info">
        <div class="my-product-name">${escHtml(p.name)}</div>
        <div class="my-product-meta">📦 ${p.quantity} ${p.unit} · 📍 ${escHtml(p.location)} · ${p.category}</div>
      </div>
      <span class="my-product-price">${formatINR(p.price)}/${p.unit}</span>
      <div class="my-product-actions">
        <span class="badge ${p.isAvailable ? 'badge-green' : 'badge-red'}">${p.isAvailable ? 'Active' : 'Inactive'}</span>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}')">🗑</button>
      </div>
    </div>`).join('')}</div>`;
}

/* ─── Add Product ───────────────────────────────────────────────── */
async function addProduct(e) {
  e.preventDefault();
  if (!KS.user) { openAuthModal('login'); return; }

  const btn = document.getElementById('add-product-btn');
  btn.disabled = true; btn.querySelector('.btn-text').textContent = 'Listing…';

  const payload = {
    name:        document.getElementById('p-name').value.trim(),
    description: document.getElementById('p-desc').value.trim(),
    price:       document.getElementById('p-price').value,
    quantity:    document.getElementById('p-qty').value,
    unit:        document.getElementById('p-unit').value,
    category:    document.getElementById('p-category').value,
    location:    document.getElementById('p-location').value.trim(),
    emoji:       document.getElementById('p-emoji').value.trim() || '🌾'
  };

  const data = await apiRequest('/products', 'POST', payload);

  btn.disabled = false; btn.querySelector('.btn-text').textContent = 'List My Crop';

  if (data.success) {
    toast.success('Product Listed! 🎉', `${payload.name} is now live`);
    document.getElementById('add-product-form').reset();
    document.getElementById('p-emoji').value = '🌾';
    loadDashboard();
  } else {
    toast.error('Error', data.message);
  }
}

/* ─── Delete Product ────────────────────────────────────────────── */
async function deleteProduct(id) {
  if (!confirm('Remove this listing?')) return;
  const data = await apiRequest(`/products/${id}`, 'DELETE');
  if (data.success) {
    toast.success('Removed', 'Product removed from marketplace.');
    loadDashboard();
  } else {
    toast.error('Error', data.message);
  }
}

/* ─── Load Orders ────────────────────────────────────────────────── */
async function loadOrders() {
  if (!KS.user) return;
  const data = await apiRequest('/orders/my');
  const listEl = document.getElementById('orders-list');
  if (!listEl) return;

  if (!data.success || !data.orders.length) {
    listEl.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📭</div><h3>No orders yet</h3>
      <p>Start shopping to see your orders here!</p>
      <button class="btn btn-primary" onclick="showSection('marketplace')">Browse Marketplace</button>
    </div>`;
    return;
  }

  const statusColor = { placed:'badge-blue', processing:'badge-gold', shipped:'badge-gold', delivered:'badge-green', cancelled:'badge-red', pending:'badge-blue', completed:'badge-green', failed:'badge-red' };

  listEl.innerHTML = `<div class="orders-list">${data.orders.map(o => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">Order #${o._id.slice(-8).toUpperCase()}</div>
          <div class="order-date">📅 ${formatDate(o.createdAt)}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge ${statusColor[o.status] || 'badge-blue'}">${o.status}</span>
          <span class="badge ${statusColor[o.paymentStatus] || 'badge-blue'}">${o.paymentStatus}</span>
        </div>
      </div>
      <div class="order-items">
        ${o.products.map(p => `<span class="order-item-tag">${p.emoji || '🌾'} ${escHtml(p.name)} ×${p.quantity}</span>`).join('')}
      </div>
      <div class="order-footer">
        <div style="font-size:0.83rem;color:var(--c-text-muted)">🏠 ${escHtml(o.shippingAddress || 'N/A')}</div>
        <div class="order-total">${formatINR(o.totalAmount)}</div>
      </div>
    </div>`).join('')}</div>`;
}
