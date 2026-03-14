/**
 * updateData.js
 *
 * This script is intended to run periodically (e.g. every 14 days) to update
 * the `data.json` file used by the Accessible Attractions website. It
 * demonstrates how you might fetch data from official sources and extract
 * relevant information about accessibility. Because the official tourism
 * websites do not provide structured APIs, you will likely need to adjust
 * the scraping logic below if the pages change their layout. Always verify
 * that automated scraping is permitted by the terms of service of each
 * website.
 */

const fs = require('fs');

// Helper to fetch a URL and return text
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

/**
 * Placeholder function for scraping Visit Tuscany's page.
 * It should parse the HTML and extract an array of objects with fields
 * matching the structure of entries in data.json. In this example we return
 * the existing hardcoded entries.
 */
async function scrapeVisitTuscany() {
  // Example: fetch the page and parse with regex or DOM libraries (e.g. cheerio).
  // For demonstration we return hardcoded objects. Replace with real scraping.
  return [
    {
      id: 1,
      city: 'Florence',
      name: "Galleria dell'Accademia",
      status: 'OPEN',
      visibility: 'FULL',
      accessibility: {
        wheelchair: true,
        entrance: 'wheelchair‑friendly entrance',
        toilet: true,
        notes: 'Fully step‑free route, accessible toilets, tactile aids and free loan wheelchairs.'
      },
      source: 'Visit Tuscany',
      lastChecked: new Date().toISOString().split('T')[0],
      url: 'https://www.visittuscany.com/en/ideas/barrier-free-art-venues-in-florence/',
      description: 'Die Galleria dell’Accademia ist vollständig barrierefrei. Sie verfügt über einen stufenlosen Eingang, einen behindertengerechten Rundgang, barrierefreie Toiletten sowie ein Tastmodell und taktile Karten.'
    },
    {
      id: 2,
      city: 'Florence',
      name: 'Uffizien',
      status: 'OPEN',
      visibility: 'FULL',
      accessibility: {
        wheelchair: true,
        entrance: 'wheelchair‑friendly entrance',
        toilet: true,
        notes: 'Rollstuhlgerechter Eingang, Aufzüge zu allen Stockwerken, barrierefreie Toiletten, rampenloser Zugang beim Palazzo Pitti, kostenlose Leihrollstühle und Blindenhunde erlaubt.'
      },
      source: 'Visit Tuscany',
      lastChecked: new Date().toISOString().split('T')[0],
      url: 'https://www.visittuscany.com/en/ideas/barrier-free-art-venues-in-florence/',
      description: 'Die Uffizien bieten einen rollstuhlgerechten Eingang, Aufzüge zu allen Stockwerken, barrierefreie Toiletten, einen rampenlosen Zugang beim Palazzo Pitti, kostenlose Leihrollstühle sowie Blindenhunde.'
    }
  ];
}

/**
 * Placeholder function for scraping Turismo Roma's page.
 * It should return an array of objects like those in data.json. Here we
 * return a static entry for demonstration.
 */
async function scrapeTurismoRoma() {
  return [
    {
      id: 3,
      city: 'Rome',
      name: 'Colosseum Archaeological Park',
      status: 'OPEN',
      visibility: 'FULL',
      accessibility: {
        wheelchair: true,
        entrance: 'wheelchair‑friendly entrance',
        toilet: true,
        notes: 'Barrierefreie Eingänge und Aufzug zum Obergeschoss.'
      },
      source: 'Turismo Roma',
      lastChecked: new Date().toISOString().split('T')[0],
      url: 'https://www.turismoroma.it/en/roma-accessibile',
      description: 'Die Seite "Rome accessible" liefert verifizierte Informationen zur Barrierefreiheit. Mithilfe der Filter "Accessible entrance" und "Toilet" lassen sich barrierefreie Orte wie das Kolosseum finden.'
    }
  ];
}

async function runUpdate() {
  try {
    const tuscanyData = await scrapeVisitTuscany();
    const romaData = await scrapeTurismoRoma();
    const combined = [...tuscanyData, ...romaData];
    // Write to data.json
    fs.writeFileSync('data.json', JSON.stringify(combined, null, 2));
    console.log(`Updated data.json with ${combined.length} entries.`);
  } catch (err) {
    console.error('Error updating data:', err);
  }
}

runUpdate();