import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiCamera, FiX, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:8000/api';

const AddCropModal = ({ onClose }) => {
  const { farm, addCrop, loading } = useFarm();
  const [step, setStep] = useState(1);
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
      
      if (response.data.final_recommendation) {
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
    
    const submitData = {
      farm_id: farm?.uid || farm?.farm_id,
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
    
    const result = await addCrop(submitData);
    if (result.success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Add New Crop {step > 1 && `(Step ${step-1}/2)`}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <FiX size={20} className="text-white" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
                  <input type="text" required value={formData.crop_type} onChange={(e) => setFormData({...formData, crop_type: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., Rice, Wheat" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Variety *</label>
                  <input type="text" required value={formData.crop_variety} onChange={(e) => setFormData({...formData, crop_variety: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., Basmati" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date *</label>
                  <input type="date" required value={formData.planting_date} onChange={(e) => setFormData({...formData, planting_date: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area Planted (hectares) *</label>
                  <input type="number" step="0.1" required value={formData.area_planted} onChange={(e) => setFormData({...formData, area_planted: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., 2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Days to Harvest *</label>
                  <input type="number" required value={formData.expected_days_to_harvest} onChange={(e) => setFormData({...formData, expected_days_to_harvest: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., 120" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Any additional information..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">Next: Add Image →</button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div>
                <div className="text-center mb-5">
                  <p className="text-gray-500 text-sm">Upload a clear image of your crop for AI analysis</p>
                </div>
                
                {!previewUrl ? (
                  <div onClick={() => document.getElementById('cropImageInput').click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                    <FiCamera size={40} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm">Click to upload crop image</p>
                    <p className="text-gray-400 text-xs mt-1">JPEG or PNG (max 10MB)</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <img src={previewUrl} alt="Crop preview" className="max-w-full max-h-40 rounded-lg mx-auto mb-2" />
                    <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); setAnalysisResult(null); }} className="text-xs text-red-500 hover:text-red-600">Change Image</button>
                  </div>
                )}
                
                <input id="cropImageInput" type="file" accept="image/jpeg,image/png" onChange={handleImageSelect} className="hidden" />
                
                {analyzing && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">AI Analyzing crop... {uploadProgress}%</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-6">
                  <button onClick={() => setStep(1)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                    <FiArrowLeft size={14} />Back
                  </button>
                  <button onClick={handleAIAnalysis} disabled={!selectedImage || analyzing} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm">
                    {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && analysisResult && (
              <div>
                <div className={`p-3 rounded-lg mb-4 border-l-4`} style={{ background: `${analysisResult.color_code}15`, borderLeftColor: analysisResult.color_code }}>
                  <div className="flex items-center gap-2">
                    {analysisResult.action_priority === 'high' ? <FiCheckCircle color={analysisResult.color_code} size={18} /> : <FiAlertCircle color={analysisResult.color_code} size={18} />}
                    <div>
                      <p className="text-xs text-gray-500">AI Recommendation</p>
                      <p className="text-sm font-semibold" style={{ color: analysisResult.color_code }}>{analysisResult.final_recommendation}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Maturity Stage:</span>
                    <span className="font-medium text-gray-800 text-sm">{analysisResult.image_analysis.maturity.stage.toUpperCase()} ({analysisResult.image_analysis.maturity.score}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Disease Status:</span>
                    <span className="font-medium text-gray-800 text-sm">{analysisResult.image_analysis.disease.disease.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Analysis Confidence:</span>
                    <span className="font-medium text-gray-800 text-sm">{(analysisResult.analysis_confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-800"><strong>💡 AI Suggestion:</strong> Expected harvest in {analysisResult.prediction?.days_to_wait || 0} days</p>
                </div>
                
                <div className="flex gap-3 pt-5">
                  <button onClick={() => setStep(2)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">Back</button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm">
                    {loading ? 'Adding...' : 'Add Crop'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddCropModal;