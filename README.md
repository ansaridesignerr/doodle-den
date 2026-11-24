# Doodle Den

Private multiplayer drawing and guessing game. Node.js + Express + Socket.IO server (server-authoritative), single-page client in `public/index.html`.
No database, no paid services, no accounts. Rooms live in server memory.

## Run locally
    npm install
    npm start
Open http://localhost:3000 in two browser tabs. To play from phones on the same Wi-Fi, open http://YOUR-PC-IP:3000.

## Deploy (free tiers)
The app needs a host that keeps a Node process running (WebSockets). Vercel/Netlify serverless will NOT work.

**Render (easiest):** push this folder to GitHub -> render.com -> New -> Web Service -> pick the repo ->
Build command `npm install`, Start command `npm start` -> Create. Share the https URL.
**Railway / Fly.io / any VPS:** same commands; the app reads the `PORT` environment variable.

Notes: free instances sleep when idle (first load can take ~30s) and restart clears all rooms.
Run a single instance only (rooms are stored in memory).

## Files
- `server.js` - rooms, game logic, scoring, timers, word list (300+ words)
- `public/index.html` - UI, canvas drawing, mobile + desktop layouts
- `TESTING_GUIDE.md`, `BUG_REPORT.md` - QA checklist and bug template

## Known limits
No database/accounts, no sound effects or confetti, no fill/line tools, no in-lobby settings editing,
no simulated test players in this build (they exist in the online demo page only).
