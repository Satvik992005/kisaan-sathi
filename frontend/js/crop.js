/* ─── Crop Recommendation Module ─────────────────────────────── */

async function getCropRecommendation(e) {
  e.preventDefault();
  
  // Enforce login for this feature
  if (!KS.user) {
    if (typeof openAuthModal === 'function') openAuthModal('login');
    if (typeof toast !== 'undefined') toast.info('Login Required', 'Please login or sign up to use the Crop Adviser.');
    return;
  }
  
  const btn = document.getElementById('crop-submit-btn');
  btn.disabled = true; btn.textContent = '🔍 Analyzing…';

  const payload = {
    soilType:    document.getElementById('soil-type').value,
    temperature: document.getElementById('temperature').value,
    humidity:    document.getElementById('humidity').value,
    rainfall:    document.getElementById('rainfall').value
  };

  const data = await apiRequest('/crop/recommend', 'POST', payload);
  btn.disabled = false; btn.textContent = '🔍 Get Recommendations';

  const resultsArea = document.getElementById('crop-results-area');

  if (!data.success) {
    resultsArea.innerHTML = `<div class="crop-placeholder">
      <div class="crop-placeholder-icon">⚠️</div>
      <h3>Could not get recommendations</h3>
      <p>${data.message}</p>
    </div>`;
    return;
  }

  renderCropResults(data.recommendations);
}

function renderCropResults(crops) {
  if (!crops || crops.length === 0) {
    document.getElementById('crop-results-area').innerHTML =
      `<div class="crop-placeholder"><div class="crop-placeholder-icon">🤔</div><h3>No results found</h3></div>`;
    return;
  }

  document.getElementById('crop-results-area').innerHTML = crops.map((crop, idx) => {
    const isTop = idx === 0;
    const confClass = crop.confidence >= 70 ? 'conf-high' : crop.confidence >= 45 ? 'conf-medium' : 'conf-low';
    const delay = idx * 0.12;

    return `
      <div class="crop-result-card ${isTop ? 'top-pick' : ''}" style="animation-delay:${delay}s">
        ${isTop ? '<div class="top-pick-tag">⭐ Top Recommendation</div>' : ''}
        <div class="crop-result-header">
          <span class="crop-emoji">${crop.emoji}</span>
          <div>
            <div class="crop-result-name">${escHtml(crop.name)}</div>
            <div class="crop-result-season">Season: ${escHtml(crop.season || 'Year-round')}</div>
          </div>
        </div>
        <div class="crop-result-desc">${escHtml(crop.description)}</div>
        <div class="confidence-bar">
          <div class="confidence-labels">
            <span>Suitability Score</span>
            <span class="conf-pct">${crop.confidence}%</span>
          </div>
          <div class="conf-track">
            <div class="conf-fill ${confClass}" id="bar-${idx}" style="width:0%"></div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Animate bars after DOM append
  requestAnimationFrame(() => {
    crops.forEach((c, i) => {
      const bar = document.getElementById(`bar-${i}`);
      if (bar) setTimeout(() => { bar.style.width = c.confidence + '%'; }, i * 120);
    });
  });
}
