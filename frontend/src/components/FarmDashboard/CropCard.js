import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import CropDetails from './CropDetails';
import { FiEdit2, FiTrash2, FiActivity, FiBarChart2 } from 'react-icons/fi';

const CropCard = ({ crop }) => {
  const { deleteCrop } = useFarm();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ready_to_harvest': return '🎉';
      case 'harvest_soon': return '⏰';
      case 'maturing': return '🌱';
      default: return '🌿';
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${crop.crop_type}?`)) {
      await deleteCrop(crop.crop_id);
    }
  };

  return (
    <>
      <div className="crop-card" onClick={() => setShowDetails(true)}>
        <div className="crop-header">
          <div className="crop-type">
            {getStatusIcon(crop.status)} {crop.crop_type}
          </div>
          <div className="crop-status" style={{ background: crop.status_color }}>
            {crop.status_text}
          </div>
        </div>
        
        <div className="crop-body">
          <div className="crop-info">
            <div className="info-row">
              <span className="info-label">Variety:</span>
              <span className="info-value">{crop.crop_variety}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Planted:</span>
              <span className="info-value">{new Date(crop.planting_date).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Days Planted:</span>
              <span className="info-value">{crop.days_planted} days</span>
            </div>
            <div className="info-row">
              <span className="info-label">Area:</span>
              <span className="info-value">{crop.area_planted} hectares</span>
            </div>
          </div>
          
          <div className="progress-bar">
            <div className="progress-label">
              <span>Growth Progress</span>
              <span>{crop.harvest_percentage}%</span>
            </div>
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: `${crop.harvest_percentage}%`, background: crop.status_color }}></div>
            </div>
          </div>
          
          <div className={`health-indicator health-${crop.health_status === 'healthy' ? 'healthy' : 'warning'}`}>
            <FiActivity />
            <span>{crop.health_text}</span>
          </div>
          
          {crop.ai_analysis && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              marginTop: '0.5rem',
              padding: '0.25rem',
              background: '#f3f4f6',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <FiBarChart2 size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              AI Analyzed
            </div>
          )}
        </div>
        
        <div className="crop-actions" onClick={(e) => e.stopPropagation()}>
          <button className="crop-action-btn edit-btn" onClick={() => setShowDetails(true)}>
            <FiEdit2 /> View Details
          </button>
          <button className="crop-action-btn delete-btn" onClick={handleDelete}>
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      {showDetails && (
        <CropDetails crop={crop} onClose={() => setShowDetails(false)} />
      )}
    </>
  );
};

export default CropCard;