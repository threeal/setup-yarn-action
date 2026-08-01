# Weather Dashboard (with server-side OpenWeatherMap proxy)

This project is a small single-page weather dashboard that fetches weather data from OpenWeatherMap via a server-side proxy. The proxy keeps the OpenWeatherMap API key on the server (not exposed to the browser).

Features
- Current weather + short forecast
- Geolocation support
- Units toggle (metric/imperial)
- Server-side proxy with a small in-memory cache (10 minutes)
- Static frontend served from /public

Requirements
- Node.js 18+ (uses global fetch)
- An OpenWeatherMap API key (sign up at https://openweathermap.org/)

Quick start (local)
1. Copy `.env.example` to `.env` and fill in OWM_API_KEY:
   - cp .env.example .env
   - edit .env and set OWM_API_KEY

2. Install dependencies:
   - npm install

3. Run in development:
   - npm run dev
   - Open http://localhost:3000 in your browser

Production
- Use a proper process manager (pm2, systemd) or deploy to a platform (Vercel, Render, Heroku). Ensure the OWM_API_KEY is set in your environment variables on the host.

Security
- Do NOT commit .env or API keys. .env is included in .gitignore.
- For heavier traffic, replace the in-memory cache with Redis or another durable cache.

Extending
- Add rate limiting / auth to the proxy if you plan to make the endpoint public.
- Replace in-memory cache with Redis for scaling.
- Add geocoding/autocomplete using OpenWeatherMap's Geocoding API.

License: MIT
