/**
 * Kisaan Sathi – Rule-Based Crop Recommendation Engine
 * Pure JavaScript, no external ML dependencies.
 * Uses a weighted scoring system across soil, temperature, humidity and rainfall.
 */

const CROPS = [
  {
    name: 'Rice',
    emoji: '🌾',
    description: 'Ideal for wet, humid climates. High-yield staple crop requiring abundant water.',
    season: 'Kharif',
    conditions: { soils: ['clay','loam','silt'], tMin:20, tMax:35, hMin:70, hMax:100, rMin:150, rMax:400 }
  },
  {
    name: 'Wheat',
    emoji: '🌿',
    description: 'Best for cool, dry winters. Thrives on loamy soil with moderate rainfall.',
    season: 'Rabi',
    conditions: { soils: ['loam','clay','silt'], tMin:10, tMax:25, hMin:40, hMax:70, rMin:50, rMax:175 }
  },
  {
    name: 'Maize (Corn)',
    emoji: '🌽',
    description: 'Versatile warm-season crop. Grows well in well-drained loamy soil.',
    season: 'Kharif',
    conditions: { soils: ['loam','sandy','silt'], tMin:18, tMax:32, hMin:50, hMax:80, rMin:80, rMax:200 }
  },
  {
    name: 'Cotton',
    emoji: '🌸',
    description: 'Cash crop for hot, dry climates. Black cotton soil is ideal.',
    season: 'Kharif',
    conditions: { soils: ['black','loam','sandy'], tMin:25, tMax:40, hMin:30, hMax:60, rMin:50, rMax:120 }
  },
  {
    name: 'Sugarcane',
    emoji: '🎋',
    description: 'High-yield perennial crop for tropical humid zones.',
    season: 'Annual',
    conditions: { soils: ['loam','clay','silt'], tMin:24, tMax:38, hMin:70, hMax:95, rMin:150, rMax:300 }
  },
  {
    name: 'Tomato',
    emoji: '🍅',
    description: 'Popular vegetable crop for warm, sunny conditions with well-drained soil.',
    season: 'Rabi/Summer',
    conditions: { soils: ['loam','sandy','red','silt'], tMin:18, tMax:28, hMin:50, hMax:75, rMin:60, rMax:130 }
  },
  {
    name: 'Potato',
    emoji: '🥔',
    description: 'Cool-season tuber crop needing fertile, well-drained loamy soil.',
    season: 'Rabi',
    conditions: { soils: ['loam','sandy','silt'], tMin:10, tMax:22, hMin:50, hMax:75, rMin:75, rMax:150 }
  },
  {
    name: 'Chickpea (Chana)',
    emoji: '🟡',
    description: 'Drought-tolerant pulse. Excellent for semi-arid regions.',
    season: 'Rabi',
    conditions: { soils: ['sandy','loam','red'], tMin:15, tMax:30, hMin:30, hMax:65, rMin:40, rMax:100 }
  },
  {
    name: 'Mustard',
    emoji: '🌼',
    description: 'Winter oil-seed crop. Thrives in cool, dry conditions.',
    season: 'Rabi',
    conditions: { soils: ['loam','sandy','silt'], tMin:10, tMax:25, hMin:40, hMax:70, rMin:40, rMax:100 }
  },
  {
    name: 'Groundnut (Peanut)',
    emoji: '🥜',
    description: 'Oil-seed legume for warm climates with sandy or loamy soils.',
    season: 'Kharif',
    conditions: { soils: ['sandy','loam','red'], tMin:22, tMax:36, hMin:50, hMax:75, rMin:100, rMax:150 }
  },
  {
    name: 'Soybean',
    emoji: '🫘',
    description: 'Protein-rich legume for warm, moist conditions.',
    season: 'Kharif',
    conditions: { soils: ['loam','clay','silt'], tMin:20, tMax:30, hMin:60, hMax:80, rMin:100, rMax:175 }
  },
  {
    name: 'Pearl Millet (Bajra)',
    emoji: '🌾',
    description: 'Highly drought-resistant. Perfect for arid and semi-arid zones.',
    season: 'Kharif',
    conditions: { soils: ['sandy','loam','red'], tMin:25, tMax:42, hMin:25, hMax:60, rMin:30, rMax:80 }
  },
  {
    name: 'Sorghum (Jowar)',
    emoji: '🌿',
    description: 'Heat-tolerant cereal for dry, warm areas.',
    season: 'Kharif',
    conditions: { soils: ['red','black','loam'], tMin:23, tMax:40, hMin:35, hMax:65, rMin:45, rMax:110 }
  },
  {
    name: 'Onion',
    emoji: '🧅',
    description: 'Widely grown bulb vegetable. Prefers cool growing season.',
    season: 'Rabi',
    conditions: { soils: ['loam','silt','sandy'], tMin:12, tMax:26, hMin:50, hMax:75, rMin:60, rMax:125 }
  },
  {
    name: 'Sunflower',
    emoji: '🌻',
    description: 'Versatile oil-seed crop adaptable to various climates.',
    season: 'Kharif/Rabi',
    conditions: { soils: ['loam','sandy','clay'], tMin:18, tMax:35, hMin:45, hMax:75, rMin:70, rMax:150 }
  }
];

/**
 * Score a single crop against input parameters.
 * Returns confidence percentage (0–98).
 */
function scoreCrop(crop, { soilType, temperature, humidity, rainfall }) {
  const c = crop.conditions;
  let score = 0;

  // Soil match (weight: 1.5)
  if (c.soils.includes(soilType)) {
    score += 1.5;
  } else {
    score += 0; // no partial credit – soil type is binary fit
  }

  // Temperature fit (weight: 1.0)
  score += rangeFit(temperature, c.tMin, c.tMax, 8) * 1.0;

  // Humidity fit (weight: 0.8)
  score += rangeFit(humidity, c.hMin, c.hMax, 15) * 0.8;

  // Rainfall fit (weight: 0.7)
  score += rangeFit(rainfall, c.rMin, c.rMax, 40) * 0.7;

  const maxScore = 1.5 + 1.0 + 0.8 + 0.7; // 4.0
  const pct = Math.round((score / maxScore) * 100);
  return Math.min(98, Math.max(5, pct));
}

/**
 * Returns a 0–1 score based on how well `value` fits [min, max].
 * Values outside range decay by `decay` units per unit outside.
 */
function rangeFit(value, min, max, decay) {
  if (value >= min && value <= max) {
    // Inside range: perfect score at the middle, slightly penalized toward edges
    const mid = (min + max) / 2;
    const half = (max - min) / 2 || 1;
    const deviation = Math.abs(value - mid) / half;
    return 1 - deviation * 0.15;
  }
  const overflow = value < min ? min - value : value - max;
  return Math.max(0, 1 - overflow / decay);
}

/**
 * Main export: returns top-3 recommendations sorted by confidence.
 */
function getCropRecommendations(params) {
  const scored = CROPS
    .map(crop => ({
      name:        crop.name,
      emoji:       crop.emoji,
      description: crop.description,
      season:      crop.season,
      confidence:  scoreCrop(crop, params)
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return scored.slice(0, 3);
}

module.exports = { getCropRecommendations };
