// ===================================================
//  MealMutt — Dog-Safe Supplement Database
//  Sources: AKC, PetMD, VCA Hospitals, Dogs Naturally
//  All amounts are per 10 lbs body weight
// ===================================================

const SUPPLEMENTS = [
  {
    id: "eggshell-powder",
    name: "Eggshell Powder",
    emoji: "🥚",
    category: "mineral",
    tier: "completer",
    primaryNutrient: "Calcium",
    benefit: "Highly bioavailable calcium carbonate for strong bones, teeth & muscle function.",
    dosage: { qty: 0.125, unit: "tsp", per: 10 },
    prepNote: "Boil shells 10–12 min, dry completely, grind to fine powder. Mix directly into food.",
    warning: "Excess causes kidney stones. Maintain Ca:P ratio 1.2:1–2:1. Not for large-breed puppies without vet guidance.",
    keyNutrients: { calcium: 360, protein: 0.1, fat: 0, fiber: 0, omega3: 0 },
  },
  {
    id: "wheat-germ-oil",
    name: "Wheat Germ Oil",
    emoji: "🌾",
    category: "vitamin",
    tier: "completer",
    primaryNutrient: "Vitamin E",
    benefit: "Most concentrated natural source of vitamin E — critical antioxidant that protects cell membranes. Commonly deficient in cooked homemade dog food because heat destroys vitamin E.",
    dosage: { qty: 1, unit: "tsp", per: 30 },
    prepNote: "Use cold-pressed, unrefined wheat germ oil. Add AFTER cooking — heat destroys vitamin E. Drizzle directly onto cooled food before serving. Refrigerate after opening.",
    warning: "Do not cook or heat — destroys the vitamin E content entirely. Not suitable for dogs with wheat gluten sensitivity. Refrigerate and discard if it smells rancid.",
    keyNutrients: { calcium: 0, protein: 0, fat: 4.5, fiber: 0, omega3: 55 },
  },
  {
    id: "greek-yogurt",
    name: "Greek Yogurt",
    emoji: "🫙",
    category: "probiotic",
    tier: "booster",
    primaryNutrient: "Probiotics",
    benefit: "Supports gut health, boosts immunity, and restores beneficial intestinal flora.",
    dosage: { qty: 1, unit: "tsp", per: 10 },
    prepNote: "Use plain, unsweetened, full-fat Greek yogurt with live active cultures. Mix into food or serve as a topper.",
    warning: "NEVER use yogurt with xylitol — fatal to dogs. Avoid flavored or sweetened varieties. Introduce slowly for lactose-sensitive dogs.",
    keyNutrients: { calcium: 111, protein: 3.5, fat: 1.7, fiber: 0, omega3: 12 },
  },
  {
    id: "nutritional-yeast",
    name: "Nutritional Yeast",
    emoji: "🟡",
    category: "vitamin",
    tier: "completer",
    primaryNutrient: "B-Complex Vitamins",
    benefit: "Complete B-vitamin spectrum (B1, B2, B3, B6, B12) plus all essential amino acids for energy, nerves & coat.",
    dosage: { qty: 0.5, unit: "tsp", per: 10 },
    prepNote: "Use deactivated, plain, unflavored nutritional yeast ONLY — NOT brewer's yeast or baker's yeast. Sprinkle onto food.",
    warning: "Never use varieties with garlic or onion flavoring. High phosphorus — avoid for dogs with kidney disease. Excess causes GI upset.",
    keyNutrients: { calcium: 3, protein: 2.5, fat: 0.2, fiber: 0.6, omega3: 0 },
  },
  {
    id: "kelp-powder",
    name: "Kelp Powder",
    emoji: "🌿",
    category: "mineral",
    tier: "completer",
    primaryNutrient: "Iodine",
    benefit: "Supports thyroid function, metabolism, dental plaque reduction, and skin & coat health via natural minerals.",
    dosage: { qty: 0.125, unit: "tsp", per: 10 },
    prepNote: "Use certified organic, pet-specific kelp powder (Ascophyllum nodosum). Mix into food 1–2× per week, not daily.",
    warning: "CRITICAL: Iodine content varies wildly. Do NOT use for dogs with thyroid conditions, kidney or liver disease, or puppies under 6 months. Never exceed 1/4 tsp/day.",
    keyNutrients: { calcium: 150, protein: 0.5, fat: 0.1, fiber: 0.5, omega3: 7 },
  },
  {
    id: "pumpkin-seeds",
    name: "Pumpkin Seeds (Ground)",
    emoji: "🎃",
    category: "mineral",
    tier: "completer",
    primaryNutrient: "Zinc & Magnesium",
    benefit: "Provides zinc for immune function & wound healing, magnesium for cardiac health, and healthy unsaturated fats.",
    dosage: { qty: 1, unit: "tsp", per: 10 },
    prepNote: "Use raw, shell-free, unsalted seeds. Roast at 350°F 10–15 min, then grind fully before adding to food. Never season.",
    warning: "High fat — not for dogs with pancreatitis. Whole seeds are a choking hazard for small dogs. Excess disrupts copper & iron absorption.",
    keyNutrients: { calcium: 12, protein: 2.5, fat: 3.5, fiber: 0.6, omega3: 35 },
  },
  {
    id: "bone-broth",
    name: "Bone Broth",
    emoji: "🍲",
    category: "mineral",
    tier: "booster",
    primaryNutrient: "Collagen & Glucosamine",
    benefit: "Lubricates and repairs joints, supports intestinal lining via gelatin, and aids liver detoxification with glycine.",
    dosage: { qty: 1.5, unit: "tbsp", per: 10 },
    prepNote: "Simmer cartilage-rich bones 12–24 hrs with a splash of apple cider vinegar. Remove ALL bones before serving. Skim fat. Serve warm over food.",
    warning: "NEVER add onion, garlic, salt, or seasoning. Cooked bones left in broth are a splintering hazard. Avoid store-bought human broth — contains onion/garlic.",
    keyNutrients: { calcium: 40, protein: 3, fat: 1, fiber: 0, omega3: 22 },
  },
  {
    id: "chia-seeds",
    name: "Chia Seeds (Soaked)",
    emoji: "🫧",
    category: "omega",
    tier: "booster",
    primaryNutrient: "Omega-3 (ALA) & Fiber",
    benefit: "Reduces inflammation, supports skin & joints, and feeds beneficial gut bacteria via soluble fiber.",
    dosage: { qty: 0.25, unit: "tsp", per: 10 },
    prepNote: "ALWAYS soak in water 30+ min before serving — dry seeds expand in gut causing blockage. Mix soaked gel into food.",
    warning: "NEVER serve dry — causes intestinal blockage. Not for dogs with pancreatitis or kidney disease. ALA is not a substitute for fish-based omega-3 (EPA/DHA).",
    keyNutrients: { calcium: 63, protein: 1, fat: 1.5, fiber: 1.3, omega3: 900 },
  },
  {
    id: "turmeric",
    name: "Turmeric (Golden Paste)",
    emoji: "🟠",
    category: "antioxidant",
    tier: "booster",
    primaryNutrient: "Curcumin",
    benefit: "Reduces joint inflammation, supports immune defense, and may protect against cognitive decline in senior dogs.",
    dosage: { qty: 0.125, unit: "tsp", per: 10 },
    prepNote: "Serve as golden paste ONLY: blend turmeric + black pepper + coconut oil. Black pepper increases curcumin absorption by 2,000%. Build up slowly over 2 weeks.",
    warning: "Contraindicated with gallbladder stones, bleeding disorders, or NSAIDs. Use caution in diabetic dogs. Causes GI upset if dose increased too quickly.",
    keyNutrients: { calcium: 4, protein: 0.2, fat: 0.1, fiber: 0.1, omega3: 1 },
  },
  {
    id: "flaxseed",
    name: "Ground Flaxseed",
    emoji: "🌾",
    category: "omega",
    tier: "completer",
    primaryNutrient: "Omega-3 (ALA) & Fiber",
    benefit: "Reduces inflammation linked to arthritis & skin conditions, while fiber supports healthy digestion and bowel regularity.",
    dosage: { qty: 0.375, unit: "tsp", per: 10 },
    prepNote: "Always use ground (milled) flaxseed — whole seeds pass through undigested. Store refrigerated in airtight container. Mix into food.",
    warning: "Goes rancid quickly — always refrigerate and discard if it smells off. Do not use raw flax plant. Not a substitute for fish-derived EPA/DHA omega-3.",
    keyNutrients: { calcium: 18, protein: 0.9, fat: 1.4, fiber: 0.8, omega3: 750 },
  },
  {
    id: "spirulina",
    name: "Spirulina",
    emoji: "💚",
    category: "antioxidant",
    tier: "booster",
    primaryNutrient: "Complete Protein & Antioxidants",
    benefit: "Strengthens immune response, protects cells from oxidative stress, and supports heavy metal detoxification.",
    dosage: { qty: 0.25, unit: "tsp", per: 10 },
    prepNote: "Use certified organic spirulina powder (Arthrospira platensis), grown in controlled environments and tested for heavy metals. Mix into food. Introduce gradually.",
    warning: "Do NOT use AFA blue-green algae — may contain deadly microcystin toxins. Avoid for dogs with autoimmune conditions. Introduce slowly to prevent GI upset.",
    keyNutrients: { calcium: 8, protein: 2, fat: 0.3, fiber: 0.1, omega3: 40 },
  },
];

// Category config (color + label)
const SUPPLEMENT_CATEGORIES = {
  mineral:     { label: "Mineral",     color: "#2563eb", bg: "#eff6ff" },
  probiotic:   { label: "Probiotic",   color: "#16a34a", bg: "#f0fdf4" },
  vitamin:     { label: "Vitamin",     color: "#d97706", bg: "#fffbeb" },
  omega:       { label: "Omega-3",     color: "#7c3aed", bg: "#f5f3ff" },
  antioxidant: { label: "Antioxidant", color: "#0d9488", bg: "#f0fdfa" },
};

// Calculate dose for a given dog weight
function calcSupplementDose(supplement, weightLbs) {
  const raw = supplement.dosage.qty * (weightLbs / supplement.dosage.per);
  const rounded = Math.round(raw * 8) / 8; // round to nearest 1/8
  return `${fractionStr(rounded)} ${supplement.dosage.unit}`;
}

// Convert decimal to readable fraction string
function fractionStr(n) {
  if (n <= 0) return "1/8";
  const eighths = Math.round(n * 8);
  const whole   = Math.floor(eighths / 8);
  const rem     = eighths % 8;
  const fracs   = { 1: "⅛", 2: "¼", 3: "⅜", 4: "½", 5: "⅝", 6: "¾", 7: "⅞", 0: "" };
  if (whole === 0) return fracs[rem] || "⅛";
  if (rem  === 0)  return `${whole}`;
  return `${whole} ${fracs[rem]}`;
}

// Smart supplement suggestions based on AAFCO gaps
function suggestSupplements(aafcoResult) {
  const suggestions = new Set();

  if (aafcoResult && !aafcoResult.noData) {
    const failing = aafcoResult.checks?.filter(c => !c.pass).map(c => c.key) || [];
    if (failing.includes("protein")) {
      suggestions.add("nutritional-yeast");
      suggestions.add("spirulina");
    }
    if (failing.includes("fat")) {
      suggestions.add("flaxseed");
      suggestions.add("chia-seeds");
    }
    if (failing.includes("calcium")) {
      suggestions.add("eggshell-powder");
    }
    if (!aafcoResult.compliant) {
      suggestions.add("eggshell-powder");
      suggestions.add("wheat-germ-oil");
      suggestions.add("kelp-powder");
      suggestions.add("pumpkin-seeds");
    }
  }

  // Always suggest these core wellness supplements
  suggestions.add("bone-broth");
  suggestions.add("greek-yogurt");

  return [...suggestions];
}
