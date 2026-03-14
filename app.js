/*
 * Accessible Sight Status – frontend logic
 *
 * This script loads landmark data from data.json, provides language
 * translation (German/English), filters by city and accessibility and
 * renders both a Leaflet map with colour‑coded markers and a list/grid of
 * places. When the user clicks a marker or card, detailed information
 * appears in a side card. The interface automatically adjusts when the
 * language or city changes. The dataset is updated every 14 days via
 * an external script; the timestamps are displayed to the user.
 */

// Translation strings for interface labels and headings
const TEXT = {
  de: {
    title: "Status barrierefreier Sehenswürdigkeiten",
    tagline:
      "Live‑Status der Zugänglichkeit berühmter Sehenswürdigkeiten in Florenz und Rom.",
    language: "Sprache",
    city: "Stadt",
    accessibleOnly: "Nur rollstuhlgerecht",
    placesLoaded: "Orte geladen",
    lastUpdate: "Letzte Aktualisierung",
    disclaimer:
      "Diese Seite sammelt Informationen aus offiziellen Quellen wie Visit Tuscany, FeelFlorence und Turismo Roma. Die Aktualität der Daten hängt von diesen Quellen ab. Verzögerungen sind möglich.",
    detailHint: "Wählen Sie einen Ort aus der Liste oder auf der Karte.",
    sourcesHeading: "Quellen",
    sourcesNote: "Offizielle Seiten der einzelnen Museen und Denkmäler",
    all: "Alle",
    open: "Offen",
    limited: "Eingeschränkt",
    closed: "Geschlossen",
    unverified: "Nicht bestätigt",
    yes: "Ja",
    no: "Nein",
    wheelchair: "Rollstuhlgerecht",
    partial: "Teilweise sichtbar",
    full: "Voll sichtbar",
    hidden: "Stark verdeckt",
    status: "Status",
    visibility: "Sichtbarkeit",
    access: "Zugang",
    source: "Quelle",
    checkedAt: "Letzte Prüfung",
    construction: "Baustelle",
    address: "Adresse",
    visitSite: "Offizielle Seite",
    cityRome: "Rom",
    cityFlorence: "Florenz"
    ,
    notesLabel: "Hinweis"
  },
  en: {
    title: "Accessible Sight Status",
    tagline:
      "Live status of accessibility for famous landmarks in Florence and Rome.",
    language: "Language",
    city: "City",
    accessibleOnly: "Wheelchair accessible only",
    placesLoaded: "Places loaded",
    lastUpdate: "Last update",
    disclaimer:
      "This site collects information from official sources such as Visit Tuscany, FeelFlorence and Turismo Roma. The timeliness of the data depends on these sources. Delays are possible.",
    detailHint: "Select a place from the list or on the map.",
    sourcesHeading: "Sources",
    sourcesNote: "Official pages of each museum and monument",
    all: "All",
    open: "Open",
    limited: "Restricted",
    closed: "Closed",
    unverified: "Unverified",
    yes: "Yes",
    no: "No",
    wheelchair: "Wheelchair accessible",
    partial: "Partially visible",
    full: "Fully visible",
    hidden: "Mostly covered",
    status: "Status",
    visibility: "Visibility",
    access: "Access",
    source: "Source",
    checkedAt: "Last checked",
    construction: "Construction",
    address: "Address",
    visitSite: "Official site",
    cityRome: "Rome",
    cityFlorence: "Florence"
    ,
    notesLabel: "Note"
  }
};

// Application state
const state = {
  lang: "de",
  city: null,
  accessibleOnly: false,
  places: [],
  filteredPlaces: [],
  selectedPlaceId: null,
  map: null,
  markers: []
};

/**
 * Translation helper
 * @param {string} key
 */
function t(key) {
  const langStrings = TEXT[state.lang] || {};
  return langStrings[key] || key;
}

/**
 * Apply UI translations to elements with data-i18n attribute
 */
function applyTranslations() {
  // Set lang attribute on html for accessibility
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key && TEXT[state.lang][key] !== undefined) {
      el.textContent = TEXT[state.lang][key];
    }
  });

  // Update city select options to reflect translation
  const citySelect = document.getElementById("citySelect");
  // Save current city
  const current = state.city;
  // Clear and rebuild
  citySelect.innerHTML = "";
  const uniqueCities = [...new Set(state.places.map((p) => p.city))];
  uniqueCities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    // Translate city names using keys cityRome/cityFlorence if available
    if (city === "Rome") option.textContent = t("cityRome");
    else if (city === "Florence") option.textContent = t("cityFlorence");
    else option.textContent = city;
    citySelect.appendChild(option);
  });
  // Restore selection
  if (current) citySelect.value = current;
  // Update accessibleOnly label
  const accessibleLabel = document.querySelector('label[for="accessibleOnly"] span');
  if (accessibleLabel) accessibleLabel.textContent = t("accessibleOnly");
  // Update control labels (language, city)
  document.querySelector('label[for="languageSelect"] span').textContent = t(
    "language"
  );
  document.querySelector('label[for="citySelect"] span').textContent = t(
    "city"
  );
  // Update disclaimer text and headings (they use data-i18n already)
}

/**
 * Load data from data.json
 */
async function loadData() {
  const res = await fetch("data.json");
  const json = await res.json();
  state.places = json;
  // Determine initial city if none
  if (!state.city) {
    state.city = json[0]?.city || "Florence";
  }
}

/**
 * Filter places based on current state
 */
function filterPlaces() {
  state.filteredPlaces = state.places.filter((p) => {
    if (p.city !== state.city) return false;
    if (state.accessibleOnly && !p.wheelchair) return false;
    return true;
  });
  // Update counts and lastSync display
  document.getElementById("placeCount").textContent = String(
    state.filteredPlaces.length
  );
  // Compute latest lastChecked across entire dataset
  const latestDate = state.places
    .map((p) => new Date(p.lastChecked))
    .reduce((a, b) => (a > b ? a : b), new Date(0));
  document.getElementById("lastSync").textContent = formatDate(latestDate);
}

/**
 * Format date into locale string based on selected language
 * @param {Date} date
 */
function formatDate(date) {
  if (!(date instanceof Date)) return "—";
  const locale = state.lang === "de" ? "de-DE" : "en-GB";
  return date.toLocaleDateString(locale);
}

/**
 * Build and update the list/grid of places
 */
function renderPlaces() {
  const grid = document.getElementById("placesGrid");
  grid.innerHTML = "";
  if (!state.filteredPlaces.length) {
    const empty = document.createElement("div");
    empty.className = "detail-card empty";
    empty.textContent = state.lang === "de" ? "Keine Orte für diese Auswahl." : "No places found for this selection.";
    grid.appendChild(empty);
    return;
  }
  state.filteredPlaces.forEach((place) => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.dataset.id = place.id;
    card.innerHTML = `
      <img class="place-image" src="${place.image_url}" alt="${place.name}">
      <div class="place-body">
        <div class="place-top">
          <div>
            <h3 class="place-title">${place.name}</h3>
            <p class="place-subtitle">${state.lang === 'de' ? (place.city === 'Rome' ? t('cityRome') : t('cityFlorence')) : place.city}</p>
          </div>
          <span class="badge ${statusClass(place.status)}">${statusLabel(place.status)}</span>
        </div>
        <div class="mini-list">
          <div><strong>${t('access')}:</strong> ${place.wheelchair ? t('yes') : t('no')}</div>
          <div><strong>${t('checkedAt')}:</strong> ${formatDate(new Date(place.lastChecked))}</div>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      renderDetail(place.id);
      focusMarker(place.id);
      // Scroll card into view for mobile
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    grid.appendChild(card);
  });
}

/**
 * Convert status string to CSS class
 * @param {string} status
 */
function statusClass(status) {
  switch (status) {
    case "OPEN":
      return "open";
    case "LIMITED":
      return "limited";
    case "CLOSED":
      return "closed";
    default:
      return "unverified";
  }
}

/**
 * Convert status string to translated label
 * @param {string} status
 */
function statusLabel(status) {
  switch (status) {
    case "OPEN":
      return t("open");
    case "LIMITED":
      return t("limited");
    case "CLOSED":
      return t("closed");
    default:
      return t("unverified");
  }
}

/**
 * Render the Leaflet map and markers
 */
function renderMap() {
  // If Leaflet failed to load (e.g. CDN blocked), skip rendering
  if (typeof L === "undefined") {
    const mapEl = document.getElementById("map");
    if (mapEl) {
      mapEl.innerHTML =
        state.lang === "de"
          ?
            "<p style=\"padding:1rem;\">Die interaktive Karte konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung oder laden Sie die Seite später erneut.</p>"
          :
            "<p style=\"padding:1rem;\">The interactive map could not be loaded. Please check your internet connection or try again later.</p>";
    }
    return;
  }
  // Initialize map if not yet created
  if (!state.map) {
    state.map = L.map("map", { scrollWheelZoom: true });
    // Use the standard tile server; fallback to non subdomain to avoid DNS or firewall blocks
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.map);
  }
  // Center the map on selected city
  const center = cityCenter(state.city);
  state.map.setView(center, 13);
  // Remove existing markers
  state.markers.forEach(({ marker }) => state.map.removeLayer(marker));
  state.markers = [];
  // Add markers for filtered places
  state.filteredPlaces.forEach((place) => {
    const color = statusColour(place.status);
    const icon = L.divIcon({
      className: "custom-pin",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 2px rgba(23,32,51,.2)"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    const marker = L.marker([place.latitude, place.longitude], { icon }).addTo(
      state.map
    );
    marker.bindPopup(buildPopup(place));
    marker.on("click", () => renderDetail(place.id));
    state.markers.push({ id: place.id, marker });
  });
}

/**
 * Convert status to colour for marker
 * @param {string} status
 */
function statusColour(status) {
  switch (status) {
    case "OPEN":
      return "#0e9f6e"; // green
    case "LIMITED":
      return "#d69e2e"; // amber
    case "CLOSED":
      return "#dc2626"; // red
    default:
      return "#64748b"; // grey
  }
}

/**
 * Build popup HTML for marker
 * @param {object} place
 */
function buildPopup(place) {
  return `
    <div style="min-width:180px">
      <strong>${place.name}</strong><br>
      <span>${statusLabel(place.status)}</span><br>
      <small>${t("checkedAt")}: ${formatDate(new Date(place.lastChecked))}</small>
    </div>
  `;
}

/**
 * Move map view and open popup for a specific marker
 * @param {number} id
 */
function focusMarker(id) {
  const entry = state.markers.find((m) => m.id === id);
  const place = state.filteredPlaces.find((p) => p.id === id);
  if (entry && place) {
    state.map.setView([place.latitude, place.longitude], 15);
    entry.marker.openPopup();
  }
}

/**
 * Render the detailed view card
 * @param {number|null} id
 */
function renderDetail(id) {
  const card = document.getElementById("detailCard");
  const place = state.filteredPlaces.find((p) => p.id === id);
  if (!place) {
    // Show hint if no place selected
    card.className = "detail-card empty";
    card.innerHTML = `<p>${t("detailHint")}</p>`;
    return;
  }
  card.className = "detail-card";
  state.selectedPlaceId = place.id;
  card.innerHTML = `
    <div class="detail-grid">
      <div>
        <img class="detail-image" src="${place.image_url}" alt="${place.name}">
      </div>
      <div class="detail-meta">
        <div>
          <div class="place-top">
            <div>
              <h2 class="place-title">${place.name}</h2>
              <p class="place-subtitle">${state.lang === 'de' ? (place.city === 'Rome' ? t('cityRome') : t('cityFlorence')) : place.city}</p>
            </div>
            <span class="badge ${statusClass(place.status)}">${statusLabel(place.status)}</span>
          </div>
          <p>${state.lang === 'de' ? place.description_de : place.description}</p>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <div class="label">${t('access')}</div>
            <div>${place.wheelchair ? t('yes') : t('no')}</div>
          </div>
          <div class="info-box">
            <div class="label">${t('checkedAt')}</div>
            <div>${formatDate(new Date(place.lastChecked))}</div>
          </div>
          <div class="info-box">
            <div class="label">${t('status')}</div>
            <div>${statusLabel(place.status)}</div>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <div class="label">${t('source')}</div>
            <div>${place.sources && place.sources.length ? place.sources.join(', ') : '—'}</div>
          </div>
        </div>
        <p style="margin-top:0.5rem; font-size:0.85rem;"><strong>${t('notesLabel')}:</strong> ${state.lang === 'de' ? place.notes_de : place.notes}</p>
      </div>
    </div>
  `;
}

/**
 * Determine approximate centre coordinates for each city
 * @param {string} city
 */
function cityCenter(city) {
  return city === "Florence" ? [43.7696, 11.2558] : [41.9028, 12.4964];
}

/**
 * Bind event listeners to UI controls
 */
function bindEvents() {
  const languageSelect = document.getElementById("languageSelect");
  const citySelect = document.getElementById("citySelect");
  const accessibleCheckbox = document.getElementById("accessibleOnly");
  // Language change
  languageSelect.addEventListener("change", (e) => {
    state.lang = e.target.value;
    applyTranslations();
    renderPlaces();
    renderDetail(state.selectedPlaceId);
    renderMap();
  });
  // City change
  citySelect.addEventListener("change", (e) => {
    state.city = e.target.value;
    filterPlaces();
    renderPlaces();
    renderMap();
    renderDetail(null);
  });
  // Accessible filter toggle
  accessibleCheckbox.addEventListener("change", (e) => {
    state.accessibleOnly = e.target.checked;
    filterPlaces();
    renderPlaces();
    renderMap();
    renderDetail(null);
  });
}

/**
 * Initialise the application
 */
async function start() {
  await loadData();
  // Apply translations first
  applyTranslations();
  // Filter places and render initial view
  filterPlaces();
  renderPlaces();
  renderMap();
  renderDetail(null);
  // Bind controls
  bindEvents();
}

// Kick off when DOM ready
document.addEventListener("DOMContentLoaded", start);