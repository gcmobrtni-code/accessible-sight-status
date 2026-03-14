async function fetchData() {
  const response = await fetch('data.json');
  return response.json();
}

// Format date string as readable
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE');
}

function renderPlaces(places) {
  const container = document.getElementById('places');
  container.innerHTML = '';
  if (!places.length) {
    container.innerHTML = '<p>No places match your filters.</p>';
    return;
  }
  places.forEach(place => {
    const card = document.createElement('div');
    card.className = 'place-card';
    const header = document.createElement('div');
    header.className = 'place-header';
    header.innerHTML = `<span>${place.name}</span><span class="status ${place.status.toLowerCase()}">${place.status}</span>`;
    const body = document.createElement('div');
    body.className = 'place-body';
    body.innerHTML = `
      <p><strong>City:</strong> ${place.city}</p>
      <p><strong>Description:</strong> ${place.description}</p>
      <p><strong>Accessibility:</strong> ${place.accessibility.notes}</p>
      <p><strong>Source:</strong> <a href="${place.url}" target="_blank" rel="noreferrer">${place.source}</a></p>
      <p><strong>Last checked:</strong> ${formatDate(place.lastChecked)}</p>
    `;
    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
  });
}

function updateView(data) {
  const citySelect = document.getElementById('citySelect');
  const accessibleOnly = document.getElementById('accessibleOnly');
  let filtered = data.filter(item => item.city === citySelect.value);
  if (accessibleOnly.checked) {
    filtered = filtered.filter(item => item.accessibility.wheelchair);
  }
  renderPlaces(filtered);
  // update last updated date
  const lastUpdatedElem = document.getElementById('lastUpdated');
  const latestDate = data.reduce((latest, item) => {
    const current = new Date(item.lastChecked);
    return current > latest ? current : latest;
  }, new Date(0));
  lastUpdatedElem.textContent = formatDate(latestDate.toISOString());
}

async function initialize() {
  const data = await fetchData();
  const citySelect = document.getElementById('citySelect');
  const accessibleOnly = document.getElementById('accessibleOnly');
  // event listeners
  citySelect.addEventListener('change', () => updateView(data));
  accessibleOnly.addEventListener('change', () => updateView(data));
  // initial render
  updateView(data);
}

document.addEventListener('DOMContentLoaded', initialize);