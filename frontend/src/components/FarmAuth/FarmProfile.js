import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';

const FarmProfile = ({ onClose }) => {
  const { farm, updateFarmProfile, loading } = useFarm();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    farm_name: '',
    owner_name: '',
    phone: '',
    address: '',
    total_area: '',
    soil_type: '',
    irrigation_type: ''
  });

  useEffect(() => {
    if (farm) {
      setFormData({
        farm_name: farm.farm_name || '',
        owner_name: farm.owner_name || '',
        phone: farm.phone || '',
        address: farm.address || '',
        total_area: farm.total_area || '',
        soil_type: farm.soil_type || '',
        irrigation_type: farm.irrigation_type || ''
      });
    }
  }, [farm]);

  const handleSave = async () => {
    const success = await updateFarmProfile(farm.farm_id, formData);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Farm Profile</h3>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {!isEditing ? (
            // View Mode
            <div>
              <div className="info-row">
                <span className="info-label">Farm Name:</span>
                <span className="info-value">{formData.farm_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Owner:</span>
                <span className="info-value">{formData.owner_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{formData.phone}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{formData.address}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Area:</span>
                <span className="info-value">{formData.total_area} hectares</span>
              </div>
              <div className="info-row">
                <span className="info-label">Soil Type:</span>
                <span className="info-value">{formData.soil_type}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Irrigation:</span>
                <span className="info-value">{formData.irrigation_type}</span>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form>
              <div className="form-group">
                <label>Farm Name</label>
                <input
                  type="text"
                  value={formData.farm_name}
                  onChange={(e) => setFormData({...formData, farm_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Owner Name</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Total Area (hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.total_area}
                  onChange={(e) => setFormData({...formData, total_area: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Soil Type</label>
                <select
                  value={formData.soil_type}
                  onChange={(e) => setFormData({...formData, soil_type: e.target.value})}
                >
                  <option value="clay">Clay</option>
                  <option value="sandy">Sandy</option>
                  <option value="loamy">Loamy</option>
                  <option value="silty">Silty</option>
                </select>
              </div>
              <div className="form-group">
                <label>Irrigation Type</label>
                <select
                  value={formData.irrigation_type}
                  onChange={(e) => setFormData({...formData, irrigation_type: e.target.value})}
                >
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="flood">Flood Irrigation</option>
                  <option value="rainfed">Rainfed</option>
                </select>
              </div>
            </form>
          )}
        </div>
        
        <div className="modal-footer">
          {!isEditing ? (
            <>
              <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                <FiEdit2 /> Edit Profile
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                <FiX /> Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmProfile;