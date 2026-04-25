import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiCamera, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:8000/api';

const ReanalyzeModal = ({ crop, onClose }) => {
  const { updateCrop, refreshCrops, farm } = useFarm();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

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
      setAnalysisResult(null);
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
    formData.append('user_id', crop.farm_id || farm?.uid);

    try {
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
      toast.success('AI Re-analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.response?.data?.detail || 'AI Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return;
    
    setSaving(true);
    
    const newAIAnalysis = {
      maturity: {
        stage: analysisResult.image_analysis?.maturity?.stage,
        score: analysisResult.image_analysis?.maturity?.score,
        confidence: analysisResult.image_analysis?.maturity?.confidence,
        metrics: analysisResult.image_analysis?.maturity?.metrics
      },
      disease: {
        disease: analysisResult.image_analysis?.disease?.disease,
        severity: analysisResult.image_analysis?.disease?.severity,
        confidence: analysisResult.image_analysis?.disease?.confidence
      },
      recommendation: analysisResult.final_recommendation,
      confidence: analysisResult.analysis_confidence,
      prediction: analysisResult.prediction,
      reanalyzed_at: new Date().toISOString(),
      reanalyzed_image: previewUrl
    };
    
    const newNotes = `[Reanalyzed on ${new Date().toLocaleString()}]\n` +
      `AI Recommendation: ${analysisResult.final_recommendation}\n` +
      `Maturity: ${analysisResult.image_analysis?.maturity?.stage?.toUpperCase()} (${analysisResult.image_analysis?.maturity?.score}%)\n` +
      `Disease: ${analysisResult.image_analysis?.disease?.disease?.replace('_', ' ').toUpperCase()}\n` +
      `Confidence: ${(analysisResult.analysis_confidence * 100).toFixed(0)}%\n` +
      `Weather Risk: ${analysisResult.prediction?.weather_risk?.risk_level?.toUpperCase() || 'Low'}\n` +
      `Expected harvest: ${analysisResult.prediction?.days_to_wait || 0} days\n\n` +
      `${crop.notes || ''}`;
    
    const updates = {
      ai_analysis: newAIAnalysis,
      notes: newNotes,
      last_reanalyzed: new Date().toISOString()
    };
    
    if (analysisResult.prediction?.days_to_wait) {
      const currentDaysPlanted = crop.days_planted || 0;
      const suggestedTotalDays = currentDaysPlanted + analysisResult.prediction.days_to_wait;
      if (suggestedTotalDays >= 30 && suggestedTotalDays <= 200) {
        updates.expected_days_to_harvest = suggestedTotalDays;
      }
    }
    
    const success = await updateCrop(crop.crop_id || crop.id, updates);
    
    if (success) {
      toast.success('Crop re-analysis saved successfully!');
      await refreshCrops();
      onClose();
    }
    
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Reanalyze: {crop.crop_type}</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><FiX size={20} className="text-white" /></button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Current Analysis</p>
              <div className="flex justify-between text-sm"><span>Maturity:</span><span className="font-medium">{crop.ai_analysis?.maturity?.stage?.toUpperCase() || crop.status?.toUpperCase() || 'Unknown'}</span></div>
              <div className="flex justify-between text-sm mt-1"><span>Disease:</span><span className="font-medium">{crop.ai_analysis?.disease?.disease?.replace('_', ' ').toUpperCase() || 'Unknown'}</span></div>
              <div className="flex justify-between text-sm mt-1"><span>Confidence:</span><span className="font-medium">{crop.ai_analysis?.confidence ? `${(crop.ai_analysis.confidence * 100).toFixed(0)}%` : 'N/A'}</span></div>
            </div>
            
            <div className="text-center mb-5"><p className="text-gray-500 text-sm">Upload a new image to update the AI analysis</p></div>
            
            {!previewUrl ? (
              <div onClick={() => document.getElementById('reanalyzeImageInput').click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                <FiCamera size={40} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">Click to upload new crop image</p>
                <p className="text-gray-400 text-xs mt-1">JPEG or PNG (max 10MB)</p>
              </div>
            ) : (
              <div className="text-center">
                <img src={previewUrl} alt="Crop preview" className="max-w-full max-h-48 rounded-lg mx-auto mb-2" />
                <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); setAnalysisResult(null); }} className="text-xs text-red-500 hover:text-red-600">Change Image</button>
              </div>
            )}
            
            <input id="reanalyzeImageInput" type="file" accept="image/jpeg,image/png" onChange={handleImageSelect} className="hidden" />
            
            {analyzing && (<div className="mt-4"><div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div><p className="text-center text-xs text-gray-500 mt-2">AI Analyzing crop... {uploadProgress}%</p></div>)}
            
            {analysisResult && !analyzing && (
              <div className="mt-4">
                <div className={`p-3 rounded-lg mb-4 border-l-4`} style={{ background: `${analysisResult.color_code}15`, borderLeftColor: analysisResult.color_code }}>
                  <div className="flex items-center gap-2">
                    {analysisResult.action_priority === 'high' ? <FiCheckCircle color={analysisResult.color_code} size={18} /> : <FiAlertCircle color={analysisResult.color_code} size={18} />}
                    <div><p className="text-xs text-gray-500">New AI Recommendation</p><p className="text-sm font-semibold" style={{ color: analysisResult.color_code }}>{analysisResult.final_recommendation}</p></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100"><span className="text-gray-500 text-sm">AI Maturity:</span><span className="font-semibold text-gray-800 text-sm">{analysisResult.image_analysis.maturity.stage.toUpperCase()} <span className="text-gray-500 ml-1">({analysisResult.image_analysis.maturity.score}%)</span></span></div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100"><span className="text-gray-500 text-sm">Disease Status:</span><span className={`font-semibold text-sm ${analysisResult.image_analysis.disease.disease === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>{analysisResult.image_analysis.disease.disease.replace('_', ' ').toUpperCase()}</span></div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100"><span className="text-gray-500 text-sm">AI Confidence:</span><span className="font-semibold text-gray-800 text-sm">{(analysisResult.analysis_confidence * 100).toFixed(0)}%</span></div>
                </div>
                
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg"><p className="text-xs text-emerald-800"><strong>💡 This will update the crop's:</strong> Maturity stage, Disease status, Confidence score, and add a reanalysis record to notes.</p></div>
              </div>
            )}
            
            <div className="flex gap-3 pt-6">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              {!analysisResult ? (
                <button onClick={handleAIAnalysis} disabled={!selectedImage || analyzing} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm">{analyzing ? 'Analyzing...' : 'Run AI Analysis'}</button>
              ) : (
                <button onClick={handleSaveAnalysis} disabled={saving} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm">{saving ? 'Saving...' : 'Save & Update Crop'}</button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReanalyzeModal;