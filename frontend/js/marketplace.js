/* ─── Marketplace Module ──────────────────────────────────────── */

let allProducts    = [];
let currentPage    = 1;
let totalPages     = 1;

async function loadMarketplace(reset = true) {
  if (reset) { currentPage = 1; allProducts = []; }

  const grid     = document.getElementById('products-grid');
  const search   = document.getElementById('marketplace-search')?.value.trim() || '';
  const category = KS.selectedCategory !== 'all' ? KS.selectedCategory : '';

  if (reset) {
    grid.innerHTML = `<div class="loading-cards">${'<div class="skeleton-card"></div>'.repeat(6)}</div>`;
  }

  const params = new URLSearchParams({ page: currentPage, limit: 12 });
  if (search)   params.append('search', search);
  if (category) params.append('category', category);

  const data = await apiRequest(`/products?${params}`);

  if (!data.success) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">⚠️</div>
      <h3>Could not load products</h3>
      <p>${data.message}</p>
      <button class="btn btn-primary" onclick="loadMarketplace()">Retry</button>
    </div>`;
    return;
  }

  totalPages = data.pages || 1;
  allProducts = reset ? data.products : [...allProducts, ...data.products];

  if (allProducts.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🌾</div>
      <h3>No products found</h3>
      <p>Try a different search or category.</p>
    </div>`;
    document.getElementById('load-more-wrap').style.display = 'none';
    return;
  }

  grid.innerHTML = allProducts.map(renderProductCard).join('');

  // Show/hide load more
  const lmWrap = document.getElementById('load-more-wrap');
  lmWrap.style.display = currentPage < totalPages ? '' : 'none';
}

function loadMoreProducts() {
  currentPage++;
  loadMarketplace(false);
}

function filterByCategory(cat, btn) {
  KS.selectedCategory = cat;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  loadMarketplace(true);
}

function renderProductCard(p) {
  const emoji = p.emoji || CAT_EMOJI[p.category] || '🌾';
  const inStock = p.quantity > 0;
  return `
    <div class="product-card" onclick="handleProductClick('${p._id}','${escHtml(p.name)}',${p.price},'${escHtml(p.sellerName)}','${escHtml(p.location)}','${emoji}','${p.category}',${p.quantity})">
      <div class="product-image">
        <span>${emoji}</span>
        <span class="product-cat-badge">${p.category}</span>
      </div>
      <div class="product-info">
        <div class="product-name">${escHtml(p.name)}</div>
        <div class="product-seller">🧑‍🌾 ${escHtml(p.sellerName || 'Unknown')}</div>
        <div class="product-meta">
          <span class="product-meta-item">📍 ${escHtml(p.location)}</span>
          <span class="product-meta-item">📦 ${p.quantity} ${p.unit || 'kg'}</span>
        </div>
        <div class="product-price-row">
          <div class="product-price">${formatINR(p.price)}<small>/${p.unit || 'kg'}</small></div>
          ${inStock
            ? `<button class="add-cart-btn" onclick="event.stopPropagation(); addToCart('${p._id}','${escHtml(p.name)}',${p.price},'${emoji}')">+ Cart</button>`
            : `<span class="badge badge-red">Out of Stock</span>`}
        </div>
      </div>
    </div>`;
}

function handleProductClick(id, name, price, seller, location, emoji, category, qty) {
  // Quick-add or show alert with details
  if (!KS.user) {
    openAuthModal('login');
    toast.info('Login Required', 'Please login to add items to cart.');
    return;
  }
  addToCart(id, name, price, emoji);
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
