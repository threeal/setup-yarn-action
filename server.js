/* server.js - Simple Express proxy for OpenWeatherMap */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const API_BASE = 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.OWM_API_KEY;
const PORT = process.env.PORT || 3000;

// Simple in-memory cache: key -> { ts, data }
const cache = new Map();
const TTL = 10 * 60 * 1000; // 10 minutes

function cacheGet(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function cacheSet(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    const err = new Error(`${res.status} ${res.statusText}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

if (!API_KEY) {
  console.warn('Warning: OWM_API_KEY not set in environment. Requests will fail until it is set.');
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files from public/
app.use(express.static('public'));

// Proxy endpoint: GET /api/weather?city=London&units=metric
app.get('/api/weather', async (req, res) => {
  try {
    const { city, units = 'metric' } = req.query;
    if (!city) return res.status(400).json({ error: 'Missing city query parameter' });

    const key = `city:${city}:units:${units}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ cached: true, ...cached });

    if (!API_KEY) return res.status(500).json({ error: 'Server missing OWM_API_KEY' });

    const currentUrl = `${API_BASE}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;
    const forecastUrl = `${API_BASE}/forecast?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;

    const [current, forecast] = await Promise.all([fetchJson(currentUrl), fetchJson(forecastUrl)]);
    const out = { current, forecast, fetchedAt: new Date().toISOString() };
    cacheSet(key, out);
    res.json({ cached: false, ...out });
  } catch (err) {
    console.error('Error /api/weather', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Proxy endpoint: GET /api/weather/coords?lat=..&lon=..&units=metric
app.get('/api/weather/coords', async (req, res) => {
  try {
    const { lat, lon, units = 'metric' } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat and/or lon query parameters' });

    const key = `coords:${lat},${lon}:units:${units}`;
    const cached = cacheGet(key);
    if (cached) return res.json({ cached: true, ...cached });

    if (!API_KEY) return res.status(500).json({ error: 'Server missing OWM_API_KEY' });

    const currentUrl = `${API_BASE}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const forecastUrl = `${API_BASE}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;

    const [current, forecast] = await Promise.all([fetchJson(currentUrl), fetchJson(forecastUrl)]);
    const out = { current, forecast, fetchedAt: new Date().toISOString() };
    cacheSet(key, out);
    res.json({ cached: false, ...out });
  } catch (err) {
    console.error('Error /api/weather/coords', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
