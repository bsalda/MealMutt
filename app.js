// ===================================================
//  MealMutt — App Logic
// ===================================================

// Guard: if GA is blocked by an ad blocker, make gtag a no-op so calls don't throw.
if (typeof gtag !== "function") { window.gtag = () => {}; }

// ---- State ----
const state = {
  name: "",
  weightLbs: 0,
  age: "",
  size: "",
  activity: "",
  health: [],
  dailyCalories: 0,
  dailyOz: 0,
  multiplier: 1,
  selectedRecipe: null,
  activeFilter: "all",
};

// ---- Pro / Monetization ----
const FREE_RECIPE_IDS = ["chicken-rice-veggie", "beef-veggie-bowl", "salmon-quinoa"];

const STRIPE_LINKS = {
  monthly: "https://buy.stripe.com/14A9AM93r1yX7C05iV1B601",
  yearly:  "https://buy.stripe.com/eVq6oA3J76ThaOccLn1B600",
};

function isPro() {
  return localStorage.getItem("mealmutt_pro") === "true";
}

// ---- License Key Redemption ----
// REPLACE WITH SERVER-SIDE VERIFICATION BEFORE SCALING.
// Currently validates key format client-side only. A real implementation must
// POST the key to your backend, verify it against your database of issued keys
// (e.g. from a Stripe webhook), mark it used, and return a signed token.
const LICENSE_KEY_PATTERN = /^MEALMUTT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function redeemLicenseKey() {
  const input = $("license-key-input");
  const key   = input.value.trim().toUpperCase();

  if (!LICENSE_KEY_PATTERN.test(key)) {
    showLicenseError("Invalid key format. Keys look like: MEALMUTT-XXXX-XXXX-XXXX");
    return;
  }

  // REPLACE WITH SERVER-SIDE VERIFICATION BEFORE SCALING.
  // Right now any correctly-formatted key is accepted. Before going to
  // production you must validate the key against your issued-keys list on
  // a server you control so buyers can't share or forge keys.
  gtag("event", "license_key_activated");
  localStorage.setItem("mealmutt_pro", "true");
  localStorage.setItem("mealmutt_license_key", key);
  input.value = "";
  hideLicenseError();
  closeUpgradeModal();
  updateProBanner();
  renderRecipes(state.activeFilter);
  showToast("🎉 Pro activated! All recipes & features unlocked.", "success");
}

function showLicenseError(msg) {
  const el = $("license-key-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideLicenseError() {
  $("license-key-error").classList.add("hidden");
}

function updateProBanner() {
  const bar  = $("pro-status-bar");
  const text = $("pro-status-text");
  const btn  = $("pro-status-btn");
  if (isPro()) {
    bar.classList.remove("hidden");
    bar.classList.add("is-pro");
    text.innerHTML = "⭐ <strong>MealMutt Pro</strong> — All features unlocked";
    btn.classList.add("hidden");
  } else {
    // Only show banner when user hits a locked recipe, not on load
    bar.classList.add("hidden");
    bar.classList.remove("is-pro");
    text.innerHTML = "🆓 Free Plan — <strong>3 recipes included</strong>";
    btn.classList.remove("hidden");
  }
}

function showUpgradeModal() {
  // Show the status bar now — user has discovered the paywall naturally
  const bar = $("pro-status-bar");
  bar.classList.remove("hidden");
  $("upgrade-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeUpgradeModal() {
  $("upgrade-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

function goToStripe(plan) {
  const link = STRIPE_LINKS[plan];
  if (link.includes("REPLACE_WITH")) {
    showToast("🔗 Connect your Stripe account to enable payments!", "info");
    return;
  }
  gtag("event", "pro_upgrade_clicked", { plan });
  window.open(link, "_blank");
}

// ---- Dog Profile Save / Load ----
const PROFILES_KEY   = "mealmutt_profiles";
const FREE_MAX_PROFILES = 1;

function getProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]"); }
  catch { return []; }
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function saveProfile() {
  const name   = $("dog-name").value.trim() || "My Dog";
  const weight = parseFloat($("dog-weight").value);
  const age    = $("dog-age").value;
  const size   = $("dog-size").value;

  if (!weight || !age || !size || !state.activity) {
    showToast("⚠️ Fill out your dog's info before saving.", "error"); return;
  }

  const profiles = getProfiles();
  if (!isPro() && profiles.length >= FREE_MAX_PROFILES) {
    showToast("💡 Save unlimited dog profiles with Pro!", "info");
    showUpgradeModal(); return;
  }

  const existing = profiles.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  const profile  = { id: Date.now(), name, weight, age, size, activity: state.activity,
                     health: [...document.querySelectorAll(".tag-checkbox input:checked")].map(c => c.value),
                     savedAt: new Date().toLocaleDateString() };

  if (existing >= 0) profiles[existing] = profile;
  else profiles.push(profile);

  saveProfiles(profiles);
  renderSavedProfiles();
  showToast(`💾 ${name}'s profile saved!`, "success");
}

function loadProfile(id) {
  const profile = getProfiles().find(p => p.id === id);
  if (!profile) return;

  $("dog-name").value   = profile.name;
  $("dog-weight").value = profile.weight;
  $("dog-age").value    = profile.age;
  $("dog-size").value   = profile.size;

  document.querySelectorAll(".activity-btn").forEach(b => {
    b.classList.toggle("selected", b.dataset.value === profile.activity);
  });
  state.activity = profile.activity;

  document.querySelectorAll(".tag-checkbox input").forEach(cb => {
    cb.checked = profile.health.includes(cb.value);
  });

  showToast(`📂 Loaded ${profile.name}'s profile!`, "success");
}

function deleteProfile(id) {
  const profiles = getProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
  renderSavedProfiles();
  showToast("🗑️ Profile removed.", "info");
}

function renderSavedProfiles() {
  const profiles = getProfiles();
  const row   = $("saved-profiles-row");
  const chips = $("saved-chips");

  if (profiles.length === 0) { row.classList.add("hidden"); return; }

  row.classList.remove("hidden");
  chips.innerHTML = profiles.map(p => `
    <div class="saved-chip" onclick="loadProfile(${p.id})">
      🐕 ${p.name}
      <button class="saved-chip-del" onclick="event.stopPropagation();deleteProfile(${p.id})" title="Remove">✕</button>
    </div>`).join("");
}

// ---- EmailJS Config ----
const EMAILJS_SERVICE_ID  = "service_mealmutt";
const EMAILJS_TEMPLATE_ID = "template_8yssota";
const EMAILJS_PUBLIC_KEY  = "4V4ksguJ0axB2Wsml";

// Init EmailJS once SDK is loaded
(function initEmailJS() {
  if (typeof emailjs !== "undefined") {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  } else {
    // Retry after scripts load
    window.addEventListener("load", () => {
      if (typeof emailjs !== "undefined") emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    });
  }
})();

// ---- Waitlist ----
async function joinWaitlist(e) {
  e.preventDefault();

  const name     = ($("waitlist-name").value || "").trim();
  const email    = $("waitlist-email").value.trim();
  const referral = $("waitlist-referral").value || "Not specified";
  const btn      = $("waitlist-btn");
  const btnText  = $("waitlist-btn-text");

  if (!email) {
    showToast("⚠️ Please enter your email address.", "error");
    $("waitlist-email").focus();
    return;
  }

  // Build template params — auto-populate dog data from state
  const params = {
    from_name:       name || "A dog owner",
    from_email:      email,
    signup_date:     new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" }),
    referral_source: referral,

    // Dog profile
    dog_name:        state.name     || "Not entered",
    dog_weight:      state.weightLbs ? `${state.weightLbs} lbs` : "Not entered",
    dog_age:         state.age      || "Not entered",
    dog_size:        state.size     || "Not entered",
    dog_activity:    state.activity || "Not entered",

    // Nutrition snapshot
    daily_calories:  state.dailyCalories ? `${state.dailyCalories} kcal` : "Not calculated",
    daily_oz:        state.dailyOz       ? `${state.dailyOz} oz/day`     : "Not calculated",
    last_recipe:     state.selectedRecipe ? state.selectedRecipe.name     : "None selected",
    aafco_status:    state.lastAafcoResult
                       ? (state.lastAafcoResult.compliant ? "✅ Passed" : "⚠️ Below Minimum")
                       : "Not checked",
  };

  // Loading state
  btn.disabled   = true;
  btnText.textContent = "Sending…";

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);

    // Show success state
    $("waitlist-default").classList.add("hidden");
    $("waitlist-success").classList.remove("hidden");
    $("waitlist-success-msg").textContent =
      `Thanks${name ? ", " + name : ""}! We'll send recipes, vet tips, and Pro early access to ${email}.`;

    gtag("event", "email_signup_completed", { referral_source: referral });
    // Remember in localStorage so we don't ask again
    localStorage.setItem("mealmutt_waitlist", email);

  } catch (err) {
    console.error("EmailJS error:", err);
    showToast("❌ Something went wrong. Please try again.", "error");
    btn.disabled    = false;
    btnText.textContent = "Join Free →";
  }
}

function showToast(msg, type = "info") {
  const existing = document.querySelector(".mealmutt-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "mealmutt-toast";
  const colors = { success: "#16a34a", error: "#dc2626", info: "#0369a1" };
  toast.style.cssText = `
    position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);
    background:${colors[type] || "#1e293b"};color:#fff;
    padding:.75rem 1.4rem;border-radius:30px;
    font-size:.9rem;font-weight:600;z-index:99999;
    box-shadow:0 4px 20px rgba(0,0,0,.25);
    animation:fadeSlideIn .2s ease;white-space:nowrap;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ---- DOM refs ----
const $ = id => document.getElementById(id);

// ---- Activity selection ----
document.querySelectorAll(".activity-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".activity-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.activity = btn.dataset.value;
  });
});

// ---- Calculate ----
$("btn-calculate").addEventListener("click", () => {
  const name   = $("dog-name").value.trim();
  const weight = parseFloat($("dog-weight").value);
  const age    = $("dog-age").value;
  const size   = $("dog-size").value;

  if (!weight || weight <= 0) { showError("Please enter your dog's weight."); return; }
  if (!age)    { showError("Please select your dog's age."); return; }
  if (!size)   { showError("Please select your dog's breed size."); return; }
  if (!state.activity) { showError("Please select an activity level."); return; }

  state.name     = name || "Your Dog";
  state.weightLbs = weight;
  state.age      = age;
  state.size     = size;
  state.health   = [...document.querySelectorAll(".tag-checkbox input:checked")].map(c => c.value);

  // ---- Calorie Calculation ----
  // RER (Resting Energy Requirement): 70 × (weight in kg) ^ 0.75
  const kg = weight * 0.453592;
  const rer = 70 * Math.pow(kg, 0.75);

  // Activity multipliers
  const activityMult = { low: 1.2, moderate: 1.6, high: 2.0, working: 2.5 };
  let mult = activityMult[state.activity];

  // Age adjustments
  if (age === "puppy") mult *= 2.0;
  if (age === "senior") mult *= 0.8;

  // Health adjustments
  if (state.health.includes("overweight"))  mult *= 0.8;
  if (state.health.includes("underweight")) mult *= 1.2;
  if (state.health.includes("pregnant"))    mult *= 1.8;

  let calories = Math.round(rer * mult);

  // Cap sanity bounds
  calories = Math.max(100, Math.min(calories, 5000));

  // Approx: homemade dog food ~50 calories per oz
  const ozPerDay = Math.round((calories / 50) * 10) / 10;

  state.dailyCalories = calories;
  state.dailyOz = ozPerDay;

  renderResults();
});

function renderResults() {
  const { name, weightLbs, age, activity, health, dailyCalories, dailyOz } = state;

  $("result-calories").textContent = dailyCalories.toLocaleString();
  $("result-food-oz").textContent = dailyOz;
  $("result-meals").textContent = dailyOz > 12 ? "3×" : "2×";

  // Macros depend on age + activity
  let macros;
  if (age === "puppy")        macros = { protein: 55, fat: 25, carbs: 20, colors: ["#f97316", "#2563eb", "#16a34a"] };
  else if (age === "senior")  macros = { protein: 40, fat: 15, carbs: 45, colors: ["#f97316", "#2563eb", "#16a34a"] };
  else if (activity === "working") macros = { protein: 55, fat: 30, carbs: 15, colors: ["#f97316", "#2563eb", "#16a34a"] };
  else                        macros = { protein: 50, fat: 20, carbs: 30, colors: ["#f97316", "#2563eb", "#16a34a"] };

  const macroBars = $("macro-bars");
  macroBars.innerHTML = [
    { label: "Protein", pct: macros.protein, color: "#f97316" },
    { label: "Fat",     pct: macros.fat,     color: "#2563eb" },
    { label: "Carbs",   pct: macros.carbs,   color: "#16a34a" },
  ].map(m => `
    <div class="macro-row">
      <span class="macro-name">${m.label}</span>
      <div class="macro-track"><div class="macro-fill" style="width:${m.pct}%;background:${m.color}"></div></div>
      <span class="macro-pct" style="color:${m.color}">${m.pct}%</span>
    </div>
  `).join("");

  // Health tip
  let tip = `💡 ${name} needs approximately <strong>${dailyCalories} calories</strong> per day based on ${weightLbs} lbs body weight, ${age} life stage, and ${activity} activity level.`;
  if (health.includes("kidney")) tip += " <strong>Note:</strong> For kidney issues, your vet may recommend a lower-protein diet — consult before using these recipes.";
  if (health.includes("allergies")) tip += " Filter recipes to avoid known allergens.";
  if (state.dailyOz > 20) tip += " That's a big appetite! Divide into 3 meals to aid digestion.";
  $("health-tip").innerHTML = tip;

  show("section-results");
  $("section-results").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---- Show Recipes ----
$("btn-show-recipes").addEventListener("click", () => {
  renderRecipes("all");
  show("section-recipes");
  $("section-recipes").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---- Filter buttons ----
document.addEventListener("click", e => {
  if (e.target.matches(".filter-btn")) {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    state.activeFilter = e.target.dataset.filter;
    renderRecipes(state.activeFilter);
  }
});

function renderRecipes(filter) {
  const grid     = $("recipe-grid");
  const filtered = filter === "all" ? RECIPES : RECIPES.filter(r => r.protein === filter);
  const pro      = isPro();

  grid.innerHTML = filtered.map(r => {
    const locked = !pro && !FREE_RECIPE_IDS.includes(r.id);
    return `
    <div class="recipe-card${locked ? " locked" : ""}" data-id="${r.id}" tabindex="0" role="button" aria-label="${locked ? "Pro: " : ""}${r.name}">
      ${locked ? `<span class="recipe-lock-badge">🔒 Pro</span>` : ""}
      <span class="recipe-emoji">${r.emoji}</span>
      <div class="recipe-name">${r.name}</div>
      <div class="recipe-desc">${r.desc}</div>
      <div class="recipe-tags">
        ${r.tags.map(t => `<span class="recipe-tag ${t.startsWith('🍗')||t.startsWith('🥩')||t.startsWith('🐟')||t.startsWith('🦃') ? 'protein' : t.includes('min') ? 'time' : ''}">${t}</span>`).join("")}
      </div>
    </div>`;
  }).join("") || `<p style="color:var(--text-muted);padding:.5rem">No recipes found for this filter.</p>`;

  // Show free vs pro count hint
  if (!pro) {
    const lockedCount = filtered.filter(r => !FREE_RECIPE_IDS.includes(r.id)).length;
    if (lockedCount > 0) {
      grid.insertAdjacentHTML("beforeend", `
        <div class="pro-recipes-hint">
          🔒 <strong>${lockedCount} more recipe${lockedCount > 1 ? "s" : ""}</strong> available with Pro
          <button class="pro-hint-btn" onclick="showUpgradeModal()">Unlock All ✨</button>
        </div>`);
    }
  }
}

// ---- Recipe card click ----
document.addEventListener("click", e => {
  const card = e.target.closest(".recipe-card");
  if (card) selectRecipe(card.dataset.id);
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const card = e.target.closest(".recipe-card");
    if (card) selectRecipe(card.dataset.id);
  }
});

async function selectRecipe(id) {
  const recipe = RECIPES.find(r => r.id === id);
  if (!recipe) return;

  // Gate Pro recipes
  if (!isPro() && !FREE_RECIPE_IDS.includes(id)) {
    showUpgradeModal();
    return;
  }

  state.selectedRecipe = recipe;
  state.multiplier = 1;
  state.lastAafcoResult = null;

  // ---- Show AAFCO compliance gate ----
  hide("section-cook");
  $("aafco-badge-label").textContent  = "Checking";
  $("aafco-badge-label").className    = "step-badge";
  $("aafco-title").textContent        = `Checking: ${recipe.name}`;
  $("aafco-body").innerHTML = `
    <div class="aafco-loading">
      <div class="aafco-spinner"></div>
      <p>Fetching ingredient data from USDA &amp; checking 5 key nutrients against AAFCO minimums…</p>
    </div>`;
  show("section-aafco");
  $("section-aafco").scrollIntoView({ behavior: "smooth", block: "start" });

  // ---- Fetch nutrition + run AAFCO check ----
  try {
    const nutrition = await usdaRecipeNutrition(recipe, 1);
    const result    = checkAafcoCompliance(nutrition, state.age);
    state.lastAafcoResult = result;
    renderAafcoResult(recipe, result);
  } catch {
    renderAafcoResult(recipe, { compliant: false, noData: true, profileName: "", checks: [] });
  }
}

// ---- Render AAFCO compliance result ----
function renderAafcoResult(recipe, result) {
  const badge = $("aafco-badge-label");
  const title = $("aafco-title");
  const body  = $("aafco-body");

  if (result.noData) {
    badge.textContent = "⚠️ No Data";
    badge.style.background = "#d97706";
    title.textContent = "Compliance Check Unavailable";
    body.innerHTML = `
      <p class="aafco-note warn">Could not fetch USDA data right now (network or rate-limit). You can still view the recipe.</p>
      ${aafcoActions()}`;

  } else if (result.compliant) {
    badge.textContent = "✅ Passed";
    badge.style.background = "#16a34a";
    title.textContent = "Nutrition Check Passed";
    body.innerHTML = `
      <p class="aafco-profile">Standard: <strong>${result.profileName}</strong></p>
      ${aafcoChecksHTML(result.checks)}
      <p class="aafco-note ok">This recipe meets AAFCO minimums for protein, fat, calcium, phosphorus, and vitamin A (5 of 37+ nutrients). For complete nutritional balance, rotate proteins weekly and consult a board-certified veterinary nutritionist.</p>
      ${aafcoActions("View Recipe →")}`;

  } else {
    const failing = result.checks.filter(c => !c.pass).map(c => c.label).join(" & ");
    badge.textContent = "⚠️ Below Minimum";
    badge.style.background = "#d97706";
    title.textContent = "Below AAFCO Minimum";
    body.innerHTML = `
      <p class="aafco-profile">Standard: <strong>${result.profileName}</strong></p>
      ${aafcoChecksHTML(result.checks)}
      <p class="aafco-note warn"><strong>${failing}</strong> ${result.checks.filter(c=>!c.pass).length > 1 ? "are" : "is"} below the AAFCO minimum for your dog's life stage. This check covers 5 key nutrients — consult a veterinary nutritionist for a complete assessment. Consider adding a vet-approved supplement or adjusting ingredients.</p>
      ${aafcoActions("View Anyway →")}`;
  }

  // Wire buttons
  $("aafco-back").addEventListener("click", () => {
    hide("section-aafco");
    $("aafco-badge-label").style.background = "";
    $("section-recipes").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("aafco-proceed").addEventListener("click", () => {
    hide("section-aafco");
    $("aafco-badge-label").style.background = "";
    renderCookPage(state.selectedRecipe, state.lastAafcoResult);
    show("section-cook");
    $("section-cook").scrollIntoView({ behavior: "smooth", block: "start" });
    gtag("event", "recipe_generated", { recipe_name: state.selectedRecipe.name });
    // Reveal email capture after user has seen their first recipe
    show("section-waitlist");
  });
}

function aafcoChecksHTML(checks) {
  return `<div class="aafco-checks">${checks.map(c => `
    <div class="aafco-check ${c.pass ? "pass" : "fail"}">
      <div class="aafco-check-header">
        <span>${c.pass ? "✅" : "❌"}</span>
        <span class="aafco-check-label">${c.label}</span>
        <span class="aafco-check-value">${c.actual}${c.unit} &nbsp;/&nbsp; min ${c.min}${c.unit} per 1000 kcal</span>
      </div>
      <div class="aafco-bar-track">
        <div class="aafco-bar-fill ${c.pass ? "pass" : "fail"}" style="width:${c.pct}%"></div>
      </div>
    </div>`).join("")}</div>`;
}

function aafcoActions(proceedLabel = "View Recipe →") {
  return `
  <p class="aafco-disclaimer">${AAFCO_DISCLAIMER}</p>
  <div class="aafco-actions">
    <button class="btn-secondary" id="aafco-back">← Back to Recipes</button>
    <button class="btn-primary"   id="aafco-proceed">${proceedLabel}</button>
  </div>`;
}

// ---- Render Cook Page ----
function renderCookPage(recipe, aafcoResult = null) {
  $("cook-title").textContent = `${recipe.emoji} ${recipe.name}`;
  $("portions-for").textContent = `${state.name} (${state.dailyOz} oz/day)`;
  $("mult-value").textContent = `${state.multiplier}×`;

  renderIngredients(recipe);
  renderSteps(recipe);
  renderStorage(recipe);
  renderSafetyInRecipe(recipe);
  renderSupplements(aafcoResult);
}

async function renderIngredients(recipe) {
  const m = state.multiplier;
  $("ingredient-list").innerHTML = recipe.ingredients.map(ing => {
    const scaledQty = Math.round(ing.qty * m * 10) / 10;
    return `<li><span class="ing-qty">${scaledQty} ${ing.unit}</span>${ing.item}</li>`;
  }).join("");

  // Show estimated values instantly while USDA loads
  const n = recipe.nutritionPerServing;
  $("nutrition-mini").innerHTML = `
    <div class="nut-source">
      <span class="nut-badge nut-loading" id="nut-badge">⏳ Fetching live USDA data…</span>
    </div>
    <div class="nut-row">Calories <span id="live-cal">${Math.round(recipe.servingCalories * m)}</span></div>
    <div class="nut-row">Protein  <span id="live-protein">${scaleNutrient(n.protein, m)}</span></div>
    <div class="nut-row">Fat      <span id="live-fat">${scaleNutrient(n.fat, m)}</span></div>
    <div class="nut-row">Carbs    <span id="live-carbs">${scaleNutrient(n.carbs, m)}</span></div>
    <div class="nut-row">Fiber    <span id="live-fiber">${scaleNutrient(n.fiber, m)}</span></div>
    <div class="nut-row">Batch    <span>${m}× serving</span></div>
  `;

  // Fetch live nutrition from USDA
  try {
    const live = await usdaRecipeNutrition(recipe, m);
    if (live.matched > 0) {
      $("nut-badge").className  = "nut-badge nut-live";
      $("nut-badge").textContent = "📡 Live USDA Data";
      $("live-cal").textContent     = live.calories;
      $("live-protein").textContent = live.protein + "g";
      $("live-fat").textContent     = live.fat + "g";
      $("live-carbs").textContent   = live.carbs + "g";
      $("live-fiber").textContent   = live.fiber + "g";
    } else {
      $("nut-badge").className  = "nut-badge nut-est";
      $("nut-badge").textContent = "📋 Estimated values";
    }
  } catch {
    $("nut-badge").className  = "nut-badge nut-est";
    $("nut-badge").textContent = "📋 Estimated values";
  }
}

function scaleNutrient(valStr, mult) {
  const val = parseFloat(valStr);
  return isNaN(val) ? valStr : `${Math.round(val * mult)}g`;
}

function renderSteps(recipe) {
  $("steps-list").innerHTML = recipe.steps.map((s, i) =>
    `<li><span class="step-num">${i + 1}</span><span>${s}</span></li>`
  ).join("");
  $("cook-tips").innerHTML = `💡 ${recipe.tips}`;
}

function renderStorage(recipe) {
  $("storage-grid").innerHTML = recipe.storage.map(s =>
    `<div class="storage-item"><strong>${s.label}</strong>${s.value}</div>`
  ).join("");
}

function renderSafetyInRecipe(recipe) {
  $("safe-list").innerHTML = recipe.safeIngredients.map(i =>
    `<li>✅ ${i}</li>`
  ).join("");
  $("unsafe-list").innerHTML = recipe.unsafeSwaps.map(i =>
    `<li>❌ ${i}</li>`
  ).join("");
}

// ---- Multiplier ----
$("mult-up").addEventListener("click", () => {
  if (state.multiplier < 10) {
    state.multiplier++;
    $("mult-value").textContent = `${state.multiplier}×`;
    renderIngredients(state.selectedRecipe);
  }
});
$("mult-down").addEventListener("click", () => {
  if (state.multiplier > 1) {
    state.multiplier--;
    $("mult-value").textContent = `${state.multiplier}×`;
    renderIngredients(state.selectedRecipe);
  }
});

// ---- Back to recipes ----
$("btn-back-recipes").addEventListener("click", () => {
  hide("section-cook");
  $("section-recipes").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---- Print ----
$("btn-print").addEventListener("click", () => window.print());

// ---- Safety Reference Section ----
function renderSafetyReference() {
  const el = $("safety-reference");
  el.innerHTML = `
    <div class="safety-cat">
      <h4 style="color:var(--accent)">✅ Safe Foods</h4>
      <ul>${SAFETY_DATA.safe.map(i => `<li class="dot-green">${i}</li>`).join("")}</ul>
    </div>
    <div class="safety-cat">
      <h4 style="color:var(--danger)">❌ Toxic / Never Feed</h4>
      <ul>${SAFETY_DATA.unsafe.map(i => `<li class="dot-red">${i}</li>`).join("")}</ul>
    </div>
    <div class="safety-cat">
      <h4 style="color:#d97706">⚠️ Use With Caution</h4>
      <ul>${SAFETY_DATA.caution.map(i => `<li class="dot-warn">${i}</li>`).join("")}</ul>
    </div>
  `;
}

// ---- Helpers ----
function show(id) {
  const el = $(id);
  el.classList.remove("hidden");
}
function hide(id) {
  $(id).classList.add("hidden");
}
function showError(msg) {
  showToast(`⚠️ ${msg}`, "error");
}

// ---- Affiliate link map per supplement ----
const SUPP_AFFILIATE = {
  "eggshell-powder":   { amazon: "organic+eggshell+powder+dogs", chewy: "eggshell+powder+dog" },
  "greek-yogurt":      { amazon: "plain+greek+yogurt+probiotic+dog", chewy: "probiotic+yogurt+dog" },
  "nutritional-yeast": { amazon: "nutritional+yeast+dogs+B-vitamins", chewy: "nutritional+yeast+dog+supplement" },
  "kelp-powder":       { amazon: "organic+kelp+powder+dog+supplement", chewy: "kelp+supplement+dog" },
  "pumpkin-seeds":     { amazon: "raw+pumpkin+seeds+dogs+unsalted", chewy: "pumpkin+seed+dog" },
  "bone-broth":        { amazon: "bone+broth+dogs+collagen", chewy: "bone+broth+dog" },
  "chia-seeds":        { amazon: "organic+chia+seeds+dogs", chewy: "chia+seeds+dog" },
  "turmeric":          { amazon: "turmeric+golden+paste+dogs", chewy: "turmeric+dog+supplement" },
  "flaxseed":          { amazon: "ground+flaxseed+dogs+omega", chewy: "flaxseed+dog+supplement" },
  "spirulina":         { amazon: "organic+spirulina+powder+dogs", chewy: "spirulina+dog+supplement" },
};

function suppAffiliateLinks(id) {
  const aff = SUPP_AFFILIATE[id];
  if (!aff) return "";
  const amzUrl   = `https://www.amazon.com/s?k=${aff.amazon}&tag=mealmutt-20`;
  const chewyUrl = `https://www.chewy.com/s?query=${aff.chewy}`;
  return `<div class="aff-row">
    <a href="${amzUrl}" target="_blank" rel="noopener" class="aff-btn amazon">🛒 Amazon</a>
    <a href="${chewyUrl}" target="_blank" rel="noopener" class="aff-btn chewy">🦴 Chewy</a>
  </div>`;
}

// ---- Render Supplements ----
function renderSupplements(aafcoResult) {
  const grid = $("supp-grid");
  const suggested = suggestSupplements(aafcoResult);

  grid.innerHTML = SUPPLEMENTS.map(s => {
    const cat     = SUPPLEMENT_CATEGORIES[s.category];
    const dose    = calcSupplementDose(s, state.weightLbs || 30);
    const isSugg  = suggested.includes(s.id);
    return `
    <div class="supp-card ${isSugg ? "supp-suggested" : ""}" id="supp-${s.id}">
      <div class="supp-card-top">
        <span class="supp-emoji">${s.emoji}</span>
        <div class="supp-info">
          <div class="supp-name">${s.name}</div>
          <span class="supp-cat-badge" style="background:${cat.bg};color:${cat.color}">${cat.label}</span>
          ${isSugg ? `<span class="supp-recommended">⭐ Recommended</span>` : ""}
        </div>
        <button class="supp-toggle" data-id="${s.id}" onclick="toggleSupplement('${s.id}')">+ Add</button>
      </div>
      <div class="supp-nutrient">🎯 ${s.primaryNutrient}</div>
      <div class="supp-benefit">${s.benefit}</div>
      <div class="supp-dose">📏 <strong>${dose}</strong> for ${state.name || "your dog"} (${state.weightLbs || "?"} lbs)</div>
      <div class="supp-prep">👨‍🍳 ${s.prepNote}</div>
      ${suppAffiliateLinks(s.id)}
      <details class="supp-warning-wrap">
        <summary>⚠️ View Warning</summary>
        <p class="supp-warning">${s.warning}</p>
      </details>
    </div>`;
  }).join("");
}

// ---- Toggle supplement on/off ----
function toggleSupplement(id) {
  const btn  = document.querySelector(`.supp-toggle[data-id="${id}"]`);
  const card = $(`supp-${id}`);
  const supp = SUPPLEMENTS.find(s => s.id === id);
  if (!supp || !btn) return;

  const isActive = btn.classList.contains("active");

  if (isActive) {
    btn.classList.remove("active");
    btn.textContent = "+ Add";
    card.classList.remove("supp-active");
  } else {
    btn.classList.add("active");
    btn.textContent = "✓ Added";
    card.classList.add("supp-active");
    // Show toast confirmation
    const dose = calcSupplementDose(supp, state.weightLbs || 30);
    showError(`✅ ${supp.name} added — give ${dose} per meal`);
  }
}

// ---- Init ----
renderSafetyReference();
updateProBanner();
renderSavedProfiles();

// If already on waitlist, show confirmed state immediately
(function checkWaitlistState() {
  const saved = localStorage.getItem("mealmutt_waitlist");
  if (saved) {
    $("waitlist-default").classList.add("hidden");
    $("waitlist-success").classList.remove("hidden");
    $("waitlist-success-msg").textContent =
      `You're already signed up with ${saved}. We'll be in touch soon! 🐾`;
  }
})();

// Close modal on Escape key
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeUpgradeModal();
});

// NOTE: The former ?pro=1 URL parameter bypass has been removed.
// Pro is now activated only via a license key redeemed in the upgrade modal.
// REPLACE WITH SERVER-SIDE VERIFICATION BEFORE SCALING.
