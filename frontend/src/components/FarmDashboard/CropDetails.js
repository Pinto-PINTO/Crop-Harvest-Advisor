import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiCalendar, FiActivity, FiRefreshCw, FiEdit2, FiTrash2, FiX, FiMapPin, FiTrendingUp, FiHeart, FiDroplet, FiSun } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CropDetails = ({ crop, onClose }) => {
  const { updateCrop, deleteCrop, loading, refreshCrops } = useFarm();
  const [isEditing, setIsEditing] = useState(false);
  const [reAnalyzing, setReAnalyzing] = useState(false);
  const [currentCrop, setCurrentCrop] = useState(crop);
  const [formData, setFormData] = useState({
    crop_type: crop.crop_type,
    crop_variety: crop.crop_variety,
    planting_date: crop.planting_date,
    area_planted: crop.area_planted,
    expected_days_to_harvest: crop.expected_days_to_harvest,
    notes: crop.notes || ''
  });

  // Refresh crop data when the crop prop changes
  useEffect(() => {
    setCurrentCrop(crop);
    setFormData({
      crop_type: crop.crop_type,
      crop_variety: crop.crop_variety,
      planting_date: crop.planting_date,
      area_planted: crop.area_planted,
      expected_days_to_harvest: crop.expected_days_to_harvest,
      notes: crop.notes || ''
    });
  }, [crop]);

  const handleReAnalyze = async () => {
    setReAnalyzing(true);
    toast.loading('AI is re-analyzing your crop...', { id: 'reanalyze' });
    
    setTimeout(async () => {
      // Refresh the crop data to get latest analysis
      await refreshCrops();
      toast.success('AI analysis updated!', { id: 'reanalyze' });
      setReAnalyzing(false);
      onClose();
    }, 2000);
  };

  const handleUpdate = async () => {
    const cropId = currentCrop.crop_id || currentCrop.id;
    
    if (!cropId) {
      toast.error('Cannot update: Missing crop identifier');
      return;
    }
    
    const updates = {};
    if (formData.crop_type !== currentCrop.crop_type) updates.crop_type = formData.crop_type;
    if (formData.crop_variety !== currentCrop.crop_variety) updates.crop_variety = formData.crop_variety;
    if (formData.planting_date !== currentCrop.planting_date) updates.planting_date = formData.planting_date;
    if (parseFloat(formData.area_planted) !== currentCrop.area_planted) updates.area_planted = parseFloat(formData.area_planted);
    if (parseInt(formData.expected_days_to_harvest) !== currentCrop.expected_days_to_harvest) {
      updates.expected_days_to_harvest = parseInt(formData.expected_days_to_harvest);
    }
    if (formData.notes !== currentCrop.notes) updates.notes = formData.notes;
    
    if (Object.keys(updates).length === 0) {
      toast('No changes to save', { icon: 'ℹ️' });
      setIsEditing(false);
      return;
    }
    
    const success = await updateCrop(cropId, updates);
    if (success) {
      setIsEditing(false);
      await refreshCrops();
    }
  };

  const handleDelete = async () => {
    const cropId = currentCrop.crop_id || currentCrop.id;
    if (window.confirm(`Are you sure you want to delete ${currentCrop.crop_type}?`)) {
      await deleteCrop(cropId);
      onClose();
    }
  };

  const analysis = currentCrop.ai_analysis;
  const progressAngle = (currentCrop.harvest_percentage / 100) * 360;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              {!isEditing ? `${currentCrop.crop_type} Details` : 'Edit Crop'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiX size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {!isEditing ? (
              <div className="space-y-6">
                {/* Progress Speedometer */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">📊 Growth Progress</h4>
                  <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                        <circle
                          cx="80" cy="80" r="70"
                          stroke="url(#gradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - currentCrop.harvest_percentage / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800">{currentCrop.harvest_percentage}%</span>
                        <span className="text-xs text-gray-500">Complete</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">{currentCrop.days_remaining} days remaining until harvest</p>
                      <div className="w-64 mt-2 bg-gray-200 rounded-full h-2">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${currentCrop.harvest_percentage}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">📋 Basic Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Crop Type:</span><span className="font-medium text-gray-800">{currentCrop.crop_type}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Variety:</span><span className="font-medium text-gray-800">{currentCrop.crop_variety}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Planting Date:</span><span className="font-medium text-gray-800">{new Date(currentCrop.planting_date).toLocaleDateString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Area Planted:</span><span className="font-medium text-gray-800">{currentCrop.area_planted} hectares</span></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">📈 Growth Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Days Planted:</span><span className="font-medium text-gray-800">{currentCrop.days_planted} days</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Days Remaining:</span><span className="font-medium" style={{ color: currentCrop.status_color }}>{currentCrop.days_remaining} days</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Status:</span><span className="font-medium" style={{ color: currentCrop.status_color }}>{currentCrop.status_text}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">🩺 Health & AI Analysis</h4>
                  
                  <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm mb-4 ${currentCrop.health_status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    <FiHeart size={14} /><span>{currentCrop.health_text}</span>
                  </div>
                  
                  {analysis ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">AI Maturity:</span>
                        <span className="font-medium text-gray-800">{analysis.maturity?.stage?.toUpperCase() || 'N/A'} {analysis.maturity?.score && `(${analysis.maturity.score}%)`}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Disease Status:</span>
                        <span className={`font-medium ${analysis.disease?.disease === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                          {analysis.disease?.disease?.replace('_', ' ').toUpperCase() || 'Unknown'}
                          {analysis.disease?.severity !== 'low' && analysis.disease?.severity && ` - ${analysis.disease.severity.toUpperCase()}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">AI Confidence:</span>
                        <span className="font-medium text-gray-800">{analysis.confidence || analysis.analysis_confidence || 'N/A'}%</span>
                      </div>
                      {analysis.recommendation && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                          <span className="text-gray-500 text-sm">Recommendation:</span>
                          <p className="font-medium text-emerald-700 mt-1">{analysis.recommendation}</p>
                        </div>
                      )}
                      {analysis.reanalyzed_at && (
                        <div className="mt-2 text-xs text-gray-400">
                          Last reanalyzed: {new Date(analysis.reanalyzed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Not yet analyzed</p>
                  )}
                  
                  <button onClick={handleReAnalyze} disabled={reAnalyzing} className="mt-4 w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm">
                    <FiRefreshCw size={14} />{reAnalyzing ? 'Analyzing...' : 'Run New AI Analysis'}
                  </button>
                </div>

                {currentCrop.notes && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">📝 Notes</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{currentCrop.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label><input type="text" value={formData.crop_type} onChange={(e) => setFormData({...formData, crop_type: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Crop Variety</label><input type="text" value={formData.crop_variety} onChange={(e) => setFormData({...formData, crop_variety: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label><input type="date" value={formData.planting_date} onChange={(e) => setFormData({...formData, planting_date: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Area Planted (hectares)</label><input type="number" step="0.1" value={formData.area_planted} onChange={(e) => setFormData({...formData, area_planted: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Days to Harvest</label><input type="number" value={formData.expected_days_to_harvest} onChange={(e) => setFormData({...formData, expected_days_to_harvest: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              </form>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"><FiEdit2 size={14} />Edit Crop</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"><FiTrash2 size={14} />Delete Crop</button>
                <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm">Close</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button onClick={handleUpdate} disabled={loading} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm">{loading ? 'Saving...' : 'Save Changes'}</button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CropDetails;