import requests
import os
from datetime import datetime, timedelta
from .firebase_config import FirebaseDB

class WeatherService:
    def __init__(self):
        # Get API key from environment variable
        self.api_key = os.getenv("WEATHER_API_KEY", "")
        self.base_url = "http://api.openweathermap.org/data/2.5"
        
        # Print warning if no API key
        if not self.api_key or self.api_key == "demo_key_optional":
            print("⚠️ WARNING: No valid Weather API key found. Using mock weather data.")
            print("   Get a free key from: https://openweathermap.org/api")
    
    async def get_weather(self, lat=7.8731, lon=80.7718):
        """Get current and forecast weather data"""
        
        # Check cache in Firebase first
        cache_key = f"{lat},{lon}"
        cached = await FirebaseDB.get_cached_weather(cache_key)
        
        if cached:
            print(f"Using cached weather data for {cache_key}")
            return cached
        
        # Try to get real weather data if API key exists
        if self.api_key and self.api_key != "demo_key_optional":
            try:
                # Get current weather
                current_url = f"{self.base_url}/weather"
                params = {
                    'lat': lat,
                    'lon': lon,
                    'appid': self.api_key,
                    'units': 'metric'
                }
                
                current_resp = requests.get(current_url, params=params, timeout=10)
                
                if current_resp.status_code == 200:
                    current_data = current_resp.json()
                    
                    # Get forecast
                    forecast_url = f"{self.base_url}/forecast"
                    forecast_resp = requests.get(forecast_url, params=params, timeout=10)
                    forecast_data = forecast_resp.json() if forecast_resp.status_code == 200 else None
                    
                    # Process weather data
                    weather_info = {
                        'current': {
                            'temperature': current_data['main']['temp'],
                            'humidity': current_data['main']['humidity'],
                            'rainfall': current_data.get('rain', {}).get('1h', 0),
                            'wind_speed': current_data['wind']['speed'],
                            'conditions': current_data['weather'][0]['description']
                        },
                        'forecast': [],
                        'historical': self._get_historical_data()
                    }
                    
                    # Process forecast if available
                    if forecast_data:
                        for item in forecast_data.get('list', [])[:8]:
                            weather_info['forecast'].append({
                                'datetime': item['dt_txt'],
                                'temperature': item['main']['temp'],
                                'humidity': item['main']['humidity'],
                                'rainfall': item.get('rain', {}).get('3h', 0),
                                'wind_speed': item['wind']['speed']
                            })
                    
                    # Cache in Firebase
                    await FirebaseDB.cache_weather(cache_key, weather_info)
                    
                    print(f"✅ Real weather data fetched for {lat},{lon}")
                    return weather_info
                else:
                    print(f"Weather API returned {current_resp.status_code}, using mock data")
                    return self._get_mock_weather()
                    
            except Exception as e:
                print(f"Weather API error: {e}, using mock data")
                return self._get_mock_weather()
        else:
            print("No valid API key, using mock weather data")
            return self._get_mock_weather()
    
    def _get_historical_data(self):
        """Get historical weather data (mock for demo)"""
        return {
            'last_week_rainfall': 45.2,
            'avg_temperature': 28.5,
            'avg_humidity': 75
        }
    
    def _get_mock_weather(self):
        """Return mock weather data when API is unavailable"""
        now = datetime.now()
        return {
            'current': {
                'temperature': 28.5,
                'humidity': 72,
                'rainfall': 0,
                'wind_speed': 12.5,
                'conditions': 'partly cloudy'
            },
            'forecast': [
                {
                    'datetime': (now + timedelta(hours=6)).isoformat(),
                    'temperature': 29.0,
                    'humidity': 70,
                    'rainfall': 0.5,
                    'wind_speed': 11.0
                },
                {
                    'datetime': (now + timedelta(hours=12)).isoformat(),
                    'temperature': 27.5,
                    'humidity': 75,
                    'rainfall': 2.0,
                    'wind_speed': 13.0
                },
                {
                    'datetime': (now + timedelta(hours=18)).isoformat(),
                    'temperature': 26.0,
                    'humidity': 80,
                    'rainfall': 5.0,
                    'wind_speed': 15.0
                }
            ],
            'historical': {
                'last_week_rainfall': 45.2,
                'avg_temperature': 28.5,
                'avg_humidity': 75
            }
        }

weather_service = WeatherService()