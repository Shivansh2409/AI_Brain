# AI Second Brain

AI-powered knowledge base that scrapes, summarizes, and organizes web content using Gemini AI, with Chrome extension UI.

## 🏗️ Architecture

```
AI_Brain/
├── backend/          # Node.js/Express API
│   ├── server.js
│   ├── src/app.js
│   ├── src/services/ # AI (Gemini), scraper (cheerio)
│   ├── src/workers/  # BullMQ/Redis queues
│   └── src/config/   # MongoDB
└── brain-extension/  # Chrome extension popup
```

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Add GEMINI_API_KEY, MONGO_URI, REDIS_URL
npm run dev
```

### Extension

1. Load in Chrome: `chrome://extensions/` → Load unpacked → select `brain-extension/`
2. Click extension icon → save URLs

## Features

- 🔍 Scrape article title/content
- 🧠 Gemini AI: Summarize + embeddings
- 💾 Async save via queues
- 🔗 Chrome popup UI

## API

```
POST /api/save
Body: { url: string }
```

## Dependencies

- MongoDB
- Redis (BullMQ)
- Google Gemini API key

## Troubleshooting

- Server offline? Check Gemini key/Mongo/Redis.
- Scraping fails? Falls back gracefully.

## Tech Stack

- Backend: Express 5, Mongoose 9, BullMQ 5, ioredis
- AI: @google/generative-ai (gemini-1.5-flash)
- Frontend: Vanilla JS popup

Built with ❤️ for personal knowledge management.
