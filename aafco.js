// ===================================================
//  MealMutt — AAFCO Dog Food Nutrient Check (Partial)
//  Source: AAFCO Dog Food Nutrient Profiles (2016)
//  Checks 5 of 37+ nutrients: protein, fat, calcium, phosphorus, vitamin A
// ===================================================

const AAFCO_PROFILES = {

  adult: {
    name: 'Adult Maintenance',
    protein:    { min: 45,    unit: 'g',  label: 'Protein'     },
    fat:        { min: 13.8,  unit: 'g',  label: 'Total Fat'   },
    calcium:    { min: 1250,  unit: 'mg', label: 'Calcium'     },
    phosphorus: { min: 1000,  unit: 'mg', label: 'Phosphorus'  },
    vitaminA:   { min: 1250,  unit: 'IU', label: 'Vitamin A'   },
  },

  puppy: {
    name: 'Growth & Reproduction (Puppy)',
    protein:    { min: 56.3,  unit: 'g',  label: 'Protein'     },
    fat:        { min: 21.3,  unit: 'g',  label: 'Total Fat'   },
    calcium:    { min: 3000,  unit: 'mg', label: 'Calcium'     },
    phosphorus: { min: 2500,  unit: 'mg', label: 'Phosphorus'  },
    vitaminA:   { min: 1250,  unit: 'IU', label: 'Vitamin A'   },
  },

};

// Map app life-stage → AAFCO profile
function getAafcoProfile(age) {
  return age === 'puppy' ? AAFCO_PROFILES.puppy : AAFCO_PROFILES.adult;
}

// ---- Main check ----
// nutrition = { calories, protein, fat, carbs, fiber, calcium, phosphorus, vitaminA, matched }
// Returns { compliant, profileName, checks, noData }
function checkAafcoCompliance(nutrition, age = 'adult') {
  const profile = getAafcoProfile(age);

  if (!nutrition || nutrition.calories < 10 || nutrition.matched === 0) {
    return { compliant: false, profileName: profile.name, checks: [], noData: true };
  }

  const scale = 1000 / nutrition.calories; // scale to per-1000-kcal basis

  const keys = ['protein', 'fat', 'calcium', 'phosphorus', 'vitaminA'];

  const checks = keys.map(key => {
    const std    = profile[key];
    const raw    = nutrition[key] ?? 0;
    const actual = +(raw * scale).toFixed(std.unit === 'IU' ? 0 : 1);
    const pass   = actual >= std.min;
    const pct    = Math.min(Math.round((actual / std.min) * 100), 100);
    return { key, label: std.label, actual, min: std.min, unit: std.unit, pass, pct };
  });

  return {
    compliant:   checks.every(c => c.pass),
    profileName: profile.name,
    checks,
    noData: false,
  };
}

// Disclaimer text — shown on every AAFCO result
const AAFCO_DISCLAIMER = `MealMutt checks 5 key nutrients (protein, fat, calcium, phosphorus, vitamin A) against <strong>AAFCO Dog Food Nutrient Profiles</strong> (2016) using ingredient data from the <strong>USDA FoodData Central</strong> database. This is a partial nutrition screen — not a full AAFCO compliance assessment (which covers 37+ nutrients). These tools are for informational purposes only and are not a substitute for professional veterinary advice. Always consult a licensed veterinarian before changing your dog's diet.`;
