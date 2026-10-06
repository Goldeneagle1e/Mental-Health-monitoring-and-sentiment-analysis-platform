# ml-server/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import time
import io
import re
import requests
from PIL import Image
import numpy as np
from transformers import pipeline

# --- 1. Load Pre-trained ML Model (Text) ---
# We are using a pre-trained general text classifier (which we will map to risk)
# A more specific mental health model would be better, but this provides a workable baseline.
try:
    print("Loading English text classification model (distilbert-base-uncased-finetuned-sst-2-english)...")
    text_classifier = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english"
    )
    print("Text model loaded successfully.")
except Exception as e:
    print(f"Error loading text model: {e}")
    text_classifier = None

# --- 2. Load Pre-trained Image Model (Torch-backed Transformers) ---
image_model = None

try:
    print("Loading pretrained image classification model (google/vit-base-patch16-224)...")
    image_model = pipeline("image-classification", model="google/vit-base-patch16-224")
    print("Image model loaded successfully.")
except Exception as e:
    print(f"Error loading image model: {e}")
    image_model = None

# --- Utility helpers for media analysis ---

def download_image(url: str) -> Image.Image:
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content))


def classify_image(image: Image.Image):
    if image_model is None:
        return []

    if image.mode != "RGB":
        image = image.convert("RGB")

    predictions = image_model(image, top_k=3)
    return [
        (pred.get("score", 0.0), pred.get("label", "unknown"))
        for pred in predictions
    ]


def map_predictions_to_risk(predictions):
    labels = [label for (_, label) in predictions]
    scores = [score for (score, label) in predictions]

    text_labels = ", ".join(labels)
    risk_score = int(np.clip(np.mean(scores) * 70 + 30, 30, 90))
    if any(keyword in label.lower() for label in labels for keyword in ["knife", "gun", "syringe", "ambulance", "hospital", "mask", "blood", "fire", "war", "storm", "tornado", "shark", "snake"]):
        risk_score = max(risk_score, 85)
    elif any(keyword in label.lower() for label in labels for keyword in ["person", "face", "group", "hand"]):
        risk_score = max(risk_score, 55)

    overall_risk = "low"
    if risk_score > 75:
        overall_risk = "high"
    elif risk_score > 45:
        overall_risk = "moderate"

    indicators = [f"visual_label:{label}" for (_, label) in predictions]
    if "person" in text_labels.lower() or "face" in text_labels.lower():
        indicators.append("human_subject_detected")

    return {
        "anxiety": risk_score,
        "depression": risk_score,
        "stress": risk_score,
        "overall_risk": overall_risk,
        "indicators": indicators,
        "recommendations": [
            "Review image context for emotional cues and scene content.",
            "If the visual content feels distressing, consider talking with a professional.",
            "Limit exposure to visual content that increases anxiety or stress."
        ]
    }


def analyze_visual_image(image: Image.Image):
    try:
        predictions = classify_image(image)
        if not predictions:
            return {
                "anxiety": 55,
                "depression": 55,
                "stress": 55,
                "overall_risk": "moderate",
                "indicators": ["visual_analysis_fallback"],
                "recommendations": [
                    "Visual analysis fallback used because the pretrained image model did not load.",
                    "Ensure the Python environment has torch, transformers, and pillow installed."
                ]
            }

        return map_predictions_to_risk(predictions)
    except Exception as exc:
        print(f"Image analysis error: {exc}")
        return {
            "anxiety": 60,
            "depression": 60,
            "stress": 60,
            "overall_risk": "moderate",
            "indicators": ["image_model_exception"],
            "recommendations": [
                "Could not analyze the image with the model. Try a different image or check server logs."
            ]
        }

# --- Critical Keyword Detector ---
HIGH_RISK_KEYWORDS = [
    "die",
    "kill myself",
    "suicide",
    "end my life",
    "hopeless",
    "can't go on",
    "cant go on",
    "no reason to live",
    "tired of living",
    "want to die",
    "wish I was dead",
    "die alone",
    "die in my sleep",
    "die tonight",
    "die tomorrow",
    "die soon",
    "die now",
    "die today",
    "death",
    "dead",
    "ending it all",
    "final goodbye",
    "last time",
    "final time",
    "final moment",
    "final moments",
    "final farewell",
    "take my life",
    "take my own life",
    "hanging myself",
    "hang myself",
    "overdose",
    "take pills",
    "jump off",
    "jump from",
    "throw myself",
    "hurt myself",
    "cut myself",
    "bleed out",
    "bleeding out",
    "burn myself",
    "end it all",
    "finish it all",
    "can't keep going",
    "can’t keep going",
    "no point anymore",
    "nothing matters",
    "give up on life",
    "give up on myself",
    "worthless",
    "useless",
    "broken beyond repair",
    "better off dead",
    "don't want to live",
    "don't want to be alive",
    "don't want to exist",
    "ready to die",
    "ready to end it",
    "my life isn't worth living",
    "there is no way out",
    "there is no point",
    "worthless human",
    "sorry for being born",
    "wish I never existed",
    "wish I was never born",
    "fatal", 
    "suicidal",
    "suicide note",
    "suicide plan",
    "suicide attempt",
    "suicidal intent",
    "suicidal urges",
    "suicidal thoughts",
    "suicidal feelings",
    "self harm",
    "self-harm",
    "self harm idea",
    "self harm intention",
    "harm myself",
    "self-destruct",
    "hurt myself on purpose"
]
MODERATE_RISK_KEYWORDS = [
    "depressed",
    "anxious",
    "worried",
    "stressed",
    "sad",
    "alone",
    "tired of",
    "disturbing",
    "feelings",
    "feeling",
    "numb",
    "overwhelmed",
    "isolated",
    "lonely",
    "hurt",
    "empty",
    "hopelessness",
    "lost",
    "broken",
    "worthless",
    "guilty",
    "shame",
    "regret",
    "disconnected",
    "trapped",
    "suffocating",
    "drowning",
    "disturbed",
    "unbearable",
    "overwhelming",
    "unmanageable",
    "crushing",
    "devastating",
    "heartbreaking",
    "soul-crushing",
    "mind-numbing",
    "emotionally exhausting",
    "empty inside",
    "lost cause",
    "burned out",
    "drained",
    "fed up",
    "shattered",
    "broken inside",
    "no energy",
    "no motivation",
    "can't handle",
    "can't cope",
    "can't breathe",
    "panic",
    "panic attack",
    "terrified",
    "fearful",
    "afraid",
    "insecure",
    "overthink",
    "ruminating",
    "worried sick",
    "stressed out",
    "doomed",
    "helpless",
    "powerless",
    "unsafe",
    "threatened",
    "exhausted",
    "uneasy",
    "broken dreams",
    "alone in this",
    "not understood",
    "not heard",
    "no one cares",
    "no one understands",
    "just a burden",
    "a burden",
    "invisible",
    "stuck",
    "captive",
    "worthless feelings",
    "shattered hopes",
    "body hurts",
    "shaky",
    "trembling",
    "panic mode"
]
MILD_RISK_KEYWORDS = [
    "tired", "sleepy", "unmotivated", "down", "blue", "off",
    "not okay", "not good", "not fine"
]

def analyze_text_with_ml(content: str):
    """
    Uses the loaded model and keyword detection to calculate a risk score.
    """
    content_lower = content.lower()
    risk_score = 0
    indicators = []

    # --- 1. Keyword Overlap Detection (Highest Priority) ---
    # This bypasses the ML model entirely for critical, known phrases.
    for keyword in HIGH_RISK_KEYWORDS:
        if keyword in content_lower:
            risk_score = 95
            indicators.append("critical_suicide_ideation_keyword")
            break

    if risk_score > 0:
        classification = "High"
        return {
            "risk_score": risk_score,
            "indicators": indicators,
            "classification": classification
        }

    # --- 2. Moderate Keyword Detection ---
    moderate_matches = [keyword for keyword in MODERATE_RISK_KEYWORDS if keyword in content_lower]
    if moderate_matches:
        risk_score = max(risk_score, 70)
        indicators.append(f"moderate_concern_keyword: {moderate_matches[0]}")

        unique_moderate = len(set(moderate_matches))
        if unique_moderate > 1:
            if unique_moderate >= 4:
                risk_score = max(risk_score, 90)
            elif unique_moderate == 3:
                risk_score = max(risk_score, 85)
            else:
                risk_score = max(risk_score, 80)
            indicators.append(f"multiple_moderate_keywords:{unique_moderate}")

    # --- 2.b Sentence-level moderate keyword clustering ---
    if risk_score >= 70:
        sentences = [sentence.strip() for sentence in re.split(r"[.!?]", content_lower) if sentence.strip()]
        for sentence in sentences:
            sentence_matches = [kw for kw in MODERATE_RISK_KEYWORDS if kw in sentence]
            if len(set(sentence_matches)) >= 2:
                risk_score = max(risk_score, 85)
                indicators.append("moderate_keyword_cluster")
                break

    # --- 3. Mild Keyword Detection ---
    if risk_score == 0:
        for keyword in MILD_RISK_KEYWORDS:
            if keyword in content_lower:
                risk_score = max(risk_score, 50)
                indicators.append(f"mild_concern_keyword: {keyword}")
                break

    # --- 3. Run ML Prediction (for general negative/positive score) ---
    if text_classifier:
        # Output: [{'label': 'Negative'/'Positive', 'score': 0.999}]
        results = text_classifier(content)[0]
        ml_score = results['score']
        label = results['label']

        if label == 'Negative':
            # Map negative ML score to risk (up to 80)
            ml_risk = int(ml_score * 80)
            risk_score = max(risk_score, ml_risk) # Use the higher score
            indicators.append("negative_sentiment_detected")
        else:
            # Positive sentiment lowers risk, but not below keyword-set floor
            ml_risk = 100 - int(ml_score * 50)
            risk_score = max(risk_score, ml_risk) # Use the higher of the current or ML score

    # --- 4. Final Classification ---
    if risk_score > 85:
        classification = "High"
    elif risk_score > 55:
        classification = "Moderate"
    else:
        classification = "Low"

    # Ensure minimal risk if no indicators are found
    if not indicators:
        indicators.append("general_wellbeing")
        classification = "Minimal"
        risk_score = 5

    return {
        "risk_score": risk_score,
        "indicators": list(set(indicators)), # Remove duplicates
        "classification": classification
    }

# --- 2. Define Request Body Structure (Unchanged) ---
class TextAnalysisRequest(BaseModel):
    content: str
    source: str = "manual"

# --- 3. Initialize FastAPI App (Unchanged) ---
app = FastAPI(title="Mental Health ML API")
print("ML API ready to serve at http://0.0.0.0:8000")


# --- 4. Define Prediction Endpoint (Text - Unchanged) ---
@app.post("/api/ml/analyze/text")
def analyze_text(request: TextAnalysisRequest):
    print(f"--> Received text analysis request from {request.source}. Content: '{request.content[:50]}...'")
    try:
        # Get the core results from the ML function
        core_results = analyze_text_with_ml(request.content)
        
        # --- CRITICAL FIX: Format the final output to match the frontend schema ---
        # The overall risk score is used for all three metrics until separate models are implemented.
        final_response = {
            "anxiety": core_results["risk_score"],
            "depression": core_results["risk_score"],
            "stress": core_results["risk_score"],
            # Frontend expects 'low', 'moderate', or 'high' in lowercase
            "overall_risk": core_results["classification"].lower(), 
            "indicators": core_results["indicators"],
            # Simple, but appropriate recommendations based on the overall classification
            "recommendations": [
                "Practice mindfulness and breathing exercises.",
                "Connect with a trusted friend or family member for support." if core_results["classification"] in ["Moderate", "High"] else "Maintain positive connections with others.",
                # This ensures a high-risk text (e.g., "I want to die") triggers this critical recommendation
                "Seek immediate professional help." if core_results["classification"] == "High" else "Monitor your mood and behavior."
            ]
        }
        
        print(f"<-- Results: {final_response}")
        return final_response
    except Exception as e:
        print(f"ML Analysis failed: {e}")
        # The frontend will now receive a proper JSON error response
        raise HTTPException(status_code=500, detail=f"ML Analysis failed: {e}")
# --- 5. Define Image Analysis Endpoint ---
@app.post("/api/ml/analyze/image")
def analyze_image(request: dict):
    image_url = request.get("imageUrl")
    if not image_url or not isinstance(image_url, str):
        raise HTTPException(status_code=400, detail="imageUrl is required")

    time.sleep(0.75)
    try:
        image = download_image(image_url)
        return analyze_visual_image(image)
    except Exception as exc:
        print(f"Image analysis failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {exc}")


# --- 6. Define GIF Analysis Endpoint ---
@app.post("/api/ml/analyze/gif")
def analyze_gif(request: dict):
    gif_url = request.get("gifUrl")
    if not gif_url or not isinstance(gif_url, str):
        raise HTTPException(status_code=400, detail="gifUrl is required")

    frame_count = int(request.get("frameCount", 5))
    if frame_count < 1:
        frame_count = 5

    time.sleep(0.75)
    try:
        image = download_image(gif_url)
        if getattr(image, "is_animated", False):
            frames = min(frame_count, getattr(image, "n_frames", 1))
            aggregated = {"anxiety": 0.0, "depression": 0.0, "stress": 0.0}
            all_indicators = []
            frame_analysis_list = []

            for frame_index in range(frames):
                image.seek(frame_index)
                frame_analysis = analyze_visual_image(image.convert("RGB"))
                aggregated["anxiety"] += frame_analysis["anxiety"]
                aggregated["depression"] += frame_analysis["depression"]
                aggregated["stress"] += frame_analysis["stress"]
                all_indicators.extend(frame_analysis["indicators"])
                frame_analysis_list.append({
                    "frameNumber": frame_index + 1,
                    "score": frame_analysis["anxiety"],
                })

            averaged_anxiety = aggregated["anxiety"] / frames
            averaged_depression = aggregated["depression"] / frames
            averaged_stress = aggregated["stress"] / frames
            overall_risk = "low"
            max_score = max(averaged_anxiety, averaged_depression, averaged_stress)
            if max_score > 75:
                overall_risk = "high"
            elif max_score > 45:
                overall_risk = "moderate"

            return {
                "frames": frames,
                "anxiety": averaged_anxiety,
                "depression": averaged_depression,
                "stress": averaged_stress,
                "overall_risk": overall_risk,
                "indicators": list(set(all_indicators)),
                "recommendations": [
                    "Review the GIF frame-by-frame for changing visual signals.",
                    "If motion triggers stress, consider reducing exposure to moving content."
                ],
                "frameAnalysis": frame_analysis_list
            }
        else:
            return analyze_visual_image(image)
    except Exception as exc:
        print(f"GIF analysis failed: {exc}")
        raise HTTPException(status_code=500, detail=f"GIF analysis failed: {exc}")

# --- 7. Define Combined Analysis Endpoint ---
@app.post("/api/ml/analyze/combined")
def analyze_combined(request: dict):
    """
    Simulates a combined multimodal analysis based on weighted text and media scores.
    """
    text_data = request.get("text_data", {})
    media_data = request.get("media_data", {})

    # 1. Extract Scores
    # Assume we get scores from the two individual analysis endpoints
    text_anxiety = text_data.get("anxiety", 0)
    text_depression = text_data.get("depression", 0)
    text_stress = text_data.get("stress", 0)
    text_indicators = text_data.get("indicators", [])

    media_anxiety = media_data.get("anxiety", 0)
    media_depression = media_data.get("depression", 0)
    media_stress = media_data.get("stress", 0)
    media_indicators = media_data.get("indicators", [])

    # 2. Apply Weighted Averaging (Simulation)
    # Give Text analysis a slightly higher weight (e.g., 60%) as it is more direct.
    TEXT_WEIGHT = 0.6
    MEDIA_WEIGHT = 0.4

    final_anxiety = (text_anxiety * TEXT_WEIGHT) + (media_anxiety * MEDIA_WEIGHT)
    final_depression = (text_depression * TEXT_WEIGHT) + (media_depression * MEDIA_WEIGHT)
    final_stress = (text_stress * TEXT_WEIGHT) + (media_stress * MEDIA_WEIGHT)

    # 3. Determine Overall Risk (Simple max score-based classification)
    max_score = max(final_anxiety, final_depression, final_stress)

    if max_score > 75:
        overall_risk = "high"
    elif max_score > 40:
        overall_risk = "moderate"
    else:
        overall_risk = "low"
        
    # Combine indicators and recommendations
    all_indicators = list(set(text_indicators + media_indicators))
    
    final_recommendations = [
        "Review of combined text and visual elements suggests a comprehensive approach.",
        *media_data.get("recommendations", []),
        *text_data.get("recommendations", [])
    ]
    # Remove duplicates from recommendations if possible, but keep it simple for now

    print(f"Combined Analysis Result: {overall_risk.upper()} Risk ({max_score:.2f})")
    
    return {
        "anxiety": final_anxiety,
        "depression": final_depression,
        "stress": final_stress,
        "overall_risk": overall_risk,
        "indicators": all_indicators,
        "recommendations": final_recommendations
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)