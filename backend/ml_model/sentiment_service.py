from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import List, Optional
import re
import os
import yfinance as yf
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo

app = FastAPI(
    title="FinBERT Sentiment Analysis Service",
    description="Financial sentiment analysis using FinBERT model",
    version="1.0.0"
)

# Enable CORS
allowed_origins_env = os.getenv("ANALYSIS_ALLOWED_ORIGINS") or os.getenv("FRONTEND_URL") or ""
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load FinBERT model
MODEL_PATH = './finbert_model'
LABELS = ['negative', 'neutral', 'positive']

SYMBOL_CACHE = {}
INTRADAY_CACHE = {}
INTRADAY_CACHE_TTL_SECONDS = 60
def normalize_company_name(name: str) -> str:
    normalized = name.strip().lower()
    normalized = normalized.replace('&', 'and')
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.strip()

RAW_SYMBOL_OVERRIDES = {
    'tata steel ltd': 'TATASTEEL.NS',
    'tata steel': 'TATASTEEL.NS',
    'adani energy solutions ltd': 'ADANIENSOL.NS',
    'adani energy solution ltd': 'ADANIENSOL.NS',
    'abb india ltd': 'ABB.NS',
    'abb india': 'ABB.NS',
    'adani ports and special economic zone ltd': 'ADANIPORTS.NS',
    'apollo hospitals enterprise ltd': 'APOLLOHOSP.NS',
    'avenue supermarts ltd': 'DMART.NS',
    'bajaj finance ltd': 'BAJFINANCE.NS',
    'bajaj holdings and investment ltd': 'BAJAJHLDNG.NS',
    'bharat petroleum corporation ltd': 'BPCL.NS',
    'cg power and industrial solutions ltd': 'CGPOWER.NS',
    'cg power and industrial solution ltd': 'CGPOWER.NS',
    'cholamandalam investment and finance company ltd': 'CHOLAFIN.NS',
    'cholamandalam investment and finance company ltd eternal ltd': 'CHOLAFIN.NS',
    'eternal ltd': 'ZOMATO.NS',
    'hdfc life insurance company ltd': 'HDFCLIFE.NS',
    'icici lombard general insurance company ltd': 'ICICIGI.NS',
    'indian railway finance corporation ltd': 'IRFC.NS',
    'infosys ltd': 'INFY.NS',
    'jindal steel ltd': 'JINDALSTEL.NS',
    'jio financial services ltd': 'JIOFIN.NS',
    'ltimindtree ltd': 'LTIM.NS',
    'lodha developers ltd': 'LODHA.NS',
    'latha developers ltd': 'LODHA.NS',
    'max healthcare institute ltd': 'MAXHEALTH.NS',
    'mazagon dock shipbuilders ltd': 'MAZDOCK.NS',
    'mazagaon dock shipbuilders ltd': 'MAZDOCK.NS',
    'oil and natural gas corporation ltd': 'ONGC.NS',
    'power grid corporation of india ltd': 'POWERGRID.NS',
    'rec ltd': 'RECLTD.NS',
    'rec limited': 'RECLTD.NS',
    'sbi life insurance company ltd': 'SBILIFE.NS',
    'samvardhana motherson international ltd': 'MOTHERSON.NS',
    'shriram finance ltd': 'SHRIRAMFIN.NS',
    'sun pharmaceutical industries ltd': 'SUNPHARMA.NS',
    'tata consumer products ltd': 'TATACONSUM.NS',
    'tata motors passenger vehicles ltd': 'TATAMOTORS.NS',
    'titan company ltd': 'TITAN.NS',
    'dr reddy s laboratories ltd': 'DRREDDY.NS',
    'dr reddys laboratories ltd': 'DRREDDY.NS',
    'dr reddy laboratories ltd': 'DRREDDY.NS',
    'varun beverages ltd': 'VBL.NS',
    'vedanta ltd': 'VEDL.NS'
}
SYMBOL_OVERRIDES = {
    normalize_company_name(key): value for key, value in RAW_SYMBOL_OVERRIDES.items()
}

def choose_symbol(quotes):
    if not quotes:
        return None

    def is_equity(quote):
        return (quote.get('quoteType') or '').upper() == 'EQUITY'

    def exchange_match(quote, exchanges):
        return (quote.get('exchange') or '').upper() in exchanges

    equities = [quote for quote in quotes if is_equity(quote)]
    candidates = equities or quotes

    preferred = next((q.get('symbol') for q in candidates if exchange_match(q, {'NSE', 'NSI'})), None)
    if preferred:
        return preferred

    preferred = next((q.get('symbol') for q in candidates if q.get('symbol', '').endswith('.NS')), None)
    if preferred:
        return preferred

    preferred = next((q.get('symbol') for q in candidates if exchange_match(q, {'BSE'})), None)
    if preferred:
        return preferred

    preferred = next((q.get('symbol') for q in candidates if q.get('symbol', '').endswith('.BO')), None)
    if preferred:
        return preferred

    return candidates[0].get('symbol') if candidates else None

def resolve_symbol(company_name: str, symbol: Optional[str] = None) -> Optional[str]:
    if symbol:
        return symbol

    if not company_name:
        return None

    normalized_name = normalize_company_name(company_name)
    override = SYMBOL_OVERRIDES.get(normalized_name)
    if override:
        return override

    cache_key = normalized_name
    if cache_key in SYMBOL_CACHE:
        return SYMBOL_CACHE[cache_key]

    try:
        search = yf.Search(company_name)
        quotes = search.quotes or []
        resolved = choose_symbol(quotes)

        if resolved and (resolved.endswith('.NS') or resolved.endswith('.BO')):
            SYMBOL_CACHE[cache_key] = resolved
            return resolved

        search_nse = yf.Search(f"{company_name} NSE")
        resolved_nse = choose_symbol(search_nse.quotes or [])
        resolved = resolved_nse or resolved

        if not resolved:
            search_bse = yf.Search(f"{company_name} BSE")
            resolved = choose_symbol(search_bse.quotes or [])

        if resolved and (resolved.endswith('.NS') or resolved.endswith('.BO')):
            SYMBOL_CACHE[cache_key] = resolved
            return resolved
        if resolved:
            SYMBOL_CACHE[cache_key] = resolved
        return resolved
    except Exception:
        return None

def serialize_history(dataframe):
    if dataframe is None or dataframe.empty:
        return []

    df = dataframe.reset_index()
    time_key = 'Datetime' if 'Datetime' in df.columns else 'Date'
    rows = []

    for _, row in df.iterrows():
        timestamp = row[time_key]
        if isinstance(timestamp, datetime):
            timestamp = timestamp.isoformat()

        rows.append({
            'time': timestamp,
            'open': float(row['Open']) if row['Open'] == row['Open'] else None,
            'high': float(row['High']) if row['High'] == row['High'] else None,
            'low': float(row['Low']) if row['Low'] == row['Low'] else None,
            'close': float(row['Close']) if row['Close'] == row['Close'] else None,
            'volume': float(row['Volume']) if row['Volume'] == row['Volume'] else None
        })

    return rows

def filter_market_hours(history_df, exchange_tz: str = 'Asia/Kolkata'):
    if history_df is None or history_df.empty:
        return history_df

    tz = ZoneInfo(exchange_tz)
    index = history_df.index
    if index.tz is None:
        localized = history_df.tz_localize(tz)
    else:
        localized = history_df.tz_convert(tz)

    market_open = time(9, 15)
    market_close = time(15, 30)
    mask = localized.index.map(lambda ts: market_open <= ts.timetz().replace(tzinfo=None) <= market_close)
    return localized.loc[mask]

def is_market_open_now(exchange_tz: str = 'Asia/Kolkata') -> bool:
    tz = ZoneInfo(exchange_tz)
    now = datetime.now(tz)
    if now.weekday() >= 5:
        return False
    market_open = time(9, 15)
    market_close = time(15, 30)
    return market_open <= now.timetz().replace(tzinfo=None) <= market_close

def get_intraday_history(ticker, interval: str = '1m'):
    cache_key = f"{ticker.ticker}:{interval}"
    cached = INTRADAY_CACHE.get(cache_key)
    now = datetime.utcnow()
    if cached and (now - cached['fetched_at']) < timedelta(seconds=INTRADAY_CACHE_TTL_SECONDS):
        return cached['data']

    history_df = ticker.history(period='1d', interval=interval, auto_adjust=False)
    history_df = filter_market_hours(history_df)
    INTRADAY_CACHE[cache_key] = {'data': history_df, 'fetched_at': now}
    return history_df

print(" Loading FinBERT model...")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    model.eval()
    print(" FinBERT model loaded successfully!")
    model_loaded = True
except Exception as e:
    print(f" Error loading model: {e}")
    print(f" Make sure FinBERT model files exist in: {MODEL_PATH}")
    tokenizer = None
    model = None
    model_loaded = False

# Request/Response models
class SentimentRequest(BaseModel):
    text: str

class BatchSentimentRequest(BaseModel):
    texts: List[str]

class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    scores: dict

class BatchSentimentResponse(BaseModel):
    results: List[SentimentResponse]

class HealthResponse(BaseModel):
    status: str
    ml_model_loaded: bool

class CompanyAnalysisResponse(BaseModel):
    symbol: str
    name: str
    currency: Optional[str]
    price: Optional[float]
    change: Optional[float]
    changePercent: Optional[float]
    range: str
    ohlc: dict
    volume: Optional[float]
    avgVolume: Optional[float]
    fundamentals: dict
    history: List[dict]
    indicators: Optional[dict] = None

def compute_sma(values: List[float], period: int) -> Optional[float]:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period

def compute_ema(values: List[float], period: int) -> Optional[float]:
    if len(values) < period:
        return None
    k = 2 / (period + 1)
    ema = sum(values[:period]) / period
    for value in values[period:]:
        ema = (value - ema) * k + ema
    return ema

def compute_rsi(values: List[float], period: int = 14) -> Optional[float]:
    if len(values) <= period:
        return None

    gains = []
    losses = []
    for i in range(1, period + 1):
        delta = values[i] - values[i - 1]
        gains.append(max(delta, 0))
        losses.append(abs(min(delta, 0)))

    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period

    for i in range(period + 1, len(values)):
        delta = values[i] - values[i - 1]
        gain = max(delta, 0)
        loss = abs(min(delta, 0))
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def compute_macd(values: List[float]) -> Optional[dict]:
    if len(values) < 35:
        return None
    ema_12 = compute_ema(values, 12)
    ema_26 = compute_ema(values, 26)
    if ema_12 is None or ema_26 is None:
        return None
    macd_line = ema_12 - ema_26

    macd_series = []
    ema_short = sum(values[:12]) / 12
    ema_long = sum(values[:26]) / 26
    k_short = 2 / (12 + 1)
    k_long = 2 / (26 + 1)
    for value in values[26:]:
        ema_short = (value - ema_short) * k_short + ema_short
        ema_long = (value - ema_long) * k_long + ema_long
        macd_series.append(ema_short - ema_long)

    signal = compute_ema(macd_series, 9)
    if signal is None:
        return None
    histogram = macd_line - signal
    return {
        'macd': macd_line,
        'signal': signal,
        'histogram': histogram
    }

def safe_float(value) -> Optional[float]:
    try:
        if value is None:
            return None
        if value != value:
            return None
        return float(value)
    except Exception:
        return None

def compute_ohlc_from_history(history_df) -> dict:
    if history_df is None or history_df.empty:
        return {
            'open': None,
            'high': None,
            'low': None,
            'close': None,
            'volume': None
        }

    open_series = history_df['Open'].dropna()
    high_series = history_df['High'].dropna()
    low_series = history_df['Low'].dropna()
    close_series = history_df['Close'].dropna()
    volume_series = history_df['Volume'].dropna()

    return {
        'open': safe_float(open_series.iloc[0]) if len(open_series) else None,
        'high': safe_float(high_series.max()) if len(high_series) else None,
        'low': safe_float(low_series.min()) if len(low_series) else None,
        'close': safe_float(close_series.iloc[-1]) if len(close_series) else None,
        'volume': safe_float(volume_series.sum()) if len(volume_series) else None
    }

def compute_volume_stats(daily_df, window: int = 20) -> dict:
    if daily_df is None or daily_df.empty:
        return {'volume': None, 'avgVolume': None}

    volume_series = daily_df['Volume'].dropna()
    latest_volume = safe_float(volume_series.iloc[-1]) if len(volume_series) else None
    avg_volume = safe_float(volume_series.tail(window).mean()) if len(volume_series) else None

    return {'volume': latest_volume, 'avgVolume': avg_volume}

def choose_market_cap(reported_cap: Optional[float], calculated_cap: Optional[float]) -> Optional[float]:
    if calculated_cap is None:
        return reported_cap
    if reported_cap is None:
        return calculated_cap

    if calculated_cap == 0:
        return reported_cap

    ratio = reported_cap / calculated_cap
    if ratio < 0.2 or ratio > 5:
        return calculated_cap

    return reported_cap

@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "service": "FinBERT Sentiment Analysis",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model_loaded
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model_loaded else "unhealthy",
        "ml_model_loaded": model_loaded
    }

@app.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of a single text
    
    Args:
        request: SentimentRequest with text field
    
    Returns:
        SentimentResponse with sentiment, confidence, and scores
    """
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Tokenize input
        inputs = tokenizer(  # type: ignore
            request.text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        )
        
        # Get predictions
        with torch.no_grad():
            outputs = model(**inputs)  # type: ignore
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Extract results
        scores_list = predictions[0].tolist()
        predicted_class = int(torch.argmax(predictions, dim=1).item())
        
        sentiment_scores = {
            'negative': round(scores_list[0], 4),
            'neutral': round(scores_list[1], 4),
            'positive': round(scores_list[2], 4)
        }
        
        return {
            "sentiment": LABELS[predicted_class],
            "confidence": round(scores_list[predicted_class], 4),
            "scores": sentiment_scores
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.post("/analyze-batch", response_model=BatchSentimentResponse)
async def analyze_batch(request: BatchSentimentRequest):
    """
    Analyze sentiment for multiple texts
    
    Args:
        request: BatchSentimentRequest with texts list
    
    Returns:
        BatchSentimentResponse with list of results
    """
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not request.texts or len(request.texts) == 0:
        raise HTTPException(status_code=400, detail="Texts list cannot be empty")
    
    if len(request.texts) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 texts per batch")
    
    try:
        results = []
        
        for text in request.texts:
            if not text or len(text.strip()) == 0:
                results.append({
                    "sentiment": "neutral",
                    "confidence": 0.0,
                    "scores": {"negative": 0.0, "neutral": 1.0, "positive": 0.0}
                })
                continue
            
            # Tokenize
            if tokenizer is not None and model is not None:
                inputs = tokenizer(
                    text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=512,
                    padding=True
                )
            
                # Predict
                with torch.no_grad():
                    outputs = model(**inputs)
                    predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
                
                scores_list = predictions[0].tolist()
                predicted_class = int(torch.argmax(predictions, dim=1).item())
                
                results.append({
                    "sentiment": LABELS[predicted_class],
                    "confidence": round(scores_list[predicted_class], 4),
                    "scores": {
                        "negative": round(scores_list[0], 4),
                        "neutral": round(scores_list[1], 4),
                        "positive": round(scores_list[2], 4)
                    }
                })
        
        return {"results": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis error: {str(e)}")

@app.get("/analysis/company", response_model=CompanyAnalysisResponse)
async def get_company_analysis(name: str, symbol: Optional[str] = None, range: str = "1d"):
    resolved_symbol = resolve_symbol(name, symbol)
    if not resolved_symbol:
        raise HTTPException(status_code=404, detail="Unable to resolve company symbol")

    try:
        ticker = yf.Ticker(resolved_symbol)
        info = ticker.info or {}
        fast_info = getattr(ticker, 'fast_info', {}) or {}

        range_key = (range or "1d").lower()
        range_map = {
            "1d": {"period": "1d", "interval": "1m"},
            "5d": {"period": "5d", "interval": "30m"},
            "1m": {"period": "1mo", "interval": "1h"},
            "6m": {"period": "6mo", "interval": "1d"},
            "ytd": {"period": "ytd", "interval": "1d"},
            "1y": {"period": "1y", "interval": "1d"},
            "5y": {"period": "5y", "interval": "1wk"},
            "max": {"period": "max", "interval": "1mo"}
        }
        range_settings = range_map.get(range_key, range_map["1d"])

        if range_key == "1d":
            history_df = get_intraday_history(ticker, range_settings["interval"])
        else:
            history_df = ticker.history(
                period=range_settings["period"],
                interval=range_settings["interval"],
                auto_adjust=False
            )

        daily_df = ticker.history(period="1mo", interval="1d", auto_adjust=False)
        year_df = ticker.history(period="1y", interval="1d", auto_adjust=False)

        latest_row = None
        prev_row = None
        if history_df is not None and not history_df.empty:
            latest_row = history_df.iloc[-1]
            if len(history_df) > 1:
                prev_row = history_df.iloc[-2]

        if range_key == "1d":
            ohlc = compute_ohlc_from_history(history_df)
        else:
            ohlc = {
                'open': safe_float(latest_row['Open']) if latest_row is not None else None,
                'high': safe_float(latest_row['High']) if latest_row is not None else None,
                'low': safe_float(latest_row['Low']) if latest_row is not None else None,
                'close': safe_float(latest_row['Close']) if latest_row is not None else None,
                'volume': safe_float(latest_row['Volume']) if latest_row is not None else None
            }

        fast_price = fast_info.get('last_price') or fast_info.get('lastPrice')
        fast_prev_close = fast_info.get('previous_close') or fast_info.get('previousClose')
        prev_close_fallback = fast_prev_close or info.get('previousClose')

        if is_market_open_now():
            price = fast_price or info.get('regularMarketPrice') or ohlc['close']
        else:
            price = ohlc['close'] or prev_close_fallback
        change = None
        change_percent = None
        prev_close = None
        if prev_close_fallback is not None:
            prev_close = float(prev_close_fallback)
        elif prev_row is not None:
            prev_close = float(prev_row['Close']) if prev_row is not None else None

        if price is not None and prev_close is not None and prev_close != 0:
            change = price - prev_close
            change_percent = (change / prev_close) * 100

        volume_stats = compute_volume_stats(daily_df, 20)
        year_high = None
        year_low = None
        if year_df is not None and not year_df.empty:
            year_high = safe_float(year_df['High'].dropna().max())
            year_low = safe_float(year_df['Low'].dropna().min())

        reported_market_cap = safe_float(info.get('marketCap'))
        shares_outstanding = safe_float(info.get('sharesOutstanding') or fast_info.get('shares'))
        calculated_market_cap = None
        if price is not None and shares_outstanding is not None:
            calculated_market_cap = price * shares_outstanding

        fundamentals = {
            'marketCap': choose_market_cap(reported_market_cap, calculated_market_cap),
            'peRatio': info.get('trailingPE'),
            'eps': info.get('trailingEps'),
            'dividendYield': info.get('dividendYield'),
            'beta': info.get('beta'),
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh') or year_high,
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow') or year_low
        }

        indicators = None
        indicator_df = ticker.history(period="6mo", interval="1d", auto_adjust=False)
        closes = indicator_df['Close'].dropna().tolist() if indicator_df is not None and not indicator_df.empty else []
        if closes:
            macd_values = compute_macd(closes)
            indicators = {
                'rsi': compute_rsi(closes, 14),
                'macd': macd_values,
                'sma20': compute_sma(closes, 20),
                'sma50': compute_sma(closes, 50),
                'ema20': compute_ema(closes, 20),
                'ema50': compute_ema(closes, 50)
            }

        return {
            'symbol': resolved_symbol,
            'name': info.get('shortName') or name,
            'currency': info.get('currency') or fast_info.get('currency'),
            'price': price,
            'change': change if change is not None else info.get('regularMarketChange'),
            'changePercent': change_percent if change_percent is not None else info.get('regularMarketChangePercent'),
            'range': range_key,
            'ohlc': ohlc,
            'volume': volume_stats['volume'] or info.get('regularMarketVolume') or ohlc['volume'],
            'avgVolume': volume_stats['avgVolume'] or info.get('averageVolume'),
            'fundamentals': fundamentals,
            'history': serialize_history(history_df),
            'indicators': indicators
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yahoo Finance error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print(" FinBERT Sentiment Analysis Service (FastAPI)")
    print("="*60)
    print(" Server: http://localhost:5001")
    print(" Docs: http://localhost:5001/docs")
    print(" Health: http://localhost:5001/health")
    print(" Analyze: POST http://localhost:5001/analyze")
    print(" Batch: POST http://localhost:5001/analyze-batch")
    print("="*60 + "\n")
    
    port = int(os.environ.get("PORT", 5001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
