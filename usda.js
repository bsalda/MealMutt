// ===================================================
//  MealMutt — USDA FoodData Central API Integration
//  Requests are proxied through /api/usda (Vercel serverless function).
//  The API key lives in USDA_API_KEY env var on Vercel — never in client JS.
// ===================================================

const USDA_PROXY = '/api/usda';

// USDA Nutrient IDs (per 100g)
const NUTRIENT_IDS = {
  calories: 1008,
  protein:  1003,
  fat:      1004,
  carbs:    1005,
  fiber:    1079,
};

// ---- Ingredient → USDA FDC ID map ----
// Foundation Foods dataset = lab-tested, most accurate
const INGREDIENT_MAP = [
  { keywords: ['chicken breast'],               fdcId: 171477 },
  { keywords: ['chicken thigh'],                fdcId: 172861 },
  { keywords: ['ground turkey', 'turkey'],      fdcId: 171506 },
  { keywords: ['ground beef', 'lean beef'],     fdcId: 174036 },
  { keywords: ['beef liver', 'liver'],          fdcId: 168626 },
  { keywords: ['salmon'],                       fdcId: 175167 },
  { keywords: ['tuna'],                         fdcId: 175159 },
  { keywords: ['egg'],                          fdcId: 173424 },
  { keywords: ['brown rice'],                   fdcId: 169706 },
  { keywords: ['white rice'],                   fdcId: 169756 },
  { keywords: ['quinoa'],                       fdcId: 168917 },
  { keywords: ['oat'],                          fdcId: 173904 },
  { keywords: ['sweet potato'],                 fdcId: 168482 },
  { keywords: ['carrot'],                       fdcId: 170393 },
  { keywords: ['pea', 'peas'],                  fdcId: 170419 },
  { keywords: ['spinach'],                      fdcId: 168462 },
  { keywords: ['green bean'],                   fdcId: 169141 },
  { keywords: ['blueberr'],                     fdcId: 171711 },
  { keywords: ['broccoli'],                     fdcId: 170379 },
  { keywords: ['zucchini'],                     fdcId: 169291 },
  { keywords: ['pumpkin'],                      fdcId: 168448 },
  { keywords: ['celery'],                       fdcId: 169988 },
  { keywords: ['cucumber'],                     fdcId: 168409 },
  { keywords: ['coconut oil'],                  fdcId: 172336 },
];

// Unit → grams conversion
const UNIT_GRAMS = {
  oz:    28.3495,
  large: 50,      // 1 large egg ≈ 50g
  tsp:   5,
  tbsp:  15,
};

// ---- LocalStorage Cache (7-day TTL) ----
const CACHE_KEY = 'mealmutt_usda_v1';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function cacheRead() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const cache = JSON.parse(raw);
    const now   = Date.now();
    let dirty   = false;
    Object.keys(cache).forEach(k => {
      if (now - cache[k].ts > CACHE_TTL) { delete cache[k]; dirty = true; }
    });
    if (dirty) localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return cache;
  } catch { return {}; }
}

function cacheWrite(fdcId, nutrients) {
  try {
    const cache = cacheRead();
    cache[fdcId] = { nutrients, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// ---- Fetch one food from USDA (with cache) ----
async function usdaFetchFood(fdcId) {
  const cache = cacheRead();
  if (cache[fdcId]) return cache[fdcId].nutrients;

  const url = `${USDA_PROXY}?fdcId=${fdcId}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`USDA ${res.status} — FDC ID ${fdcId}`);
  const data = await res.json();

  // Handle both Foundation/SR Legacy and Branded Foods response shapes
  const nutrients = {};
  for (const [name, nid] of Object.entries(NUTRIENT_IDS)) {
    const fn = data.foodNutrients?.find(n =>
      n.nutrient?.id === nid || n.nutrientId === nid
    );
    nutrients[name] = fn ? (fn.amount ?? fn.value ?? 0) : 0;
  }

  cacheWrite(fdcId, nutrients);
  return nutrients;
}

// ---- Match ingredient string → FDC ID ----
function matchFdcId(ingredientItem) {
  const lower = ingredientItem.toLowerCase();
  for (const entry of INGREDIENT_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.fdcId;
  }
  return null;
}

// ---- Calculate one ingredient's nutrition contribution ----
function calcContrib(per100g, qty, unit) {
  const gramsPerUnit = UNIT_GRAMS[unit];
  if (!gramsPerUnit) return null;
  const factor = (qty * gramsPerUnit) / 100;
  return {
    calories: per100g.calories * factor,
    protein:  per100g.protein  * factor,
    fat:      per100g.fat      * factor,
    carbs:    per100g.carbs    * factor,
    fiber:    per100g.fiber    * factor,
  };
}

// ---- PUBLIC: fetch live nutrition for a whole recipe ----
async function usdaRecipeNutrition(recipe, multiplier = 1) {
  const totals  = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  let   matched = 0;

  await Promise.all(recipe.ingredients.map(async ing => {
    const fdcId = matchFdcId(ing.item);
    if (!fdcId) return;
    try {
      const per100g  = await usdaFetchFood(fdcId);
      const contrib  = calcContrib(per100g, ing.qty * multiplier, ing.unit);
      if (!contrib) return;
      matched++;
      totals.calories += contrib.calories;
      totals.protein  += contrib.protein;
      totals.fat      += contrib.fat;
      totals.carbs    += contrib.carbs;
      totals.fiber    += contrib.fiber;
    } catch (err) {
      console.warn(`[USDA] Skipped "${ing.item}":`, err.message);
    }
  }));

  return {
    calories: Math.round(totals.calories),
    protein:  +(totals.protein.toFixed(1)),
    fat:      +(totals.fat.toFixed(1)),
    carbs:    +(totals.carbs.toFixed(1)),
    fiber:    +(totals.fiber.toFixed(1)),
    matched,
  };
}
