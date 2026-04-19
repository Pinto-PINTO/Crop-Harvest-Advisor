from datetime import datetime, timedelta
import numpy as np

class HarvestPredictor:
    def __init__(self):
        pass
    
    def predict_harvest_window(self, maturity_analysis, weather_data, analysis_confidence=1.0):
        """Predict optimal harvest timing with confidence adjustment"""
        
        maturity_score = maturity_analysis.get('score', 0)
        maturity_stage = maturity_analysis.get('stage', 'maturing')
        disease = maturity_analysis.get('disease', {})
        
        # Base days to harvest based on maturity
        if maturity_stage == 'immature':
            base_days = 14
            recommendation = "Wait"
        elif maturity_stage == 'maturing':
            base_days = 7
            recommendation = "Wait"
        elif maturity_stage == 'ready':
            base_days = 2
            recommendation = "Harvest Soon"
        else:  # overripe
            base_days = 0
            recommendation = "Harvest Immediately"
        
        # Adjust based on weather
        weather_risk = self._calculate_weather_risk(weather_data)
        
        if weather_risk['risk_level'] == 'high':
            if recommendation == "Wait":
                recommendation = "Consider Early Harvest"
            else:
                recommendation = "Harvest Now - Weather Risk"
            base_days = max(0, base_days - 3)
        elif weather_risk['risk_level'] == 'low' and maturity_stage in ['immature', 'maturing']:
            base_days = min(21, base_days + 2)
        
        # Disease impact
        if disease.get('disease') != 'healthy' and disease.get('severity') == 'high':
            base_days = max(0, base_days - 5)
            if recommendation == "Wait":
                recommendation = "Harvest Soon - Disease Detected"
        
        # Adjust for analysis confidence
        if analysis_confidence < 0.7:
            base_days = base_days + 2  # Add buffer for uncertainty
            recommendation += " (Verify manually)"
        
        # Final recommendation text
        if base_days == 0:
            final_rec = "Harvest Now"
        elif base_days <= 3:
            final_rec = f"Harvest in {base_days} days"
        else:
            final_rec = f"Wait {base_days} days"
        
        # Calculate final confidence
        final_confidence = self._calculate_confidence(maturity_score, weather_risk) * analysis_confidence
        
        now = datetime.now()
        
        return {
            'recommendation': final_rec,
            'days_to_wait': base_days,
            'harvest_window_start': now + timedelta(days=base_days),
            'harvest_window_end': now + timedelta(days=base_days + 3),
            'confidence': int(final_confidence),
            'weather_risk': weather_risk
        }
    
    def _calculate_weather_risk(self, weather_data):
        """Calculate risk from weather conditions"""
        risk_score = 0
        reasons = []
        
        current = weather_data.get('current', {})
        forecast = weather_data.get('forecast', [])
        
        # Check rainfall
        if current.get('rainfall', 0) > 10:
            risk_score += 40
            reasons.append("High current rainfall")
        elif current.get('rainfall', 0) > 5:
            risk_score += 20
            reasons.append("Moderate current rainfall")
        
        # Check forecast rainfall
        total_forecast_rain = sum(f.get('rainfall', 0) for f in forecast[:4])
        if total_forecast_rain > 20:
            risk_score += 30
            reasons.append("High forecast rainfall")
        elif total_forecast_rain > 10:
            risk_score += 15
            reasons.append("Moderate forecast rainfall")
        
        # Check wind speed
        wind_speed = current.get('wind_speed', 0)
        if wind_speed > 20:
            risk_score += 20
            reasons.append("High wind speed")
        elif wind_speed > 15:
            risk_score += 10
            reasons.append("Moderate wind speed")
        
        # Check temperature extremes
        temp = current.get('temperature', 25)
        if temp > 35:
            risk_score += 15
            reasons.append("High temperature stress")
        elif temp < 15:
            risk_score += 10
            reasons.append("Low temperature stress")
        
        if risk_score >= 50:
            risk_level = 'high'
        elif risk_score >= 25:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'reasons': reasons
        }
    
    def _calculate_confidence(self, maturity_score, weather_risk):
        """Calculate prediction confidence"""
        confidence = 85  # Base confidence
        
        if maturity_score < 30 or maturity_score > 90:
            confidence -= 15
        if weather_risk['risk_level'] == 'high':
            confidence -= 20
        elif weather_risk['risk_level'] == 'medium':
            confidence -= 10
        
        return max(50, min(95, confidence))

# Create singleton instance
harvest_predictor = HarvestPredictor()