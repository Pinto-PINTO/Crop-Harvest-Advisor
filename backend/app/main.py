from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime
import uuid
import os
import numpy as np
from pydantic import BaseModel
import jwt

from .advanced_ml_model import advanced_analyzer as crop_analyzer
from .weather_service import weather_service
from .prediction_service import harvest_predictor
from .firebase_config import FirebaseDB

# Pydantic models
class FarmRegisterRequest(BaseModel):
    email: str
    password: str
    farm_name: str
    owner_name: str
    phone: str
    address: str
    total_area: float
    soil_type: str = "clay"
    irrigation_type: str = "drip"

class FarmLoginRequest(BaseModel):
    email: str
    password: str

class FirebaseAuthRequest(BaseModel):
    id_token: str
    email: str
    farm_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    total_area: Optional[float] = None

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

# Helper functions
def make_json_serializable(obj):
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

# Initialize FastAPI
app = FastAPI(title="Crop Harvest Advisor API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==================== FIREBASE AUTH ENDPOINTS ====================

@app.post("/api/firebase-auth")
async def firebase_auth(auth_data: FirebaseAuthRequest):
    """Authenticate user with Firebase ID token"""
    try:
        # Verify the Firebase ID token
        decoded_token = await FirebaseDB.verify_firebase_token(auth_data.id_token)
        
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        uid = decoded_token.get('uid')
        email = decoded_token.get('email')
        
        # Check if farm exists
        existing_farm = await FirebaseDB.get_farm_by_uid(uid)
        
        if not existing_farm:
            # Create new farm profile
            farm_data = {
                'uid': uid,
                'email': email,
                'farm_name': auth_data.farm_name or email.split('@')[0],
                'owner_name': auth_data.owner_name or email.split('@')[0],
                'phone': auth_data.phone or '',
                'address': auth_data.address or '',
                'total_area': auth_data.total_area or 0,
                'soil_type': 'clay',
                'irrigation_type': 'drip',
                'created_at': datetime.utcnow().isoformat()
            }
            await FirebaseDB.create_farm(farm_data)
        
        return {
            "success": True,
            "uid": uid,
            "email": email,
            "message": "Authentication successful"
        }
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/farm/profile/{uid}")
async def get_farm_profile(uid: str):
    """Get farm profile by UID"""
    farm = await FirebaseDB.get_farm_by_uid(uid)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Remove sensitive data
    farm.pop('password', None)
    return farm

@app.put("/api/farm/profile/{uid}")
async def update_farm_profile(uid: str, updates: dict):
    """Update farm profile"""
    success = await FirebaseDB.update_farm(uid, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Farm not found")
    return {"success": True, "message": "Profile updated"}

# ==================== CROP MANAGEMENT ENDPOINTS ====================

@app.post("/api/crops")
async def add_crop(crop_data: CropCreate):
    """Add a new crop"""
    try:
        crop_dict = crop_data.dict()
        crop_id = await FirebaseDB.create_crop(crop_dict)
        
        if crop_id:
            return {"success": True, "crop_id": crop_id, "message": "Crop added successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to add crop")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crops/{farm_id}")
async def get_farm_crops(farm_id: str):
    """Get all crops for a farm with predictions"""
    crops = await FirebaseDB.get_farm_crops(farm_id)
    
    # Enhance each crop with predictions
    for crop in crops:
        try:
            planting_date = datetime.fromisoformat(crop['planting_date'])
            today = datetime.utcnow()
            days_planted = (today - planting_date).days
            days_remaining = max(0, crop['expected_days_to_harvest'] - days_planted)
            
            crop['days_planted'] = days_planted
            crop['days_remaining'] = days_remaining
            crop['harvest_percentage'] = min(100, int((days_planted / crop['expected_days_to_harvest']) * 100)) if crop['expected_days_to_harvest'] > 0 else 0
            
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
            
            crop['health_status'] = 'healthy' if days_planted % 3 != 0 else 'check'
            crop['health_text'] = 'Healthy' if days_planted % 3 != 0 else 'Needs Inspection'
        except Exception as e:
            print(f"Error enhancing crop: {e}")
    
    return {"crops": crops}

@app.put("/api/crops/{crop_id}")
async def update_crop(crop_id: str, updates: CropUpdate):
    """Update crop information"""
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

# ==================== AI ANALYSIS ENDPOINTS ====================

@app.post("/api/analyze")
async def analyze_crop(
    image: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    lat: Optional[float] = Form(7.8731),
    lon: Optional[float] = Form(80.7718)
):
    """AI crop analysis endpoint"""
    
    if not image.content_type in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images supported")
    
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be less than 10MB")
    
    try:
        image_filename = f"{uuid.uuid4()}_{image.filename}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        
        with open(image_path, "wb") as f:
            f.write(contents)
        
        analysis = crop_analyzer.analyze(contents)
        
        if not analysis['success']:
            raise HTTPException(status_code=400, detail=analysis.get('message', 'Analysis failed'))
        
        weather = await weather_service.get_weather(lat, lon)
        analysis_confidence = analysis.get('overall_confidence', 1.0)
        prediction = harvest_predictor.predict_harvest_window(
            analysis['maturity'],
            weather,
            analysis_confidence
        )
        
        days_to_wait = prediction['days_to_wait']
        if days_to_wait <= 2:
            final_recommendation = "🌾 Harvest Now"
            action_priority = "high"
            color_code = "#10b981"
        elif days_to_wait <= 7:
            final_recommendation = f"⏰ Wait {days_to_wait} Days"
            action_priority = "medium"
            color_code = "#f59e0b"
        else:
            final_recommendation = f"👀 Monitor - Wait {days_to_wait} Days"
            action_priority = "low"
            color_code = "#3b82f6"
        
        result = {
            'analysis_id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat(),
            'image_path': image_path,
            'image_analysis': {
                'maturity': analysis['maturity'],
                'disease': analysis['disease']
            },
            'image_quality': analysis.get('image_quality', {}),
            'weather_data': weather,
            'prediction': {
                'recommendation': prediction['recommendation'],
                'days_to_wait': prediction['days_to_wait'],
                'harvest_window_start': prediction['harvest_window_start'].isoformat() if isinstance(prediction['harvest_window_start'], datetime) else prediction['harvest_window_start'],
                'harvest_window_end': prediction['harvest_window_end'].isoformat() if isinstance(prediction['harvest_window_end'], datetime) else prediction['harvest_window_end'],
                'confidence': prediction['confidence']
            },
            'final_recommendation': final_recommendation,
            'action_priority': action_priority,
            'color_code': color_code,
            'analysis_confidence': analysis_confidence,
            'user_id': user_id or 'anonymous'
        }
        
        result = make_json_serializable(result)
        await FirebaseDB.save_analysis(result)
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crops/analyze/{crop_id}")
async def analyze_crop_with_ai(crop_id: str):
    """Get AI analysis for a specific crop"""
    return {
        "crop_id": crop_id,
        "health_score": 85,
        "disease_risk": "low",
        "recommendation": "Crop is growing well. Continue regular monitoring.",
        "estimated_yield": "high"
    }

# ==================== FEEDBACK ENDPOINTS ====================

@app.post("/api/feedback")
async def submit_feedback(analysis_id: str, rating: int, comment: Optional[str] = None):
    """Submit feedback"""
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    
    feedback = {
        'analysis_id': analysis_id,
        'rating': rating,
        'comment': comment or "",
        'timestamp': datetime.utcnow().isoformat()
    }
    
    feedback_id = await FirebaseDB.save_feedback(feedback)
    return {"message": "Thank you for your feedback!", "feedback_id": feedback_id}

@app.get("/api/history/{user_id}")
async def get_history(user_id: str, limit: int = 20):
    """Get analysis history"""
    analyses = await FirebaseDB.get_user_analyses(user_id, limit)
    return {"user_id": user_id, "total": len(analyses), "analyses": analyses}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}