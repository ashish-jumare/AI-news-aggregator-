# AI Financial Intelligence Platform

## Overview
AI Financial Intelligence Platform is a full-stack application that combines real-time news aggregation, financial sentiment analysis, portfolio management, social media intelligence, and a multimodal AI assistant.

## Core Features
- Real-time company news aggregation
- FinBERT financial sentiment analysis
- Google Gemini AI assistant
- Portfolio management and transaction tracking
- Social media intelligence and sentiment monitoring
- Persistent AI chat history
- Bookmarks and personalized dashboard
- Google OAuth and JWT authentication
- Voice-enabled AI chat
- Admin dashboard
- Feedback and contact management

---

# System Architecture

```text
Frontend (React + Vite + TailwindCSS)
                |
             REST APIs
                |
Backend (Node.js + Express.js)
                |
 ------------------------------------------------
 |            |            |          |          |
News       Gemini AI   Portfolio   Social     Auth
Engine                   Engine    Engine    System
                |
             MongoDB
                |
      ---------------------
      |                   |
  FinBERT           Gemini API
 (Python ML)
```

---

# Technology Stack

## Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Zod
- Helmet
- Express Rate Limit
- CORS

## AI & ML
- Google Gemini
- FinBERT
- Transformers
- Python

---

# Major Modules

## News Intelligence Engine
- Google News RSS aggregation
- Historical news support
- Article filtering
- Deduplication
- Real-time updates

## Sentiment Analysis Engine
- FinBERT-powered sentiment classification
- Positive / Neutral / Negative tagging
- Finance-specific NLP

## AI Assistant
- News summarization
- Financial Q&A
- Company analysis
- Image + text support
- Persistent chat history

## Portfolio Management
- Holdings tracking
- Cash balance management
- Transaction history
- Portfolio monitoring

## Social Intelligence
- Social media monitoring
- Sentiment extraction
- Trend analysis

---

# Backend Structure

```text
backend/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── ml_model/
├── tests/
└── server.js
```

# Frontend Structure

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   └── config/
```

---

# API Modules

- /api/auth
- /api/news
- /api/bookmarks
- /api/twitter
- /api/chats
- /api/gemini
- /api/portfolio
- /api/contacts
- /api/feedback
- /api/admin

---

# Security Features

- JWT Authentication
- Google OAuth
- Request Validation
- Helmet Security Headers
- Rate Limiting
- Protected Routes
- Environment Variable Protection

---

# Scalability

Current architecture can comfortably support:
- 100–300 active users

Future improvements:
- Redis caching
- Background workers
- Queue system
- Subscription management
- Real-time stock market integration

---

# Academic Contribution

This project demonstrates the integration of:

- Financial NLP
- Sentiment Analysis
- Large Language Models
- Portfolio Management
- Social Intelligence
- Full-Stack Development

into a unified AI-powered financial intelligence platform.

---

# Author

Ashish Jumare

Bachelor of Technology (Information Technology)


