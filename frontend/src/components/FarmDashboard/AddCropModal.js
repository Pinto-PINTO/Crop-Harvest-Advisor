import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiUpload, FiCamera, FiX, FiActivity, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000/api';

const AddCropModal = ({ onClose }) => {
  const { farm, addCrop, loading } = useFarm();
  const [step, setStep] = useState(1); // 1: Form, 2: Image Upload, 3: AI Analysis Results
  const [formData, setFormData] = useState({
    farm_id: farm?.farm_id,
    crop_type: '',
    crop_variety: '',
    planting_date: new Date().toISOString().split('T')[0],
    area_planted: '',
    expected_days_to_harvest: '',
    notes: ''
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    }
  };

  const handleAIAnalysis = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('user_id', farm?.farm_id || 'anonymous');

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setAnalysisResult(response.data);
      toast.success('AI Analysis complete!');
      
      // Auto-fill form with AI recommendations
      if (response.data.final_recommendation) {
        // Suggest expected days to harvest based on AI analysis
        const suggestedDays = response.data.prediction?.days_to_wait + 30 || 90;
        setFormData(prev => ({
          ...prev,
          expected_days_to_harvest: suggestedDays.toString(),
          notes: `AI Analysis: ${response.data.final_recommendation}. Maturity: ${response.data.image_analysis.maturity.stage} (${response.data.image_analysis.maturity.score}%), Disease: ${response.data.image_analysis.disease.disease}`
        }));
      }
      
      setStep(3);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.response?.data?.detail || 'AI Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Prepare data with proper values
  const submitData = {
    farm_id: farm?.uid || farm?.farm_id,  // Ensure farm_id is correct
    crop_type: formData.crop_type,
    crop_variety: formData.crop_variety,
    planting_date: formData.planting_date,
    area_planted: parseFloat(formData.area_planted) || 0,
    expected_days_to_harvest: parseInt(formData.expected_days_to_harvest) || 90,
    notes: formData.notes || '',
    ai_analysis: analysisResult ? {
      maturity: analysisResult.image_analysis?.maturity,
      disease: analysisResult.image_analysis?.disease,
      recommendation: analysisResult.final_recommendation,
      confidence: analysisResult.analysis_confidence,
      prediction: analysisResult.prediction
    } : null,
    image_url: previewUrl || null
  };
  
  console.log('Submitting crop data:', submitData);
  const result = await addCrop(submitData);
  if (result.success) {
    onClose();
  }
};

  const renderStep1 = () => (
    <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
      <div className="modal-body">
        <div className="form-group">
          <label>Crop Type *</label>
          <input
            type="text"
            required
            value={formData.crop_type}
            onChange={(e) => setFormData({...formData, crop_type: e.target.value})}
            placeholder="e.g., Rice, Wheat, Corn"
          />
        </div>
        
        <div className="form-group">
          <label>Crop Variety *</label>
          <input
            type="text"
            required
            value={formData.crop_variety}
            onChange={(e) => setFormData({...formData, crop_variety: e.target.value})}
            placeholder="e.g., Basmati, Bg 300"
          />
        </div>
        
        <div className="form-group">
          <label>Planting Date *</label>
          <input
            type="date"
            required
            value={formData.planting_date}
            onChange={(e) => setFormData({...formData, planting_date: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Area Planted (hectares) *</label>
          <input
            type="number"
            step="0.1"
            required
            value={formData.area_planted}
            onChange={(e) => setFormData({...formData, area_planted: e.target.value})}
            placeholder="e.g., 2.5"
          />
        </div>
        
        <div className="form-group">
          <label>Expected Days to Harvest *</label>
          <input
            type="number"
            required
            value={formData.expected_days_to_harvest}
            onChange={(e) => setFormData({...formData, expected_days_to_harvest: e.target.value})}
            placeholder="e.g., 120"
          />
        </div>
        
        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Any additional information about this crop..."
          />
        </div>
      </div>
      
      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Next: Add Image →
        </button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <div>
      <div className="modal-body">
        <div className="image-upload-section" style={{ textAlign: 'center' }}>
          <h4>Upload Crop Image for AI Analysis</h4>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Our AI will analyze the image to detect maturity, diseases, and provide harvest recommendations
          </p>
          
          {!previewUrl ? (
            <div 
              className="upload-area"
              onClick={() => document.getElementById('cropImageInput').click()}
              style={{
                border: '2px dashed #cbd5e0',
                borderRadius: '8px',
                padding: '2rem',
                cursor: 'pointer',
                background: '#f7fafc'
              }}
            >
              <FiCamera size={48} color="#667eea" />
              <p>Click to upload crop image</p>
              <small>JPEG or PNG (max 10MB)</small>
            </div>
          ) : (
            <div>
              <img src={previewUrl} alt="Crop preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewUrl(null);
                  setAnalysisResult(null);
                }}
                style={{ marginTop: '0.5rem' }}
              >
                Change Image
              </button>
            </div>
          )}
          
          <input
            id="cropImageInput"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          
          {analyzing && (
            <div style={{ marginTop: '1rem' }}>
              <div className="progress-bar">
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%`, background: '#667eea' }}></div>
                </div>
              </div>
              <p>AI Analyzing crop... {uploadProgress}%</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
          Back
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleAIAnalysis}
          disabled={!selectedImage || analyzing}
        >
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className="modal-body">
        <h4 style={{ marginBottom: '1rem' }}>🤖 AI Analysis Results</h4>
        
        {analysisResult && (
          <div>
            {/* Recommendation Card */}
            <div style={{
              background: analysisResult.color_code + '15',
              borderLeft: `4px solid ${analysisResult.color_code}`,
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {analysisResult.action_priority === 'high' ? 
                  <FiCheckCircle color={analysisResult.color_code} size={24} /> : 
                  <FiAlertCircle color={analysisResult.color_code} size={24} />
                }
                <div>
                  <strong>AI Recommendation:</strong>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: analysisResult.color_code }}>
                    {analysisResult.final_recommendation}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Maturity Analysis */}
            <div className="info-row">
              <span className="info-label">Maturity Stage:</span>
              <span className="info-value">
                {analysisResult.image_analysis.maturity.stage.toUpperCase()} 
                ({analysisResult.image_analysis.maturity.score}%)
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Disease Status:</span>
              <span className="info-value">
                {analysisResult.image_analysis.disease.disease.replace('_', ' ').toUpperCase()}
                {analysisResult.image_analysis.disease.severity !== 'low' && 
                  ` - ${analysisResult.image_analysis.disease.severity.toUpperCase()} severity`
                }
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Analysis Confidence:</span>
              <span className="info-value">{(analysisResult.analysis_confidence * 100).toFixed(0)}%</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Weather Impact:</span>
              <span className="info-value">
                Risk Level: {analysisResult.prediction?.weather_risk?.risk_level?.toUpperCase() || 'Low'}
              </span>
            </div>
            
            {/* Suggested Values */}
            <div style={{
              background: '#f0fdf4',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem'
            }}>
              <strong>💡 AI Suggestions:</strong>
              <div className="info-row">
                <span className="info-label">Suggested Harvest Window:</span>
                <span className="info-value">
                  {analysisResult.prediction?.days_to_wait || 0} days from now
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Expected Days to Harvest:</span>
                <span className="info-value">
                  {analysisResult.prediction?.days_to_wait ? 
                    (analysisResult.prediction.days_to_wait + 30) : 90} days
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
          Back to Image
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Adding Crop...' : 'Add Crop with AI Data'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>Add New Crop {step > 1 && `(Step ${step-1}/2)`}</h3>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default AddCropModal;