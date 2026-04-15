/* ─── Checkout & Razorpay Module ──────────────────────────────── */

let currentOrderId = null;

/* ─── Render Checkout Page ──────────────────────────────────────── */
function renderCheckoutPage() {
  if (cartItems.length === 0) { showSection('cart'); return; }

  // Pre-fill name/phone if user logged in
  if (KS.user) {
    const nameEl  = document.getElementById('checkout-name');
    const phoneEl = document.getElementById('checkout-phone');
    if (nameEl  && !nameEl.value)  nameEl.value  = KS.user.name || '';
    if (phoneEl && !phoneEl.value) phoneEl.value  = KS.user.phone || '';
  }

  // Items in checkout
  const reviewEl = document.getElementById('checkout-items-review');
  if (reviewEl) {
    reviewEl.innerHTML = cartItems.map(i => `
      <div class="co-item">
        <span>${i.emoji} ${escHtml(i.name)} × ${i.qty}</span>
        <span>${formatINR(i.price * i.qty)}</span>
      </div>`).join('');
  }

  // Summary sidebar
  const { sub, gst, total } = getCartTotals();
  const summaryItems = document.getElementById('checkout-summary-items');
  if (summaryItems) {
    summaryItems.innerHTML = cartItems.map(i => `
      <div class="summary-row">
        <span>${i.emoji} ${escHtml(i.name)} ×${i.qty}</span>
        <span>${formatINR(i.price * i.qty)}</span>
      </div>`).join('');
  }
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('co-subtotal', formatINR(sub));
  set('co-gst',      formatINR(gst));
  set('co-total',    formatINR(total));
}

/* ─── Initiate Payment ──────────────────────────────────────────── */
async function initiatePayment() {
  if (!KS.user) { openAuthModal('login'); return; }
  if (cartItems.length === 0) { toast.warning('Cart Empty', 'Add items to cart first.'); return; }

  const name    = document.getElementById('checkout-name')?.value.trim();
  const phone   = document.getElementById('checkout-phone')?.value.trim();
  const address = document.getElementById('checkout-address')?.value.trim();

  if (!name || !phone || !address)
    return toast.error('Missing Info', 'Please fill in your delivery address.');

  const { total } = getCartTotals();
  const payBtn = document.getElementById('pay-btn');
  payBtn.disabled = true; payBtn.textContent = '⏳ Creating order…';

  // 1. Create order in DB
  const orderProducts = cartItems.map(i => ({
    productId: i.id, name: i.name, price: i.price, quantity: i.qty, emoji: i.emoji
  }));

  const orderData = await apiRequest('/orders', 'POST', {
    products: orderProducts,
    totalAmount: total,
    shippingAddress: `${name}, ${phone}, ${address}`
  });

  if (!orderData.success) {
    payBtn.disabled = false; payBtn.textContent = '🔒 Pay Securely with Razorpay';
    return toast.error('Order Error', orderData.message);
  }

  currentOrderId = orderData.order._id;

  // 2. Create Razorpay payment order
  const rzpData = await apiRequest('/payment/create-order', 'POST', {
    amount: total, orderId: currentOrderId
  });

  if (!rzpData.success) {
    payBtn.disabled = false; payBtn.textContent = '🔒 Pay Securely with Razorpay';
    return toast.error('Payment Error', rzpData.message);
  }

  payBtn.disabled = false; payBtn.textContent = '🔒 Pay Securely with Razorpay';

  // 3. Open Razorpay modal
  if (typeof Razorpay === 'undefined') {
    // Simulate payment for demo (no real Razorpay keys)
    simulatePaymentSuccess(currentOrderId, total);
    return;
  }

  const options = {
    key:      rzpData.key,
    amount:   rzpData.amount,
    currency: rzpData.currency,
    name:     'Kisaan Sathi',
    description: 'Fresh Produce Purchase',
    order_id: rzpData.orderId,
    prefill: { name, contact: phone, email: KS.user.email },
    theme:   { color: '#22C55E' },
    handler: async (response) => {
      await verifyPayment(response, currentOrderId, total);
    },
    modal: {
      ondismiss: () => toast.warning('Payment Cancelled', 'You dismissed the payment.')
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

/* ─── Verify Payment ────────────────────────────────────────────── */
async function verifyPayment(response, orderId, amount) {
  showLoader();
  const data = await apiRequest('/payment/verify', 'POST', {
    razorpay_order_id:   response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature:  response.razorpay_signature,
    orderId, amount
  });
  hideLoader();

  if (data.success) {
    cartClear();
    toast.success('Payment Successful! 🎉', `Payment ID: ${response.razorpay_payment_id}`);
    showSection('orders');
    loadOrders();
  } else {
    toast.error('Payment Failed', data.message);
  }
}

/* ─── Demo simulation (no Razorpay keys) ───────────────────────── */
async function simulatePaymentSuccess(orderId, amount) {
  showLoader();
  // Mark order as completed without real payment
  await apiRequest(`/orders/${orderId}/payment`, 'PUT', {
    paymentStatus: 'completed',
    paymentId: 'DEMO_PAY_' + Date.now(),
    razorpayOrderId: 'DEMO_ORDER_' + Date.now()
  });
  hideLoader();
  cartClear();
  toast.success('Payment Successful! 🎉', 'Demo mode: order confirmed');
  showSection('orders');
  loadOrders();
}
