import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
import os
import json
from datetime import datetime
import uuid

# Configuration from environment
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    
    if firebase_admin._apps:
        return firestore.client()
    
    try:
        # Check if credentials file exists
        if os.path.exists(FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'storageBucket': FIREBASE_STORAGE_BUCKET
            })
            print("✅ Firebase Admin SDK initialized successfully!")
            return firestore.client()
        else:
            print(f"❌ Firebase credentials file not found at {FIREBASE_CREDENTIALS_PATH}")
            print("   Please download the service account key from Firebase Console")
            return None
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        return None

# Initialize Firestore
db = initialize_firebase()

# Collection references
if db:
    farms_collection = db.collection('farms')
    crops_collection = db.collection('crops')
    analyses_collection = db.collection('analyses')
    feedback_collection = db.collection('feedback')
    weather_cache_collection = db.collection('weather_cache')
    print("✅ Firestore collections ready")
else:
    farms_collection = None
    crops_collection = None
    analyses_collection = None
    feedback_collection = None
    weather_cache_collection = None
    print("⚠️ Firebase not initialized - using demo mode")

class FirebaseDB:
    @staticmethod
    def get_db():
        return db
    
    @staticmethod
    async def verify_firebase_token(id_token):
        """Verify Firebase ID token from client"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            print(f"Token verification failed: {e}")
            return None
    
    @staticmethod
    async def create_farm(farm_data):
        """Create a new farm profile in Firestore"""
        if not db or not farms_collection:
            print("Firebase not available")
            return None
        
        try:
            farm_id = farm_data.get('uid') or str(uuid.uuid4())
            farm_data['farm_id'] = farm_id
            farm_data['created_at'] = datetime.utcnow().isoformat()
            farm_data['updated_at'] = datetime.utcnow().isoformat()
            farm_data['uid'] = farm_id
            
            farms_collection.document(farm_id).set(farm_data)
            print(f"✅ Farm created in Firebase: {farm_id}")
            return farm_id
        except Exception as e:
            print(f"❌ Error creating farm: {e}")
            return None
    
    @staticmethod
    async def get_farm_by_uid(uid):
        """Get farm by Firebase UID"""
        if not db or not farms_collection:
            return None
        
        try:
            doc = farms_collection.document(uid).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error getting farm: {e}")
            return None
    
    @staticmethod
    async def get_farm_by_email(email):
        """Get farm by email"""
        if not db or not farms_collection:
            return None
        
        try:
            farms = farms_collection.where('email', '==', email).limit(1).stream()
            for farm in farms:
                return farm.to_dict()
            return None
        except Exception as e:
            print(f"Error getting farm by email: {e}")
            return None
    
    @staticmethod
    async def update_farm(uid, updates):
        """Update farm profile"""
        if not db or not farms_collection:
            return False
        
        try:
            updates['updated_at'] = datetime.utcnow().isoformat()
            farms_collection.document(uid).update(updates)
            print(f"✅ Farm updated: {uid}")
            return True
        except Exception as e:
            print(f"Error updating farm: {e}")
            return False
    
    @staticmethod
    async def create_crop(crop_data):
        """Add a new crop to farm"""
        if not db or not crops_collection:
            return None
        
        try:
            crop_id = str(uuid.uuid4())
            crop_data['crop_id'] = crop_id
            crop_data['created_at'] = datetime.utcnow().isoformat()
            crop_data['updated_at'] = datetime.utcnow().isoformat()
            
            crops_collection.document(crop_id).set(crop_data)
            print(f"✅ Crop created: {crop_id}")
            return crop_id
        except Exception as e:
            print(f"Error creating crop: {e}")
            return None
    
    @staticmethod
    async def get_farm_crops(farm_id):
        """Get all crops for a farm"""
        if not db or not crops_collection:
            return []
        
        try:
            crops = crops_collection.where('farm_id', '==', farm_id).stream()
            return [crop.to_dict() for crop in crops]
        except Exception as e:
            print(f"Error getting crops: {e}")
            return []
    
    @staticmethod
    async def update_crop(crop_id, updates):
        """Update crop information"""
        if not db or not crops_collection:
            return False
        
        try:
            updates['updated_at'] = datetime.utcnow().isoformat()
            crops_collection.document(crop_id).update(updates)
            print(f"✅ Crop updated: {crop_id}")
            return True
        except Exception as e:
            print(f"Error updating crop: {e}")
            return False
    
    @staticmethod
    async def delete_crop(crop_id):
        """Delete a crop"""
        if not db or not crops_collection:
            return False
        
        try:
            crops_collection.document(crop_id).delete()
            print(f"✅ Crop deleted: {crop_id}")
            return True
        except Exception as e:
            print(f"Error deleting crop: {e}")
            return False
    
    @staticmethod
    async def save_analysis(analysis_data):
        """Save analysis to Firestore"""
        if not db or not analyses_collection:
            return None
        
        try:
            analysis_id = str(uuid.uuid4())
            analysis_data['analysis_id'] = analysis_id
            analysis_data["created_at"] = datetime.utcnow().isoformat()
            analyses_collection.document(analysis_id).set(analysis_data)
            print(f"✅ Analysis saved: {analysis_id}")
            return analysis_id
        except Exception as e:
            print(f"Error saving analysis: {e}")
            return None
    
    @staticmethod
    async def get_user_analyses(user_id=None, limit=50):
        """Get analyses by user ID"""
        if not db or not analyses_collection:
            return []
        
        try:
            if user_id and user_id != 'anonymous':
                query = analyses_collection.where('user_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            else:
                query = analyses_collection.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            
            analyses = []
            docs = query.stream()
            for doc in docs:
                data = doc.to_dict()
                data['analysis_id'] = doc.id
                analyses.append(data)
            return analyses
        except Exception as e:
            print(f"Error getting analyses: {e}")
            return []
    
    @staticmethod
    async def save_feedback(feedback_data):
        """Save user feedback"""
        if not db or not feedback_collection:
            return None
        
        try:
            feedback_id = str(uuid.uuid4())
            feedback_data["created_at"] = datetime.utcnow().isoformat()
            feedback_collection.document(feedback_id).set(feedback_data)
            print(f"✅ Feedback saved: {feedback_id}")
            return feedback_id
        except Exception as e:
            print(f"Error saving feedback: {e}")
            return None
    
    @staticmethod
    async def cache_weather(location, weather_data):
        """Cache weather data in Firestore"""
        if not db or not weather_cache_collection:
            return False
        
        try:
            weather_cache_collection.document(location).set({
                'location': location,
                'data': weather_data,
                'updated_at': datetime.utcnow().isoformat()
            })
            return True
        except Exception as e:
            print(f"Error caching weather: {e}")
            return False
    
    @staticmethod
    async def get_cached_weather(location):
        """Get cached weather data"""
        if not db or not weather_cache_collection:
            return None
        
        try:
            doc = weather_cache_collection.document(location).get()
            if doc.exists:
                data = doc.to_dict()
                cached_time = datetime.fromisoformat(data['updated_at'])
                if (datetime.utcnow() - cached_time).seconds < 3600:
                    return data.get('data')
            return None
        except Exception as e:
            print(f"Error getting cached weather: {e}")
            return None