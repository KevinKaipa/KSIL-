# Lilongwe King Sejong Institute — Student Dashboard (with backend)

A small local web app for managing students, staff, grades, and attendance.
Data is now stored on disk (`data/db.json`) instead of resetting on every
page refresh.

## What's inside

```
backend/
  server.js        — Express API + serves the dashboard itself
  package.json
  data/db.json      — your data lives here (auto-created/updated)
  public/index.html — the dashboard (talks to the API)
```

## Requirements

- [Node.js](https://nodejs.org) version 18 or newer (includes `npm`)

## Setup (one time)

Open a terminal in the `backend` folder and run:

```bash
npm install
```

This downloads two small packages (`express`, `cors`) — no database
software to install, no compiling.

## Run it

```bash
npm start
```

You'll see:

```
King Sejong Institute dashboard running at http://localhost:4000
```

Open that URL in a browser. That's it — the frontend and the API are
served from the same place, so there's nothing else to configure.

To stop the server, press `Ctrl+C` in the terminal.

## Where your data lives

Everything you add, edit, or import is saved to `backend/data/db.json`.
That file is the entire database. A few practical notes:

- **Back it up.** Since it's just a JSON file, you can copy it anywhere
  (USB stick, cloud folder, email) as a backup.
- **Don't run two copies of the server at once** pointed at the same
  `db.json` — like any simple file-based setup, simultaneous writes from
  two processes can corrupt it.
- If you ever want this on a real shared server instead of one laptop,
  the natural next step is swapping the JSON file for a proper database
  (e.g. SQLite or PostgreSQL). The API routes in `server.js` are written
  so that only the `readDb`/`writeDb` functions would need to change —
  nothing in the frontend would need to know the difference.

## Letting other staff on the same network use it

By default the server only answers on your machine (`localhost`). If you
want other computers on the same office/school Wi-Fi to reach it:

1. Find your computer's local IP address (e.g. `192.168.1.42`).
2. Have colleagues visit `http://192.168.1.42:4000` instead of `localhost`.
3. You may need to allow the port through your computer's firewall.

This is fine for a small trusted network. It is **not** set up for
hosting on the public internet (no login system, no HTTPS) — let me know
if you want that taken further.

## Troubleshooting

- **"Can't reach the server" banners in the dashboard** — the backend
  isn't running, or you opened `index.html` directly instead of visiting
  `http://localhost:4000`. Always start it with `npm start` and use the
  printed URL.
- **Port already in use** — another program is using port 4000. Run
  `PORT=4001 npm start` instead, then visit `http://localhost:4001`.
