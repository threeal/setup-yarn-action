// app.js (client) - calls local proxy endpoints under /api/*
const API_PREFIX = '/api';
const CACHE_TTL_MS = 10 * 60 * 1000; // localStorage UI cache

// ---------- Utilities ----------
function qs(sel){ return document.querySelector(sel) }
function el(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e }
function nowIso(){ return new Date().toISOString() }
function utcToLocalTime(ts, timezoneOffsetSeconds){
  const utcMs = ts * 1000;
  const localMs = utcMs + (timezoneOffsetSeconds * 1000);
  return new Date(localMs).toLocaleString();
}

function setStatus(msg, isError=false){
  const status = qs('#status');
  status.textContent = msg;
  status.style.color = isError ? '#ffb4b4' : '';
}

// ---------- Simple caching (client-side UI cache) ----------
function cacheKeyFor(query, units){ return `ui_cache::${query}::${units}` }
function writeCache(key, value){
  const payload = { ts: Date.now(), value };
  try { localStorage.setItem(key, JSON.stringify(payload)) } catch(e){}
}
function readCache(key){
  try {
    const raw = localStorage.getItem(key);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(Date.now() - parsed.ts > CACHE_TTL_MS) { localStorage.removeItem(key); return null }
    return parsed.value;
  } catch(e){ return null }
}

// ---------- Fetch via proxy ----------
async function fetchJson(url){
  const res = await fetch(url);
  if(!res.ok){
    const txt = await res.text().catch(()=>res.statusText);
    throw new Error(`${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

async function getWeatherByCity(city, units='metric'){
  const cacheKey = cacheKeyFor(city, units);
  const cached = readCache(cacheKey);
  if(cached) return cached;

  const url = `${API_PREFIX}/weather?city=${encodeURIComponent(city)}&units=${units}`;
  const json = await fetchJson(url);
  const out = { source: 'proxy', ...json };
  writeCache(cacheKey, out);
  return out;
}

async function getWeatherByCoords(lat, lon, units='metric'){
  const cacheKey = cacheKeyFor(`${lat},${lon}`, units);
  const cached = readCache(cacheKey);
  if(cached) return cached;

  const url = `${API_PREFIX}/weather/coords?lat=${lat}&lon=${lon}&units=${units}`;
  const json = await fetchJson(url);
  const out = { source: 'proxy', ...json };
  writeCache(cacheKey, out);
  return out;
}

// ---------- UI rendering (same as before) ----------
function iconUrl(iconCode){ return `https://openweathermap.org/img/wn/${iconCode}@2x.png` }

function renderWeather(data, units){
  qs('#weather').classList.remove('hidden');
  qs('#weather').setAttribute('aria-hidden', 'false');
  const cur = data.current;
  const tz = cur.timezone; // seconds offset
  qs('#locName').textContent = `${cur.name}, ${cur.sys?.country || ''}`;
  qs('#locTime').textContent = utcToLocalTime(cur.dt, tz);
  qs('#nowIcon').src = iconUrl(cur.weather[0].icon);
  qs('#nowIcon').alt = cur.weather[0].description || '';
  qs('#nowTemp').textContent = `${Math.round(cur.main.temp)}°${units==='metric'?'C':'F'}`;
  qs('#nowDesc').textContent = cur.weather[0].description;
  qs('#nowDetails').textContent = `Feels like ${Math.round(cur.main.feels_like)}° • Humidity ${cur.main.humidity}% • Wind ${cur.wind.speed} ${units==='metric'?'m/s':'mph'}`;

  const li = data.forecast.list || [];
  const byDay = {};
  li.forEach(item => {
    const d = new Date(item.dt * 1000);
    const day = d.toISOString().slice(0,10);
    if(!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  });

  const days = Object.keys(byDay).slice(0,5);
  const container = qs('#forecast');
  container.innerHTML = '';
  days.forEach(day => {
    const items = byDay[day];
    let pick = items.reduce((best, cur) => {
      const h = new Date(cur.dt * 1000).getUTCHours();
      const target = 12;
      return (Math.abs(h-target) < Math.abs(new Date(best.dt*1000).getUTCHours()-target)) ? cur : best;
    }, items[0]);

    const card = el('div','card');
    const date = new Date(pick.dt * 1000);
    const weekday = date.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'});
    const img = el('img'); img.src = iconUrl(pick.weather[0].icon); img.alt = pick.weather[0].description || '';
    const dayEl = el('div'); dayEl.textContent = weekday;
    const tempEl = el('div','temp'); tempEl.textContent = `${Math.round(pick.main.temp)}°`;
    const desc = el('div','muted'); desc.textContent = pick.weather[0].description;
    card.appendChild(dayEl);
    card.appendChild(img);
    card.appendChild(tempEl);
    card.appendChild(desc);
    container.appendChild(card);
  });
}

// ---------- Interaction ----------
async function doSearch(query, units){
  try{
    setStatus('Loading…');
    const data = Array.isArray(query) ? await getWeatherByCoords(...query, units) : await getWeatherByCity(query, units);
    renderWeather(data, units);
    setStatus(`Last updated: ${data.fetchedAt || new Date().toISOString()}`);
  } catch(err){
    setStatus(`Error: ${err.message}`, true);
    console.error(err);
  }
}

function bind(){
  const form = qs('#searchForm');
  const cityInput = qs('#cityInput');
  const geoBtn = qs('#geoBtn');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if(!city){ setStatus('Enter a city or ZIP'); return; }
    const units = qs('input[name="units"]:checked').value;
    doSearch(city, units);
  });

  geoBtn.addEventListener('click', () => {
    if(!navigator.geolocation){ setStatus('Geolocation not supported by your browser', true); return; }
    setStatus('Getting location…');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude.toFixed(4);
      const lon = pos.coords.longitude.toFixed(4);
      const units = qs('input[name="units"]:checked').value;
      await doSearch([lat,lon], units);
    }, err => {
      setStatus(`Geolocation error: ${err.message}`, true);
    }, { timeout: 10000 });
  });

  qs('#app').addEventListener('change', async (e) => {
    if(e.target.name === 'units'){
      const curLocation = qs('#locName').textContent;
      const units = qs('input[name="units"]:checked').value;
      if(curLocation && curLocation !== '—'){
        await doSearch(curLocation.split(',')[0], units);
      }
    }
  });
}

bind();
