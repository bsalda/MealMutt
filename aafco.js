
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

// Complete-nutrition callout — shown only when result.compliant === false
function aafcoCompleteSection(weightLbs) {
  const dose     = (weightLbs * 0.9).toFixed(1);
  const dogName  = (typeof state !== "undefined" && state.name) ? state.name : "your dog";
  return `
  <div class="aafco-complete-box">
    <h4 style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:.5rem;">🧩 Complete this recipe's nutrition</h4>
    <p class="complete-already-note">✅ <strong>Your recipe already includes eggshell powder and wheat germ oil</strong> — these cover part of the calcium and vitamin gap that homemade recipes typically have.</p>
    <p style="font-size:.85rem;color:var(--text-muted);line-height:1.5;margin-bottom:.75rem;">If you want a one-stop solution, a vet-formulated premix covers everything in one product:</p>
    <div class="complete-products-grid">
      <div class="complete-product-card">
        <span class="complete-badge">Vet Formulated</span>
        <div class="complete-product-name">Balance IT® Canine</div>
        <p class="complete-product-desc">Developed by UC Davis veterinary nutritionists. The most widely used supplement to complete homemade dog food recipes. Free recipe calculator on their site determines exact dose for your dog.</p>
        <div class="complete-dose">Estimated dose for ${dogName}: ${dose}g per day<small>Use Balance IT's free calculator for precise dosing</small></div>
        <a href="https://balance.it" target="_blank" rel="noopener" class="complete-btn-primary">Visit Balance IT →</a>
      </div>
      <div class="complete-product-card">
        <span class="complete-badge">Vet Formulated</span>
        <div class="complete-product-name">Hilary's Blend (Rx Essentials)</div>
        <p class="complete-product-desc">A complete vitamin and mineral supplement formulated by veterinary nutritionists for homemade and raw diets. Available through veterinary suppliers and Amazon.</p>
        <div class="complete-dose">Follow package dosing instructions by dog weight</div>
        <a href="https://www.amazon.com/s?k=hilary%27s+blend+rx+essentials+dogs&tag=mealmutt-20" target="_blank" rel="noopener" class="complete-btn-secondary">Shop Hilary's Blend →</a>
      </div>
    </div>
    <p class="complete-alt-note">Or use any AAFCO-compliant vitamin/mineral premix and follow package dosing instructions for your dog's weight.</p>
    <div class="complete-disclosure">🔗 Affiliate disclosure: The Hilary's Blend link above is an Amazon affiliate link — MealMutt may earn a small commission at no extra cost to you. Balance IT is a non-affiliate recommendation.</div>
  </div>`;
}
