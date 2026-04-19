from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
import os
from datetime import datetime
import json
import numpy as np

from .advanced_ml_model import advanced_analyzer as crop_analyzer
from .weather_service import weather_service
from .prediction_service import harvest_predictor
from .firebase_config import FirebaseDB

from pydantic import BaseModel
from typing import Optional, List
from datetime import date

app = FastAPI(
    title="Crop Harvest Advisor API", 
    description="AI-powered crop analysis system for farmers",
    version="2.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://localhost:3002"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class FarmCreate(BaseModel):
    farm_name: str
    owner_name: str
    email: str
    password: str  # In production, hash this!
    phone: str
    address: str
    total_area: float
    soil_type: str
    irrigation_type: str

class FarmLogin(BaseModel):
    email: str
    password: str

class CropCreate(BaseModel):
    farm_id: str
    crop_type: str
    crop_variety: str
    planting_date: str
    area_planted: float
    expected_days_to_harvest: int
    notes: Optional[str] = ""

class CropUpdate(BaseModel):
    crop_type: Optional[str] = None
    crop_variety: Optional[str] = None
    planting_date: Optional[str] = None
    area_planted: Optional[float] = None
    expected_days_to_harvest: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def make_json_serializable(obj):
    """Convert datetime objects and non-serializable types to strings for JSON serialization"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {key: make_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

# Import numpy for type checking
import numpy as np

@app.get("/")
async def root():
    return {
        "message": "Crop Harvest Advisor API",
        "status": "running",
        "version": "2.0.0",
        "firebase_connected": FirebaseDB is not None and FirebaseDB != None,
        "endpoints": {
            "analyze": "/api/analyze (POST)",
            "feedback": "/api/feedback (POST)",
            "history": "/api/history/{user_id} (GET)",
            "health": "/api/health (GET)"
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "firebase_status": "connected" if (FirebaseDB and FirebaseDB != None) else "disconnected"
    }

@app.post("/api/analyze")
async def analyze_crop(
    image: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    lat: Optional[float] = Form(7.8731),
    lon: Optional[float] = Form(80.7718)
):
    """
    Complete crop analysis endpoint
    - Accepts crop image (JPEG/PNG)
    - Analyzes maturity and disease using AI
    - Fetches real-time weather data
    - Predicts optimal harvest timing
    """
    
    # Validate image type
    if not image.content_type in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "INVALID_FORMAT",
                "message": "Only JPEG and PNG images are supported",
                "supported_formats": ["image/jpeg", "image/png"]
            }
        )
    
    # Check file size (max 10MB)
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "FILE_TOO_LARGE",
                "message": "Image size must be less than 10MB",
                "current_size_mb": round(len(contents) / (1024 * 1024), 2)
            }
        )
    
    try:
        # Save image locally for debugging
        image_filename = f"{uuid.uuid4()}_{image.filename}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        
        with open(image_path, "wb") as f:
            f.write(contents)
        
        print(f"\n📸 Processing image: {image_filename}")
        print(f"   File size: {len(contents) / 1024:.2f} KB")
        print(f"   User ID: {user_id or 'anonymous'}")
        
        # 1. Analyze crop image with ML model
        analysis = crop_analyzer.analyze(contents)
        
        # Check if analysis failed due to non-crop image
        if not analysis['success']:
            if analysis.get('error') == 'NOT_A_CROP_IMAGE':
                raise HTTPException(
                    status_code=400, 
                    detail={
                        "error": "NOT_A_CROP_IMAGE",
                        "message": analysis.get('message', 'Image does not appear to be a crop'),
                        "details": analysis.get('details', []),
                        "suggestion": analysis.get('suggestion', 'Please upload a clear photo of a crop plant')
                    }
                )
            elif analysis.get('error') == 'POOR_QUALITY':
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "POOR_QUALITY",
                        "message": analysis.get('message', 'Image quality is insufficient'),
                        "details": analysis.get('details', []),
                        "suggestion": analysis.get('suggestion', 'Please upload a clearer, well-lit image')
                    }
                )
            else:
                raise HTTPException(
                    status_code=500, 
                    detail={
                        "error": "ANALYSIS_FAILED",
                        "message": f"Analysis failed: {analysis.get('error', 'Unknown error')}"
                    }
                )
        
        print(f"   ✅ Analysis complete - Maturity: {analysis['maturity']['stage']} ({analysis['maturity']['score']}%)")
        print(f"   🦠 Disease: {analysis['disease']['disease']} (Severity: {analysis['disease']['severity']})")
        print(f"   📊 Confidence: {analysis['overall_confidence']}")
        
        # Safely print image quality info
        if 'image_quality' in analysis:
            img_q = analysis['image_quality']
            print(f"   🖼️ Image quality - Brightness: {img_q.get('brightness', 'N/A')}, Contrast: {img_q.get('contrast', 'N/A')}")
        else:
            print(f"   🖼️ Image quality data not available")
        
        # 2. Get weather data
        weather = await weather_service.get_weather(lat, lon)
        print(f"   🌤️ Weather fetched - Temp: {weather['current']['temperature']}°C, Humidity: {weather['current']['humidity']}%")
        
        # 3. Generate harvest prediction
        analysis_confidence = analysis.get('overall_confidence', 1.0)
        prediction = harvest_predictor.predict_harvest_window(
            analysis['maturity'],
            weather,
            analysis_confidence
        )
        print(f"   📅 Harvest prediction - {prediction['recommendation']} (Confidence: {prediction['confidence']}%)")
        
        # 4. Generate final recommendation based on days to wait
        days_to_wait = prediction['days_to_wait']
        
        if days_to_wait <= 2:
            final_recommendation = "🌾 Harvest Now"
            action_priority = "high"
            color_code = "#10b981"
            action_icon = "🚜"
        elif days_to_wait <= 7:
            final_recommendation = f"⏰ Wait {days_to_wait} Days"
            action_priority = "medium"
            color_code = "#f59e0b"
            action_icon = "📅"
        else:
            final_recommendation = f"👀 Monitor - Wait {days_to_wait} Days"
            action_priority = "low"
            color_code = "#3b82f6"
            action_icon = "🔍"
        
        # Add confidence warning if analysis confidence is low
        if analysis_confidence < 0.7:
            final_recommendation += " (⚠️ Low Confidence - Consider Manual Check)"
        
        # Add disease warning if disease detected
        if analysis['disease']['disease'] != 'healthy':
            if analysis['disease']['severity'] == 'high':
                final_recommendation += " - Disease Detected! Act Fast!"
            elif analysis['disease']['severity'] == 'medium':
                final_recommendation += " - Disease Present. Monitor Closely."
        
        current_time = datetime.utcnow()
        
        # 5. Prepare result with all data
        result = {
            'analysis_id': str(uuid.uuid4()),
            'timestamp': current_time.isoformat(),
            'image_path': image_path,
            'image_filename': image_filename,
            'image_analysis': {
                'maturity': analysis['maturity'],
                'disease': analysis['disease']
            },
            'image_quality': analysis['image_quality'],
            'validation': analysis.get('validation', {}),
            'weather_data': weather,
            'prediction': {
                'recommendation': prediction['recommendation'],
                'days_to_wait': prediction['days_to_wait'],
                'harvest_window_start': prediction['harvest_window_start'],
                'harvest_window_end': prediction['harvest_window_end'],
                'confidence': prediction['confidence'],
                'weather_risk': prediction.get('weather_risk', {})
            },
            'final_recommendation': final_recommendation,
            'action_priority': action_priority,
            'action_icon': action_icon,
            'color_code': color_code,
            'analysis_confidence': analysis_confidence,
            'user_id': user_id or 'anonymous'
        }
        
        # Make sure everything is JSON serializable
        result = make_json_serializable(result)
        
        # 6. Save to Firebase (non-critical - continues even if fails)
        try:
            firebase_id = await FirebaseDB.save_analysis(result)
            result['firebase_id'] = firebase_id
            if firebase_id:
                print(f"   💾 Saved to Firebase with ID: {firebase_id}")
            else:
                print(f"   ⚠️ Could not save to Firebase")
        except Exception as e:
            print(f"   ⚠️ Firebase save error (non-critical): {e}")
            result['firebase_id'] = None
        
        print(f"   ✅ Analysis complete! Sending response...\n")
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "INTERNAL_ERROR",
                "message": f"Analysis failed: {str(e)}",
                "type": str(type(e).__name__)
            }
        )

@app.post("/api/feedback")
async def submit_feedback(
    analysis_id: str,
    rating: int,
    comment: Optional[str] = None,
    was_helpful: Optional[bool] = True
):
    """
    Submit anonymous feedback about the analysis
    """
    
    # Validate rating
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "INVALID_RATING",
                "message": "Rating must be between 1 and 5"
            }
        )
    
    feedback = {
        'analysis_id': analysis_id,
        'rating': rating,
        'comment': comment or "",
        'was_helpful': was_helpful,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    try:
        feedback_id = await FirebaseDB.save_feedback(feedback)
        
        # Prepare response message based on rating
        if rating >= 4:
            message = "Thank you for your positive feedback! 🌟"
        elif rating == 3:
            message = "Thanks for your feedback! We'll work to improve."
        else:
            message = "Sorry to hear that. Your feedback helps us improve! 🙏"
        
        return {
            "message": message,
            "feedback_id": feedback_id,
            "thank_you": "Your feedback helps improve our system for all farmers!"
        }
    except Exception as e:
        print(f"Feedback save error: {e}")
        return {
            "message": "Feedback received (will be saved later)",
            "feedback_id": None,
            "note": "Thank you for your feedback!"
        }

@app.get("/api/history/{user_id}")
async def get_history(user_id: str, limit: int = 20):
    """
    Get analysis history for a specific user
    """
    if not user_id or user_id == 'anonymous':
        return {
            "user_id": user_id,
            "total": 0,
            "analyses": [],
            "message": "Anonymous users don't have history. Create an account to save history."
        }
    
    analyses = await FirebaseDB.get_user_analyses(user_id, limit)
    
    # Convert any datetime objects in the response
    analyses = make_json_serializable(analyses)
    
    return {
        "user_id": user_id,
        "total": len(analyses),
        "analyses": analyses
    }

@app.get("/api/stats")
async def get_stats():
    """
    Get system statistics (for monitoring)
    """
    return {
        "system": "Crop Harvest Advisor",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "crop maturity detection",
            "disease identification (4 types)",
            "real-time weather integration",
            "harvest window prediction",
            "image quality validation",
            "non-crop image rejection"
        ],
        "model_info": {
            "maturity_stages": ["immature", "maturing", "ready", "overripe"],
            "disease_types": ["healthy", "leaf_blast", "brown_spot", "bacterial_blight"],
            "analysis_method": "multi-feature ML with image validation"
        }
    }

@app.get("/api/validate-image")
async def validate_image_only(
    image: UploadFile = File(...)
):
    """
    Validate image quality without full analysis
    Useful for checking if image is suitable before full analysis
    """
    
    # Validate image type
    if not image.content_type in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images are supported")
    
    contents = await image.read()
    
    try:
        from .ml_model import crop_analyzer
        img_array = crop_analyzer.preprocess_image(contents)
        validation = crop_analyzer.validate_image(img_array)
        features = crop_analyzer.extract_features(img_array)
        crop_check = crop_analyzer.is_valid_crop_image(features, validation)
        
        return {
            "is_valid_crop": crop_check['is_crop'],
            "is_good_quality": validation['is_valid'],
            "issues": validation['issues'],
            "crop_check_reasons": crop_check['reasons'],
            "image_metrics": {
                "brightness": round(validation['brightness'], 1),
                "contrast": round(validation['contrast'], 1),
                "green_ratio": round(features['green_red_ratio'], 2),
                "edge_density": round(features['edge_density'], 3)
            },
            "suggestion": "Image looks good!" if crop_check['is_crop'] and validation['is_valid'] else "Please upload a clearer crop image"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
    
# Farm Authentication Endpoints
@app.post("/api/farm/register")
async def register_farm(farm_data: FarmCreate):
    """Register a new farm"""
    try:
        # Check if farm already exists
        existing = await FirebaseDB.get_farm_by_email(farm_data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Farm already registered with this email")
        
        # In production, hash the password!
        farm_dict = farm_data.dict()
        farm_dict['farm_id'] = str(uuid.uuid4())
        
        farm_id = await FirebaseDB.create_farm(farm_dict)
        
        return {
            "success": True,
            "farm_id": farm_id,
            "message": "Farm registered successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/farm/login")
async def login_farm(login_data: FarmLogin):
    """Login farm user"""
    try:
        farm = await FirebaseDB.get_farm_by_email(login_data.email)
        
        if not farm:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # In production, compare hashed passwords!
        if farm.get('password') != login_data.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Generate simple session token
        session_token = str(uuid.uuid4())
        
        return {
            "success": True,
            "farm_id": farm['farm_id'],
            "farm_name": farm['farm_name'],
            "email": farm['email'],
            "session_token": session_token,
            "message": "Login successful!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/farm/{farm_id}")
async def get_farm_profile(farm_id: str):
    """Get farm profile details"""
    farm = await FirebaseDB.get_farm_by_id(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Remove password from response
    farm.pop('password', None)
    return farm

@app.put("/api/farm/{farm_id}")
async def update_farm_profile(farm_id: str, updates: dict):
    """Update farm profile"""
    success = await FirebaseDB.update_farm(farm_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Farm not found")
    return {"success": True, "message": "Profile updated"}

# Crop Management Endpoints
@app.post("/api/crops")
async def add_crop(crop_data: CropCreate):
    """Add a new crop to farm"""
    try:
        crop_dict = crop_data.dict()
        crop_id = await FirebaseDB.create_crop(crop_dict)
        return {
            "success": True,
            "crop_id": crop_id,
            "message": "Crop added successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crops/{farm_id}")
async def get_farm_crops(farm_id: str):
    """Get all crops for a farm with AI predictions"""
    crops = await FirebaseDB.get_farm_crops(farm_id)
    
    # Enhance each crop with AI predictions
    for crop in crops:
        # Calculate days remaining
        planting_date = datetime.fromisoformat(crop['planting_date'])
        today = datetime.utcnow()
        days_planted = (today - planting_date).days
        days_remaining = max(0, crop['expected_days_to_harvest'] - days_planted)
        
        crop['days_planted'] = days_planted
        crop['days_remaining'] = days_remaining
        crop['harvest_percentage'] = min(100, int((days_planted / crop['expected_days_to_harvest']) * 100))
        
        # Determine crop status based on days remaining
        if days_remaining <= 0:
            crop['status'] = 'ready_to_harvest'
            crop['status_text'] = 'Ready to Harvest!'
            crop['status_color'] = '#10b981'
        elif days_remaining <= 7:
            crop['status'] = 'harvest_soon'
            crop['status_text'] = f'Harvest in {days_remaining} days'
            crop['status_color'] = '#f59e0b'
        elif days_remaining <= 14:
            crop['status'] = 'maturing'
            crop['status_text'] = f'{days_remaining} days remaining'
            crop['status_color'] = '#3b82f6'
        else:
            crop['status'] = 'growing'
            crop['status_text'] = f'{days_remaining} days to harvest'
            crop['status_color'] = '#8b5cf6'
        
        # Mock health status (in production, use actual analysis)
        crop['health_status'] = 'healthy' if days_planted % 3 != 0 else 'check'
        crop['health_text'] = 'Healthy' if days_planted % 3 != 0 else 'Needs Inspection'
    
    return {"crops": crops}

@app.put("/api/crops/{crop_id}")
async def update_crop(crop_id: str, updates: CropUpdate):
    """Update crop information"""
    # Filter out None values
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    success = await FirebaseDB.update_crop(crop_id, update_dict)
    if not success:
        raise HTTPException(status_code=404, detail="Crop not found")
    return {"success": True, "message": "Crop updated"}

@app.delete("/api/crops/{crop_id}")
async def delete_crop(crop_id: str):
    """Delete a crop"""
    success = await FirebaseDB.delete_crop(crop_id)
    if not success:
        raise HTTPException(status_code=404, detail="Crop not found")
    return {"success": True, "message": "Crop deleted"}

@app.get("/api/crops/analyze/{crop_id}")
async def analyze_crop_with_ai(crop_id: str):
    """Get AI analysis for a specific crop"""
    # This would integrate with your existing image analysis
    # For now, return mock data
    return {
        "crop_id": crop_id,
        "health_score": 85,
        "disease_risk": "low",
        "recommendation": "Crop is growing well. Continue regular monitoring.",
        "estimated_yield": "high"
    }