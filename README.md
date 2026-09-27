# Atelier — AI Personal Stylist

Upload one photo → real AI style analysis → pick an occasion → 3 complete, explained outfits.

## Setup
Server:
```bash
cd server && npm install && cp .env.example .env
# add ANTHROPIC_API_KEY to .env
npm run dev
```

Client, in a second terminal:
```bash
cd client && npm install && npm run dev
```

The client proxies /api requests to the Express server. The server keeps the Anthropic key private.

## Structure
server/index.js — Express API for photo analysis and outfit generation.
client/ — React/Vite UI.

## Privacy
Photos are sent to the server and forwarded to Claude for analysis; this project does not persist uploaded images.
