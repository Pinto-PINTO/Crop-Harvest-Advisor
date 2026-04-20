import React, { useEffect, useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import CropCard from './CropCard';
import AddCropModal from './AddCropModal';
import { FiPlus, FiLogOut } from 'react-icons/fi';

const Dashboard = () => {
  const { farm, crops, loadCrops, loading, logout, user } = useFarm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    growing: 0,
    atRisk: 0
  });

  useEffect(() => {
    if (farm?.uid) {
      loadCrops(farm.uid);
    }
  }, [farm]);

  useEffect(() => {
    const ready = crops.filter(c => c.status === 'ready_to_harvest').length;
    const growing = crops.filter(c => c.status === 'growing').length;
    const atRisk = crops.filter(c => c.health_status === 'check').length;
    
    setStats({
      total: crops.length,
      ready,
      growing,
      atRisk
    });
  }, [crops]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading && crops.length === 0) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span>🌾</span>
          <span>CropHarvest Advisor</span>
        </div>
        <div className="nav-user">
          <div className="farm-info">
            <div className="farm-name">{farm?.farm_name || 'My Farm'}</div>
            <div className="farm-email">{user?.email || farm?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Crops</h3>
              <div className="stat-number">{stats.total}</div>
            </div>
            <div className="stat-icon">🌱</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Ready to Harvest</h3>
              <div className="stat-number" style={{ color: '#10b981' }}>{stats.ready}</div>
            </div>
            <div className="stat-icon">✅</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Growing</h3>
              <div className="stat-number" style={{ color: '#3b82f6' }}>{stats.growing}</div>
            </div>
            <div className="stat-icon">📈</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Needs Attention</h3>
              <div className="stat-number" style={{ color: '#f59e0b' }}>{stats.atRisk}</div>
            </div>
            <div className="stat-icon">⚠️</div>
          </div>
        </div>

        <div className="crops-header">
          <h2>Your Crops</h2>
          <button className="add-crop-btn" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add New Crop
          </button>
        </div>

        {crops.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌾</div>
            <h3>No crops added yet</h3>
            <p>Click "Add New Crop" to start tracking your harvest</p>
          </div>
        ) : (
          <div className="crops-grid">
            {crops.map(crop => (
              <CropCard key={crop.crop_id || crop.id} crop={crop} />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCropModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;