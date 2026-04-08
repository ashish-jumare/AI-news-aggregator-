# Live Company News Web App

A full-stack real-time news streaming application that fetches and displays live company news with Server-Sent Events (SSE).

## 🚀 Features

- **Real-time News Updates**: SSE streaming with 60-second auto-refresh
- **7 Major Companies**: Tata, Apple, Google, Amazon, Tesla, Microsoft, Nvidia
- **90-Day Historical Filter**: Optional checkbox to show news from last 90 days
- **Sentiment Analysis**: Positive/Neutral/Negative tagging
- **Professional Reports**: Download PDF and Excel summaries with smart analysis
- **Tri-Source News System**: 
  - Primary: Google News RSS (real-time, unlimited)
  - Secondary: NewsData.io (90-day history, 200 req/day)
  - Fallback: NewsAPI.org (30-day backup, 100 req/day)
- **Modern UI**: React + TailwindCSS with dark mode support

---

## 📁 Project Structure

```
Major Project/
├── backend/
│   ├── controllers/
│   │   └── newsController.js      # SSE streaming logic
│   ├── routes/
│   │   └── news.js                # API routes
│   ├── services/
│   │   └── newsService.js         # News API & scraper
│   ├── utils/
│   │   ├── dateFilter.js          # 7-day filter
│   │   └── sentiment.js           # Sentiment analysis
│   ├── .env                       # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js                  # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Company list + filter
│   │   │   ├── LiveFeed.jsx       # News stream display
│   │   │   └── NewsCard.jsx       # Individual news article
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

---

## 🎯 How to Use

1. **Setup API Keys**: 
   - NewsAPI: Already configured ✅
   - NewsData.io: Sign up at https://newsdata.io/register and add key to `.env` (see API_KEY_LOCATION.txt)
2. **Start Backend**: Run `npm run dev` in `/backend`
3. **Start Frontend**: Run `npm run dev` in `/frontend`
4. **Open Browser**: Navigate to `http://localhost:3000`
5. **Select Company**: Click any company from sidebar
6. **View Live News**: News auto-updates every 60 seconds
7. **Enable 90-Day Filter**: Check "Show news from last 90 days" for historical data
8. **Download Reports**: Click report button to generate PDF or Excel summaries

---


## 📊 Data Flow

```
User selects company + enables 90-day filter
       ↓
Frontend opens SSE connection to backend
       ↓
Backend receives request with filterDays=90
       ↓
┌──────────────────────────────────────┐
│ SOURCE 1: Google News RSS            │
│ ✅ Fetches real-time articles (0-7d) │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ SOURCE 2: NewsData.io                │
│ ✅ Fetches historical (8-90 days)    │
│ ✅ Merges with RSS, removes dupes    │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│ SOURCE 3: NewsAPI (if needed)        │
│ ⚠️ Backup fallback only              │
└──────────────────────────────────────┘
       ↓
Apply sentiment analysis to all articles
       ↓
Sort by date (oldest → newest when filtered)
       ↓
Stream to frontend via SSE
       ↓
Auto-refresh every 60 seconds
```

---

## 🎨 UI Components

### Sidebar
- Company list with icons
- 7-day filter toggle
- Active company highlighting

### LiveFeed
- Real-time news stream
- Loading states
- Error handling
- Last update timestamp

### NewsCard
- Article title & description
- Sentiment badge with emoji
- Source & publish time
- Image (if available)
- "Read more" link

---
