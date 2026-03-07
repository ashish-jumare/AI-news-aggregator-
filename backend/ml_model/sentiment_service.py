from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import List, Optional
import os

app = FastAPI(
    title="FinBERT Sentiment Analysis Service",
    description="Financial sentiment analysis using FinBERT model",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load FinBERT model
MODEL_PATH = './finbert_model'
LABELS = ['negative', 'neutral', 'positive']

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
    
    uvicorn.run(app, host="0.0.0.0", port=5001, log_level="info")
