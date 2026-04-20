import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiCalendar, FiActivity, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CropDetails = ({ crop, onClose }) => {
  const { updateCrop, deleteCrop, loading } = useFarm();
  const [isEditing, setIsEditing] = useState(false);
  const [reAnalyzing, setReAnalyzing] = useState(false);
  const [newAnalysis, setNewAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    crop_type: crop.crop_type,
    crop_variety: crop.crop_variety,
    planting_date: crop.planting_date,
    area_planted: crop.area_planted,
    expected_days_to_harvest: crop.expected_days_to_harvest,
    notes: crop.notes || ''
  });

  const handleReAnalyze = async () => {
    setReAnalyzing(true);
    toast.loading('AI is re-analyzing your crop...', { id: 'reanalyze' });
    
    // Simulate re-analysis (in production, you'd upload a new image)
    setTimeout(() => {
      const mockAnalysis = {
        maturity: {
          stage: crop.days_remaining <= 7 ? 'ready' : crop.days_remaining <= 14 ? 'maturing' : 'growing',
          score: Math.min(100, crop.harvest_percentage + 5)
        },
        disease: {
          disease: crop.health_status === 'healthy' ? 'healthy' : 'needs_inspection',
          severity: 'low'
        },
        recommendation: crop.days_remaining <= 7 ? 'Consider harvesting soon' : 'Continue regular monitoring',
        confidence: 85
      };
      
      setNewAnalysis(mockAnalysis);
      toast.success('AI analysis updated!', { id: 'reanalyze' });
      setReAnalyzing(false);
    }, 2000);
  };

  const handleUpdate = async () => {
    // Determine the correct ID field (Firestore uses 'id', we also set 'crop_id')
    const cropId = crop.crop_id || crop.id;
    
    console.log('=== UPDATE DEBUG ===');
    console.log('Crop object:', crop);
    console.log('Using crop ID:', cropId);
    console.log('Form data:', formData);
    
    if (!cropId) {
      console.error('No crop ID found!');
      toast.error('Cannot update: Missing crop identifier');
      return;
    }
    
    // Prepare updates object - only include changed fields
    const updates = {};
    
    if (formData.crop_type !== crop.crop_type) {
      updates.crop_type = formData.crop_type;
    }
    if (formData.crop_variety !== crop.crop_variety) {
      updates.crop_variety = formData.crop_variety;
    }
    if (formData.planting_date !== crop.planting_date) {
      updates.planting_date = formData.planting_date;
    }
    if (parseFloat(formData.area_planted) !== crop.area_planted) {
      updates.area_planted = parseFloat(formData.area_planted);
    }
    if (parseInt(formData.expected_days_to_harvest) !== crop.expected_days_to_harvest) {
      updates.expected_days_to_harvest = parseInt(formData.expected_days_to_harvest);
    }
    if (formData.notes !== crop.notes) {
      updates.notes = formData.notes;
    }
    
    // If nothing changed, just close edit mode
    if (Object.keys(updates).length === 0) {
      toast.info('No changes to save');
      setIsEditing(false);
      return;
    }
    
    console.log('Updates to save:', updates);
    
    const success = await updateCrop(cropId, updates);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    const cropId = crop.crop_id || crop.id;
    if (window.confirm(`Are you sure you want to delete ${crop.crop_type}?`)) {
      await deleteCrop(cropId);
      onClose();
    }
  };

  const analysis = newAnalysis || crop.ai_analysis;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {!isEditing ? `${crop.crop_type} Details` : 'Edit Crop'}
          </h3>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {!isEditing ? (
            // View Mode
            <>
              <div className="crop-details-grid">
                <div className="detail-section">
                  <h4>📋 Basic Information</h4>
                  <div className="info-row">
                    <span className="info-label">Crop Type:</span>
                    <span className="info-value">{crop.crop_type}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Variety:</span>
                    <span className="info-value">{crop.crop_variety}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Planting Date:</span>
                    <span className="info-value">{new Date(crop.planting_date).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Area Planted:</span>
                    <span className="info-value">{crop.area_planted} hectares</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>📈 Growth Status</h4>
                  <div className="info-row">
                    <span className="info-label">Days Planted:</span>
                    <span className="info-value">{crop.days_planted} days</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Days Remaining:</span>
                    <span className="info-value" style={{ color: crop.status_color }}>{crop.days_remaining} days</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Progress:</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-bg">
                        <div className="progress-fill" style={{ width: `${crop.harvest_percentage}%`, background: crop.status_color }}></div>
                      </div>
                    </div>
                    <span style={{ marginLeft: '0.5rem' }}>{crop.harvest_percentage}%</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className="info-value" style={{ color: crop.status_color }}>{crop.status_text}</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>🩺 Health & AI Analysis</h4>
                  <div className="info-row">
                    <span className="info-label">Health Status:</span>
                    <div className={`health-indicator health-${crop.health_status === 'healthy' ? 'healthy' : 'warning'}`} style={{ display: 'inline-flex', marginLeft: '0.5rem' }}>
                      <FiActivity />
                      <span>{crop.health_text}</span>
                    </div>
                  </div>
                  
                  {analysis ? (
                    <>
                      <div className="info-row">
                        <span className="info-label">AI Maturity:</span>
                        <span className="info-value">
                          {analysis.maturity?.stage?.toUpperCase() || 'N/A'} 
                          {analysis.maturity?.score && ` (${analysis.maturity.score}%)`}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Disease Status:</span>
                        <span className="info-value">
                          {analysis.disease?.disease?.replace('_', ' ').toUpperCase() || 'Unknown'}
                          {analysis.disease?.severity !== 'low' && analysis.disease?.severity && 
                            ` - ${analysis.disease.severity.toUpperCase()}`
                          }
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">AI Confidence:</span>
                        <span className="info-value">{analysis.confidence || analysis.analysis_confidence || 'N/A'}%</span>
                      </div>
                      {analysis.recommendation && (
                        <div className="info-row">
                          <span className="info-label">Recommendation:</span>
                          <span className="info-value">{analysis.recommendation}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="info-row">
                      <span className="info-label">AI Analysis:</span>
                      <span className="info-value">Not yet analyzed</span>
                    </div>
                  )}
                  
                  <button 
                    className="btn btn-outline" 
                    onClick={handleReAnalyze}
                    disabled={reAnalyzing}
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    <FiRefreshCw /> {reAnalyzing ? 'Analyzing...' : 'Run New AI Analysis'}
                  </button>
                </div>
                
                {crop.notes && (
                  <div className="detail-section">
                    <h4>📝 Notes</h4>
                    <p>{crop.notes}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Edit Mode
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
              <div className="form-group">
                <label>Crop Type</label>
                <input
                  type="text"
                  value={formData.crop_type}
                  onChange={(e) => setFormData({...formData, crop_type: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Crop Variety</label>
                <input
                  type="text"
                  value={formData.crop_variety}
                  onChange={(e) => setFormData({...formData, crop_variety: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Planting Date</label>
                <input
                  type="date"
                  value={formData.planting_date}
                  onChange={(e) => setFormData({...formData, planting_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Area Planted (hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.area_planted}
                  onChange={(e) => setFormData({...formData, area_planted: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Expected Days to Harvest</label>
                <input
                  type="number"
                  value={formData.expected_days_to_harvest}
                  onChange={(e) => setFormData({...formData, expected_days_to_harvest: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </form>
          )}
        </div>
        
        <div className="modal-footer">
          {!isEditing ? (
            <>
              <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                Edit Crop
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Crop
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropDetails;