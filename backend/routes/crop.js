const express  = require('express');
const router   = express.Router();
const { getCropRecommendations } = require('../utils/cropRecommendation');

router.post('/recommend', (req, res) => {
  try {
    const { soilType, temperature, humidity, rainfall } = req.body;

    if (!soilType || temperature === undefined || humidity === undefined || rainfall === undefined)
      return res.status(400).json({ success: false, message: 'Please provide soilType, temperature, humidity and rainfall.' });

    const t = parseFloat(temperature);
    const h = parseFloat(humidity);
    const r = parseFloat(rainfall);

    if (isNaN(t) || isNaN(h) || isNaN(r))
      return res.status(400).json({ success: false, message: 'Temperature, humidity and rainfall must be numbers.' });

    const recommendations = getCropRecommendations({ soilType: soilType.toLowerCase(), temperature: t, humidity: h, rainfall: r });
    res.json({ success: true, recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
