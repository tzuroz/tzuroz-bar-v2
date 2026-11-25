// Fields in each cocktail that are not ingredients.
const NON_INGREDIENT_FIELDS = ["Cocktail Name", "Category", "Method", "Image", "Image Source"];
const BAR_STORAGE_KEY = "tzuroz-bar:my-bar";

let allCocktails = [];
let drinkSelectCategory = null; // which category the cocktail dropdown currently lists

const $ = id => document.getElementById(id);

fetch("cocktail_list1.json")
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    allCocktails = data;
    setUpCategoryAndDrinkSelects();
    setUpIngredientSelect();
    setUpNameSearch();
    setUpRandomButton();
    setUpBarPanel();

    // Open the cocktail named in the link (e.g. #negroni), or the first one.
    const fromHash = findCocktailBySlug(location.hash.slice(1));
    showCocktail(fromHash || allCocktails[0], { updateHash: false });
    window.addEventListener("hashchange", () => {
      const cocktail = findCocktailBySlug(location.hash.slice(1));
      if (cocktail) showCocktail(cocktail, { updateHash: false });
    });
  })
  .catch(error => {
    console.error("Could not load cocktails:", error);
    $("loadError").hidden = false;
  });

/* ---------- Helpers ---------- */

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasValue(value) {
  return typeof value === "string" && value.trim() !== "";
}

// The ingredients a cocktail uses, as [name, amount] pairs.
function ingredientsOf(cocktail) {
  return Object.entries(cocktail).filter(
    ([key, value]) => !NON_INGREDIENT_FIELDS.includes(key) && hasValue(value)
  );
}

function allIngredientNames() {
  const names = new Set();
  allCocktails.forEach(c => ingredientsOf(c).forEach(([name]) => names.add(name)));
  return [...names].sort((a, b) => a.localeCompare(b));
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findCocktailBySlug(slug) {
  if (!slug) return null;
  slug = decodeURIComponent(slug);
  return allCocktails.find(c => slugify(c["Cocktail Name"]) === slug) || null;
}

/* ---------- Showing a cocktail ---------- */

// Single entry point used by every control: keeps both dropdowns in sync,
// renders the card and updates the shareable link.
function showCocktail(cocktail, { updateHash = true, scroll = false } = {}) {
  if (!cocktail) return;

  const categorySelect = $("categorySelect");
  categorySelect.value = cocktail.Category;
  if (drinkSelectCategory !== cocktail.Category) fillDrinkSelect(cocktail.Category);
  $("drinkSelect").value = cocktail["Cocktail Name"];

  renderCard(cocktail);

  if (updateHash) {
    history.replaceState(null, "", "#" + slugify(cocktail["Cocktail Name"]));
  }
  if (scroll) {
    $("cocktailDisplay").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderCard(cocktail) {
  const name = cocktail["Cocktail Name"];
  const ingredientItems = ingredientsOf(cocktail)
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`)
    .join("");

  $("cocktailDisplay").innerHTML = `
    <div class="card-content">
      <h2>${escapeHtml(name)}</h2>

      <h3>Category:</h3>
      <ul><li>${escapeHtml(cocktail.Category || "N/A")}</li></ul>

      <h3>Ingredients:</h3>
      <ul>${ingredientItems}</ul>

      <h3>Method:</h3>
      <ul><li>${escapeHtml(cocktail.Method || "N/A")}</li></ul>

      <button type="button" class="share-btn" id="shareBtn">🔗 Copy link to this cocktail</button>
    </div>
    ${hasValue(cocktail.Image) ? `
      <figure class="photo">
        <img src="${escapeHtml(cocktail.Image)}" alt="${escapeHtml(name)}" class="cocktail-image" loading="lazy" />
        ${photoCredit(cocktail["Image Source"])}
      </figure>` : ""}
  `;

  const photo = $("cocktailDisplay").querySelector(".photo");
  if (photo) photo.querySelector("img").addEventListener("error", () => photo.remove());

  $("shareBtn").addEventListener("click", () => copyLink(cocktail));
}

// "Photo: example.com" linking to where the picture came from.
function photoCredit(source) {
  if (!hasValue(source)) return "";
  let host;
  try {
    host = new URL(source).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
  return `<figcaption>Photo: <a href="${escapeHtml(source)}" target="_blank" rel="noopener">${escapeHtml(host)}</a></figcaption>`;
}

function copyLink(cocktail) {
  const url = location.href.split("#")[0] + "#" + slugify(cocktail["Cocktail Name"]);
  const button = $("shareBtn");
  const done = text => {
    button.textContent = text;
    setTimeout(() => (button.textContent = "🔗 Copy link to this cocktail"), 2000);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => done("✅ Link copied!"), () => prompt("Copy this link:", url));
  } else {
    prompt("Copy this link:", url);
  }
}

// A clickable list of cocktails (used by name and ingredient search).
function renderResultList(container, cocktails, emptyMessage, extraText = () => "") {
  container.innerHTML = "";
  if (cocktails.length === 0) {
    container.innerHTML = `<p class="no-results">${escapeHtml(emptyMessage)}</p>`;
    return;
  }
  cocktails.forEach(cocktail => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "result";
    item.innerHTML = `
      <span class="result-name">${escapeHtml(cocktail["Cocktail Name"])}</span>
      <span class="result-meta">${escapeHtml(cocktail.Category)}${extraText(cocktail)}</span>
    `;
    item.addEventListener("click", () => showCocktail(cocktail, { scroll: true }));
    container.appendChild(item);
  });
}

/* ---------- Category + cocktail dropdowns ---------- */

function setUpCategoryAndDrinkSelects() {
  const categorySelect = $("categorySelect");
  const categories = [...new Set(allCocktails.map(c => c.Category).filter(Boolean))];

  categories.forEach(category => categorySelect.add(new Option(category, category)));

  categorySelect.addEventListener("change", () => {
    fillDrinkSelect(categorySelect.value);
    const first = allCocktails.find(c => c.Category === categorySelect.value);
    showCocktail(first);
  });

  // Added once here, so listeners don't pile up when the category changes.
  $("drinkSelect").addEventListener("change", e => {
    const cocktail = allCocktails.find(c => c["Cocktail Name"] === e.target.value);
    showCocktail(cocktail);
  });
}

function fillDrinkSelect(category) {
  const drinkSelect = $("drinkSelect");
  drinkSelect.innerHTML = "";
  drinkSelectCategory = category;
  allCocktails
    .filter(c => c.Category === category)
    .forEach(c => drinkSelect.add(new Option(c["Cocktail Name"], c["Cocktail Name"])));
}

/* ---------- Search by ingredient ---------- */

function setUpIngredientSelect() {
  const ingredientSelect = $("ingredientSelect");
  allIngredientNames().forEach(name => ingredientSelect.add(new Option(name, name)));

  ingredientSelect.addEventListener("change", () => {
    const results = $("ingredientResults");
    const ingredient = ingredientSelect.value;
    if (!ingredient) {
      results.innerHTML = "";
      return;
    }
    const matches = allCocktails.filter(c => hasValue(c[ingredient]));
    renderResultList(results, matches, "No cocktails found with that ingredient.",
      c => ` · ${escapeHtml(c[ingredient])}`);
  });
}

/* ---------- Search by name ---------- */

function setUpNameSearch() {
  const input = $("nameSearch");
  const results = $("nameResults");
  const normalise = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  input.addEventListener("input", () => {
    const query = normalise(input.value.trim());
    if (!query) {
      results.innerHTML = "";
      return;
    }
    const matches = allCocktails.filter(c => normalise(c["Cocktail Name"]).includes(query));
    renderResultList(results, matches, "No cocktails match that name.");
  });

  // Pressing Enter opens the first match.
  input.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const first = results.querySelector(".result");
    if (first) first.click();
  });
}

/* ---------- Random cocktail ---------- */

function setUpRandomButton() {
  $("randomBtn").addEventListener("click", () => {
    const current = $("drinkSelect").value;
    let pick;
    do {
      pick = allCocktails[Math.floor(Math.random() * allCocktails.length)];
    } while (allCocktails.length > 1 && pick["Cocktail Name"] === current);
    showCocktail(pick, { scroll: true });
  });
}

/* ---------- What can I make? ---------- */

function loadBar() {
  try {
    return new Set(JSON.parse(localStorage.getItem(BAR_STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveBar(bar) {
  try {
    localStorage.setItem(BAR_STORAGE_KEY, JSON.stringify([...bar]));
  } catch {
    // Storage unavailable (e.g. private mode); the checklist still works for this visit.
  }
}

function setUpBarPanel() {
  const bar = loadBar();
  const checklist = $("barChecklist");

  allIngredientNames().forEach(name => {
    const label = document.createElement("label");
    label.className = "check";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = name;
    box.checked = bar.has(name);
    box.addEventListener("change", () => {
      box.checked ? bar.add(name) : bar.delete(name);
      saveBar(bar);
      renderBarResults(bar);
    });
    label.append(box, " " + name);
    checklist.appendChild(label);
  });

  $("clearBar").addEventListener("click", () => {
    bar.clear();
    saveBar(bar);
    checklist.querySelectorAll("input").forEach(box => (box.checked = false));
    renderBarResults(bar);
  });

  renderBarResults(bar);
}

function renderBarResults(bar) {
  const container = $("barResults");
  if (bar.size === 0) {
    container.innerHTML = `<p class="no-results">Tick some ingredients to see what you can make.</p>`;
    return;
  }

  const canMake = [];
  const missingOne = [];
  allCocktails.forEach(cocktail => {
    const missing = ingredientsOf(cocktail).map(([n]) => n).filter(n => !bar.has(n));
    if (missing.length === 0) canMake.push(cocktail);
    else if (missing.length === 1) missingOne.push({ cocktail, missing: missing[0] });
  });

  container.innerHTML = `
    <h4>You can make (${canMake.length})</h4>
    <div id="canMakeList" class="results"></div>
    <h4>Just one ingredient missing (${missingOne.length})</h4>
    <div id="missingOneList" class="results"></div>
  `;
  renderResultList($("canMakeList"), canMake, "Nothing yet. Try ticking a few more.");

  const missingByName = new Map(missingOne.map(m => [m.cocktail, m.missing]));
  renderResultList($("missingOneList"), missingOne.map(m => m.cocktail), "None.",
    c => ` · needs <strong>${escapeHtml(missingByName.get(c))}</strong>`);
}
