import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
import json
from datetime import datetime

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase with service account"""
    
    # Option 1: Using service account JSON file
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
    
    # Option 2: Using environment variable (for deployment)
    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    
    if not firebase_admin._apps:
        try:
            if cred_json:
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
            else:
                # Check if file exists
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                else:
                    print(f"⚠️ Warning: Firebase credentials file not found at {cred_path}")
                    print("   Firebase features will be disabled. Continue without Firebase?")
                    return None
            
            firebase_admin.initialize_app(cred, {
                'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET", "crop-advisor-default.appspot.com")
            })
            print("✅ Firebase initialized successfully!")
            return firestore.client()
        except Exception as e:
            print(f"❌ Error initializing Firebase: {e}")
            print("   Firebase features will be disabled")
            return None
    
    return firestore.client()

# Initialize Firestore
db = initialize_firebase()

# Collections (only if Firebase is available)
if db:
    analyses_collection = db.collection('analyses')
    feedback_collection = db.collection('feedback')
    weather_cache_collection = db.collection('weather_cache')
    users_collection = db.collection('users')
    farms_collection = db.collection('farms')  # NEW
    crops_collection = db.collection('crops')  # NEW
    
    print("✅ Firestore collections ready")
else:
    analyses_collection = None
    feedback_collection = None
    weather_cache_collection = None
    users_collection = None
    print("⚠️ Running without Firebase - data will not be persisted")

class FirebaseDB:
    @staticmethod
    async def save_analysis(analysis_data):
        """Save analysis to Firestore"""
        if not db or not analyses_collection:
            print("Firebase not available, skipping save")
            return "mock_id_" + str(datetime.utcnow().timestamp())
        
        try:
            # Make a copy to avoid modifying original
            data_to_save = analysis_data.copy()
            
            # Ensure all datetime objects are converted to strings
            if 'timestamp' in data_to_save and isinstance(data_to_save['timestamp'], datetime):
                data_to_save['timestamp'] = data_to_save['timestamp'].isoformat()
            
            if 'created_at' not in data_to_save:
                data_to_save["created_at"] = datetime.utcnow().isoformat()
            
            # Handle prediction dates
            if 'prediction' in data_to_save:
                if 'harvest_window_start' in data_to_save['prediction']:
                    if isinstance(data_to_save['prediction']['harvest_window_start'], datetime):
                        data_to_save['prediction']['harvest_window_start'] = data_to_save['prediction']['harvest_window_start'].isoformat()
                if 'harvest_window_end' in data_to_save['prediction']:
                    if isinstance(data_to_save['prediction']['harvest_window_end'], datetime):
                        data_to_save['prediction']['harvest_window_end'] = data_to_save['prediction']['harvest_window_end'].isoformat()
            
            # Save to Firestore
            doc_ref = analyses_collection.document()
            doc_ref.set(data_to_save)
            
            print(f"✅ Analysis saved to Firebase with ID: {doc_ref.id}")
            return doc_ref.id
        except Exception as e:
            print(f"❌ Error saving analysis: {e}")
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
            print("Firebase not available, skipping feedback save")
            return "mock_feedback_id"
        
        try:
            feedback_data["created_at"] = datetime.utcnow().isoformat()
            doc_ref = feedback_collection.document()
            doc_ref.set(feedback_data)
            print(f"✅ Feedback saved to Firebase with ID: {doc_ref.id}")
            return doc_ref.id
        except Exception as e:
            print(f"❌ Error saving feedback: {e}")
            return None
    
    @staticmethod
    async def cache_weather(location, weather_data):
        """Cache weather data in Firestore"""
        if not db or not weather_cache_collection:
            return False
        
        try:
            doc_ref = weather_cache_collection.document(location)
            doc_ref.set({
                'location': location,
                'data': weather_data,
                'updated_at': datetime.utcnow().isoformat()
            })
            print(f"✅ Weather cached for {location}")
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
            doc_ref = weather_cache_collection.document(location)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                # Check if cache is less than 1 hour old
                cached_time = datetime.fromisoformat(data['updated_at'])
                if (datetime.utcnow() - cached_time).seconds < 3600:
                    print(f"✅ Using cached weather for {location}")
                    return data.get('data')
            return None
        except Exception as e:
            print(f"Error getting cached weather: {e}")
            return None
    
    @staticmethod
    async def save_user(user_data):
        """Save or update user"""
        if not db or not users_collection:
            return None
        
        try:
            email = user_data.get('email')
            if email:
                doc_ref = users_collection.document(email)
                user_data['updated_at'] = datetime.utcnow().isoformat()
                doc_ref.set(user_data, merge=True)
                return email
            return None
        except Exception as e:
            print(f"Error saving user: {e}")
            return None
        
    # -------------- Farm CRUD operations -------------- 
    @staticmethod
    async def create_farm(farm_data):
        """Create a new farm profile"""
        if not db or not farms_collection:
            return None
        try:
            farm_id = farm_data.get('farm_id', str(uuid.uuid4()))
            farm_data['farm_id'] = farm_id
            farm_data['created_at'] = datetime.utcnow().isoformat()
            farm_data['updated_at'] = datetime.utcnow().isoformat()
            farms_collection.document(farm_id).set(farm_data)
            return farm_id
        except Exception as e:
            print(f"Error creating farm: {e}")
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
            print(f"Error getting farm: {e}")
            return None
    
    @staticmethod
    async def get_farm_by_id(farm_id):
        """Get farm by ID"""
        if not db or not farms_collection:
            return None
        try:
            farm = farms_collection.document(farm_id).get()
            return farm.to_dict() if farm.exists else None
        except Exception as e:
            print(f"Error getting farm: {e}")
            return None
    
    @staticmethod
    async def update_farm(farm_id, updates):
        """Update farm profile"""
        if not db or not farms_collection:
            return None
        try:
            updates['updated_at'] = datetime.utcnow().isoformat()
            farms_collection.document(farm_id).update(updates)
            return True
        except Exception as e:
            print(f"Error updating farm: {e}")
            return False
    
    # Crop CRUD operations
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
            return None
        try:
            updates['updated_at'] = datetime.utcnow().isoformat()
            crops_collection.document(crop_id).update(updates)
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
            return True
        except Exception as e:
            print(f"Error deleting crop: {e}")
            return False