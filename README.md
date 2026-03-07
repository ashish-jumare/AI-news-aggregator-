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

## ⚙️ Installation & Setup

### 1️⃣ Backend Setup

```powershell
# Navigate to backend
cd "C:\Ashish\Technology\Major Project\backend"

# Install dependencies
npm install

# Configure API Keys in .env file
# Option 1: NewsAPI.org (already configured)
NEWS_API_KEY=364472e746794a89a35d221de46f214f

# Option 2: NewsData.io (NEW - for 90-day history)
# 1. Sign up at: https://newsdata.io/register
# 2. Get your free API key from dashboard
# 3. Add it to .env file:
NEWSDATA_API_KEY=your_newsdata_api_key_here

# See API_KEY_LOCATION.txt for detailed instructions

# Start backend server
npm run dev
```

**Backend runs on:** `http://localhost:5000`

---

### 2️⃣ Frontend Setup

```powershell
# Open new terminal and navigate to frontend
cd "C:\Ashish\Technology\Major Project\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on:** `http://localhost:3000`

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

## 🔧 API Endpoints

### GET `/api/news/live`

**Description:** SSE endpoint for streaming live news with tri-source system

**Query Parameters:**
- `company` (required): Company name (e.g., "Apple", "Google", "Tata")
- `filterDays` (optional): Number of days to filter (e.g., 90 for 90-day history)

**Example:**
```
http://localhost:5000/api/news/live?company=Apple&filterDays=90
```

**Data Sources Priority:**
1. Google News RSS → Real-time articles (always tried first)
2. NewsData.io → Historical articles (8-90 days, used when filter > 7)
3. NewsAPI.org → Backup fallback (used only if others fail)

---

## 🧠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **EventSource API** - SSE client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Axios** - HTTP client
- **Cheerio** - Web scraping
- **Server-Sent Events** - Real-time streaming

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

## 🔑 Environment Variables

Create `backend/.env`:

```env
PORT=5000

# NewsAPI.org - Backup fallback (100 req/day, 30-day limit)
NEWS_API_KEY=364472e746794a89a35d221de46f214f

# NewsData.io - Historical data (200 req/day, 90-day limit)
# 👇 GET YOUR FREE KEY: https://newsdata.io/register
NEWSDATA_API_KEY=your_newsdata_api_key_here
```

**Setup Instructions:**
1. NewsAPI key is already configured ✅
2. For 90-day history, sign up at: **https://newsdata.io/register**
3. Copy your API key and paste in `.env` file
4. See `API_KEY_LOCATION.txt` for detailed guide

---

## 🚀 Production Build

### Frontend
```powershell
cd frontend
npm run build
npm run preview
```

### Backend
```powershell
cd backend
npm start
```

---

## 📝 Notes

- **Tri-Source System**: Combines 3 news APIs for maximum coverage and reliability
- **API Limits**: 
  - Google RSS: Unlimited requests
  - NewsData.io: 200 requests/day (90-day history)
  - NewsAPI: 100 requests/day (30-day backup)
- **Smart Fallback**: Automatically switches sources if one fails
- **Deduplication**: Removes duplicate articles when merging sources
- **SSE**: Single connection per company selection
- **Auto-refresh**: 60-second interval (configurable in controller)
- **Reports**: PDF and Excel export with smart summaries and sentiment analysis

**📚 Additional Documentation:**
- `API_KEY_LOCATION.txt` - Where to put NewsData.io API key
- `NEWSDATA_SETUP.md` - Complete setup guide for tri-source system

---

## � Troubleshooting

**CORS Error:** Ensure backend is running on port 5000

**API Error:** Check `.env` file has valid `NEWS_API_KEY`

**SSE Not Working:** Verify proxy settings in `vite.config.js`

**No News Found:** Try different company or disable 7-day filter

---

## 👨‍💻 Developer

**Ashish**  
Major Project - Live Company News Web App

---

## 📄 License

MIT License
