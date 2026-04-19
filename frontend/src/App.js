import React, { useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { 
  FiUpload, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiThermometer, 
  FiDroplet, 
  FiWind,
  FiCalendar,
  FiActivity,
  FiHeart,
  FiTrendingUp,
  FiMapPin
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThreeDots } from 'react-loader-spinner';
import './App.css';

const API_URL = 'http://localhost:8000/api';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [userId] = useState('farmer_' + Math.random().toString(36).substr(2, 9));

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        toast.error('Please select JPEG or PNG image');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      toast.success('Image loaded successfully!');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('user_id', userId);

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });
      setResult(response.data);
      toast.success('Analysis complete!');
      
      // Auto-scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
    console.error('Analysis error:', error);
    if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'object') {
            if (detail.error === 'NOT_A_CROP_IMAGE') {
                toast.error(detail.message || 'Please upload a valid crop image');
                // Show detailed reasons
                if (detail.details && detail.details.length > 0) {
                    detail.details.forEach(issue => toast.error(`• ${issue}`));
                }
            } else if (detail.error === 'POOR_QUALITY') {
                toast.error(detail.message || 'Image quality too poor');
                if (detail.suggestion) {
                    toast.info(detail.suggestion);
                }
            } else {
                toast.error(detail.message || detail);
            }
        } else {
            toast.error(detail);
        }
    } else {
        toast.error('Analysis failed. Please try again.');
    }
} finally {
      setAnalyzing(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history/${userId}`);
      setHistory(response.data.analyses);
      setShowHistory(true);
    } catch (error) {
      toast.error('Failed to load history');
    }
  };

  const submitFeedback = async () => {
    if (!result || feedback.rating === 0) {
      toast.error('Please rate your experience');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/feedback`, {
        analysis_id: result.analysis_id,
        rating: feedback.rating,
        comment: feedback.comment,
        was_helpful: feedback.rating >= 3
      });
      toast.success('Thank you for your feedback!');
      setFeedback({ rating: 0, comment: '' });
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setFeedback({ rating: 0, comment: '' });
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation.includes('Harvest Now')) return '#10b981';
    if (recommendation.includes('Wait')) return '#f59e0b';
    if (recommendation.includes('Monitor')) return '#3b82f6';
    return '#ef4444';
  };

  const getMaturityColor = (score) => {
    if (score < 30) return '#ef4444';
    if (score < 70) return '#f59e0b';
    return '#10b981';
  };

  const getDiseaseIcon = (disease) => {
    if (disease === 'healthy') return <FiHeart color="#10b981" size={24} />;
    return <FiAlertCircle color="#ef4444" size={24} />;
  };

  // Prepare chart data
  const getForecastData = () => {
    if (!result?.weather_data?.forecast) return [];
    return result.weather_data.forecast.slice(0, 5).map(day => ({
      day: new Date(day.datetime).toLocaleDateString('en-US', { weekday: 'short' }),
      temperature: day.temperature,
      rainfall: day.rainfall
    }));
  };

  return (
    <div className="app">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <header className="header">
        <div className="header-content">
          <h1>
            <span className="icon">🌾</span>
            Crop Harvest Advisor
          </h1>
          <p>AI-powered crop maturity analysis & harvest timing prediction</p>
          <div className="header-badges">
            <span className="badge">📱 Mobile Friendly</span>
            <span className="badge">🔒 Privacy Focused</span>
            <span className="badge">🤖 AI Powered</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {!result ? (
          <div className="upload-section">
            <div className="upload-card">
              <div 
                className="upload-area"
                onClick={() => document.getElementById('imageInput').click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleImageSelect({ target: { files: [file] } });
                }}
              >
                {previewUrl ? (
                  <div className="preview-container">
                    <img src={previewUrl} alt="Crop preview" className="image-preview" />
                    <button className="change-image-btn" onClick={(e) => {
                      e.stopPropagation();
                      resetAnalysis();
                    }}>
                      Change Image
                    </button>
                  </div>
                ) : (
                  <>
                    <FiUpload size={64} color="#667eea" />
                    <h3>Upload Crop Image</h3>
                    <p>Click or drag & drop to upload</p>
                    <small>Supports JPEG, PNG (max 10MB)</small>
                  </>
                )}
              </div>
              <input
                id="imageInput"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              
              {previewUrl && (
                <button 
                  className="analyze-btn"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <ThreeDots 
                        height="20" 
                        width="40" 
                        radius="9"
                        color="#ffffff" 
                        ariaLabel="three-dots-loading"
                        visible={true}
                      />
                      Analyzing Crop...
                    </>
                  ) : (
                    <>
                      <FiActivity size={20} />
                      Analyze Crop
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="info-card">
              <h3>How It Works</h3>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div>Upload crop photo</div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div>AI analyzes maturity & diseases</div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div>Weather data integration</div>
                </div>
                <div className="step">
                  <div className="step-number">4</div>
                  <div>Get harvest recommendation</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="results-section" className="results-section">
            <div 
              className="recommendation-card" 
              style={{ borderColor: getRecommendationColor(result.final_recommendation) }}
            >
              <div className="recommendation-header">
                <FiCheckCircle size={32} color={getRecommendationColor(result.final_recommendation)} />
                <h2>Final Recommendation</h2>
              </div>
              <div className="recommendation-text" style={{ color: getRecommendationColor(result.final_recommendation) }}>
                {result.final_recommendation}
              </div>
              {result.prediction.days_to_wait > 0 && (
                <div className="wait-timer">
                  <FiCalendar size={20} />
                  <span>Recommended wait: {result.prediction.days_to_wait} days</span>
                </div>
              )}
              <div className="confidence-bar">
                <div className="confidence-label">Confidence Score</div>
                <div className="confidence-bg">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${result.prediction.confidence}%`, background: getRecommendationColor(result.final_recommendation) }}
                  />
                </div>
                <div className="confidence-value">{result.prediction.confidence}%</div>
              </div>
            </div>

            <div className="analysis-grid">
              <div className="card">
                <h3>
                  <FiTrendingUp />
                  Maturity Analysis
                </h3>
                <div className="maturity-score">
                  <div className="score-circle" style={{ 
                    background: `conic-gradient(${getMaturityColor(result.image_analysis.maturity.score)} 0deg ${result.image_analysis.maturity.score * 3.6}deg, #e5e7eb ${result.image_analysis.maturity.score * 3.6}deg 360deg)`
                  }}>
                    <span>{result.image_analysis.maturity.score}%</span>
                  </div>
                </div>
                <div className="maturity-stage">
                  Stage: <strong className={result.image_analysis.maturity.stage}>
                    {result.image_analysis.maturity.stage.toUpperCase()}
                  </strong>
                </div>
                <div className="maturity-desc">
                  {result.image_analysis.maturity.stage === 'immature' && 'Crop needs more time to mature'}
                  {result.image_analysis.maturity.stage === 'maturing' && 'Crop is developing well'}
                  {result.image_analysis.maturity.stage === 'ready' && 'Crop is at optimal maturity'}
                  {result.image_analysis.maturity.stage === 'overripe' && 'Crop may be past optimal harvest time'}
                </div>
              </div>

              <div className="card">
                <h3>
                  {getDiseaseIcon(result.image_analysis.disease.disease)}
                  Disease Detection
                </h3>
                <div className="disease-info">
                  <div className="disease-name">
                    Status: <strong>{result.image_analysis.disease.disease.replace('_', ' ').toUpperCase()}</strong>
                  </div>
                  <div className={`disease-severity severity-${result.image_analysis.disease.severity}`}>
                    Severity: {result.image_analysis.disease.severity.toUpperCase()}
                  </div>
                  {result.image_analysis.disease.disease !== 'healthy' && (
                    <div className="disease-warning">
                      ⚠️ Disease detected. Consider treatment before harvest.
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>
                  <FiThermometer />
                  Current Weather
                </h3>
                <div className="weather-info">
                  <div className="weather-main">
                    <div className="weather-temp">
                      {result.weather_data.current.temperature}°C
                    </div>
                    <div className="weather-condition">
                      {result.weather_data.current.conditions}
                    </div>
                  </div>
                  <div className="weather-details">
                    <div><FiDroplet /> Humidity: {result.weather_data.current.humidity}%</div>
                    <div><FiWind /> Wind: {result.weather_data.current.wind_speed} km/h</div>
                    <div>🌧️ Rainfall: {result.weather_data.current.rainfall} mm</div>
                    <div><FiMapPin /> Location: Sri Lanka Region</div>
                  </div>
                </div>
              </div>
            </div>

            {result.weather_data.forecast && result.weather_data.forecast.length > 0 && (
              <div className="card full-width">
                <h3>5-Day Weather Forecast</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getForecastData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Rainfall (mm)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="temperature" fill="#8884d8" name="Temperature (°C)" />
                    <Bar yAxisId="right" dataKey="rainfall" fill="#82ca9d" name="Rainfall (mm)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="card">
              <h3>
                <FiCalendar />
                Harvest Window Prediction
              </h3>
              <div className="harvest-window">
                <div className="window-date">
                  <label>Start Date:</label>
                  <strong>{new Date(result.prediction.harvest_window_start).toLocaleDateString()}</strong>
                </div>
                <div className="window-date">
                  <label>End Date:</label>
                  <strong>{new Date(result.prediction.harvest_window_end).toLocaleDateString()}</strong>
                </div>
                <div className="weather-risk">
                  Weather Risk: 
                  <span className={`risk-${result.prediction.weather_risk?.risk_level || 'low'}`}>
                    {result.prediction.weather_risk?.risk_level?.toUpperCase() || 'LOW'}
                  </span>
                </div>
                {result.prediction.weather_risk?.reasons?.length > 0 && (
                  <div className="risk-reasons">
                    <small>⚠️ {result.prediction.weather_risk.reasons.join(', ')}</small>
                  </div>
                )}
              </div>
            </div>

            <div className="feedback-card">
              <h3>Was this prediction helpful?</h3>
              <div className="rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={`star ${feedback.rating >= star ? 'active' : ''}`}
                    onClick={() => setFeedback({ ...feedback, rating: star })}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Optional: Share your experience or suggestions..."
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                rows="3"
              />
              <div className="feedback-buttons">
                <button onClick={submitFeedback} className="feedback-btn">
                  Submit Feedback
                </button>
                <button onClick={resetAnalysis} className="new-analysis-btn">
                  Analyze New Crop
                </button>
              </div>
            </div>

            <button onClick={loadHistory} className="history-btn">
              View My Analysis History
            </button>

            {showHistory && history.length > 0 && (
              <div className="history-modal">
                <div className="history-content">
                  <h3>Analysis History</h3>
                  <div className="history-list">
                    {history.map((item, idx) => (
                      <div key={idx} className="history-item">
                        <div className="history-date">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <div className="history-recommendation">
                          {item.final_recommendation}
                        </div>
                        <div className="history-maturity">
                          Maturity: {item.image_analysis.maturity.score}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowHistory(false)} className="close-history">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>🌾 Data is anonymized | No personal data collected</p>
          <p>🤝 Ethical AI for sustainable farming</p>
          <p>© 2024 Crop Harvest Advisor | Smart Farming Solution</p>
        </div>
      </footer>
    </div>
  );
}

export default App;