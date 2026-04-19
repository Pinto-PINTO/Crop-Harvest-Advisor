import numpy as np
import cv2
from PIL import Image
import io
import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
import warnings
warnings.filterwarnings('ignore')

class CropAnalyzer:
    def __init__(self):
        # Class mappings for maturity stages
        self.maturity_stages = ['immature', 'maturing', 'ready', 'overripe']
        self.disease_types = ['healthy', 'leaf_blast', 'brown_spot', 'bacterial_blight']
        
        # Load MobileNet for crop detection
        try:
            self.base_mobilenet = MobileNetV2(weights='imagenet', include_top=True, input_shape=(224, 224, 3))
            print("✅ MobileNetV2 loaded successfully")
        except Exception as e:
            print(f"⚠️ Could not load MobileNetV2: {e}")
            self.base_mobilenet = None
        
        # Placeholder for trained models (will use fallback until trained)
        self.maturity_model = None
        self.disease_model = None
        
    def preprocess_image(self, image_bytes):
        """Preprocess image for model input"""
        try:
            # Convert bytes to image
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to model input size
            img = img.resize((224, 224))
            
            # Convert to array
            img_array = np.array(img)
            
            return img_array
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            raise
    
    def validate_image(self, img_array):
        """Validate image quality"""
        issues = []
        
        # Calculate brightness
        brightness = np.mean(img_array)
        
        # Calculate contrast (standard deviation)
        contrast = np.std(img_array)
        
        # Check brightness
        if brightness < 30:
            issues.append("Image too dark")
        elif brightness > 220:
            issues.append("Image too bright")
        
        # Check contrast
        if contrast < 20:
            issues.append("Image has low contrast")
        
        # Check image dimensions
        h, w = img_array.shape[:2]
        if h < 100 or w < 100:
            issues.append("Image too small")
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'brightness': float(brightness),
            'contrast': float(contrast)
        }
    
    def is_crop_image(self, img_array):
        """Use MobileNet to check if image contains a plant/crop"""
        if self.base_mobilenet is None:
            # Fallback: check green content
            mean_green = np.mean(img_array[:,:,1])
            mean_red = np.mean(img_array[:,:,0])
            green_ratio = mean_green / (mean_red + 0.001)
            
            if green_ratio > 0.5:
                return True, "plant (green content)"
            else:
                return False, "non-plant (low green content)"
        
        try:
            # Prepare image for MobileNet
            img = tf.image.resize(img_array, (224, 224))
            img = tf.expand_dims(img, 0)
            img = preprocess_input(img)
            
            # Get predictions
            predictions = self.base_mobilenet.predict(img, verbose=0)
            decoded = tf.keras.applications.mobilenet_v2.decode_predictions(predictions.numpy(), top=5)
            
            # Check if top predictions include plant-related categories
            plant_keywords = ['leaf', 'plant', 'crop', 'rice', 'wheat', 'corn', 'tomato', 
                            'potato', 'flower', 'tree', 'vegetable', 'grain', 'paddy',
                            'grass', 'weed', 'herb', 'seedling']
            
            for pred in decoded[0]:
                label = pred[1].lower()
                confidence = pred[2]
                
                for keyword in plant_keywords:
                    if keyword in label and confidence > 0.1:
                        print(f"   🌱 Detected plant-related content: {label} ({confidence:.2f})")
                        return True, label
            
            print(f"   ❌ Non-plant image detected. Top prediction: {decoded[0][0][1]}")
            return False, decoded[0][0][1]
            
        except Exception as e:
            print(f"Error in crop detection: {e}")
            # Fallback: check green content
            mean_green = np.mean(img_array[:,:,1])
            mean_red = np.mean(img_array[:,:,0])
            green_ratio = mean_green / (mean_red + 0.001)
            
            if green_ratio > 0.5:
                return True, "plant (green content fallback)"
            else:
                return False, "non-plant (low green content fallback)"
    
    def analyze_maturity(self, img_array):
        """Analyze crop maturity using feature-based approach"""
        
        # Extract color features
        mean_green = np.mean(img_array[:,:,1]) / 255.0
        mean_red = np.mean(img_array[:,:,0]) / 255.0
        mean_blue = np.mean(img_array[:,:,2]) / 255.0
        
        # Calculate vegetation indices
        ndvi = (mean_green - mean_red) / (mean_green + mean_red + 0.001)
        gr_ratio = mean_green / (mean_red + 0.001)
        
        # Edge density for texture
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # Sophisticated maturity detection
        if ndvi > 0.5:  # Very healthy, dense vegetation
            if edge_density < 0.12:
                score = 25
                stage = 'immature'
                confidence = 0.75
            elif edge_density < 0.20:
                score = 50
                stage = 'maturing'
                confidence = 0.78
            else:
                score = 70
                stage = 'ready'
                confidence = 0.80
        elif ndvi > 0.3:  # Moderate vegetation
            if edge_density > 0.15:
                score = 75
                stage = 'ready'
                confidence = 0.82
            else:
                score = 60
                stage = 'maturing'
                confidence = 0.75
        elif ndvi > 0.1:  # Stressed vegetation
            score = 85
            stage = 'overripe'
            confidence = 0.70
        else:  # Very stressed/dry
            score = 95
            stage = 'overripe'
            confidence = 0.65
        
        # Adjust based on green-red ratio
        if gr_ratio < 0.6 and stage != 'immature':
            score = min(100, score + 15)
            stage = 'overripe'
        
        # Ensure score is int
        score = int(score)
        
        return {
            'score': score,
            'stage': stage,
            'confidence': confidence,
            'ndvi': round(ndvi, 3),
            'green_red_ratio': round(gr_ratio, 2),
            'edge_density': round(edge_density, 3)
        }
    
    def detect_disease(self, img_array):
        """Detect diseases in crop"""
        
        mean_r = np.mean(img_array[:,:,0]) / 255.0
        mean_g = np.mean(img_array[:,:,1]) / 255.0
        mean_b = np.mean(img_array[:,:,2]) / 255.0
        
        # Calculate color ratios
        rg_ratio = mean_r / (mean_g + 0.001)
        bg_ratio = mean_b / (mean_g + 0.001)
        
        # Disease detection logic
        if rg_ratio > 1.2:  # Too much red (brown spots)
            disease = 'leaf_blast'
            confidence = 0.75
            severity = 'high'
        elif bg_ratio > 1.1:  # Too much blue (unusual)
            disease = 'bacterial_blight'
            confidence = 0.70
            severity = 'medium'
        elif mean_g < 0.2:  # Very little green
            disease = 'brown_spot'
            confidence = 0.68
            severity = 'medium'
        else:
            disease = 'healthy'
            confidence = 0.85
            severity = 'low'
        
        return {
            'disease': disease,
            'confidence': confidence,
            'severity': severity,
            'rg_ratio': round(rg_ratio, 2)
        }
    
    def analyze(self, image_bytes):
        """Complete analysis of crop image"""
        try:
            # Preprocess
            img_array = self.preprocess_image(image_bytes)
            
            # Validate image quality
            validation = self.validate_image(img_array)
            
            # First check if this is actually a crop
            is_crop, detected_label = self.is_crop_image(img_array)
            
            if not is_crop:
                return {
                    'success': False,
                    'error': 'NOT_A_CROP_IMAGE',
                    'message': f"The image appears to be a '{detected_label}' - not a crop plant.",
                    'details': [f"Detected: {detected_label}"],
                    'suggestion': 'Please upload a clear photo of a rice/crop plant with visible leaves.',
                    'image_quality': {
                        'brightness': validation['brightness'],
                        'contrast': validation['contrast'],
                        'is_clear': validation['is_valid'],
                        'issues': validation['issues']
                    }
                }
            
            # Analyze maturity
            maturity = self.analyze_maturity(img_array)
            
            # Detect disease
            disease = self.detect_disease(img_array)
            
            # Calculate overall confidence
            overall_confidence = (maturity['confidence'] + disease['confidence']) / 2
            
            # Prepare image quality info
            image_quality = {
                'brightness': round(validation['brightness'], 1),
                'contrast': round(validation['contrast'], 1),
                'is_clear': validation['is_valid'],
                'issues': validation['issues']
            }
            
            return {
                'success': True,
                'maturity': maturity,
                'disease': disease,
                'overall_confidence': round(overall_confidence, 2),
                'image_quality': image_quality,
                'crop_detection': {
                    'is_crop': is_crop,
                    'detected_as': detected_label
                }
            }
        except Exception as e:
            print(f"Error in analyze: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e),
                'image_quality': {
                    'brightness': 0,
                    'contrast': 0,
                    'is_clear': False,
                    'issues': ['Analysis failed']
                }
            }

# Singleton instance
crop_analyzer = CropAnalyzer()