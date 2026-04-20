import React, { useState } from 'react';
import { FiMenu, FiX, FiHome, FiPlus, FiUser, FiLogOut } from 'react-icons/fi';
import FarmProfile from '../FarmAuth/FarmProfile';

const Navbar = ({ farm, onLogout, currentView, onViewChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome /> },
    { id: 'add-crop', label: 'Add Crop', icon: <FiPlus /> }
  ];

  return (
    <>
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span>🌾</span>
          <span>CropHarvest Advisor</span>
        </div>

        <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-link ${currentView === item.id ? 'active' : ''}`}
              onClick={() => {
                onViewChange(item.id);
                setIsMenuOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-user">
          <div className="farm-info">
            <div className="farm-name">{farm?.farm_name}</div>
            <div className="farm-email">{farm?.email}</div>
          </div>
          <button className="icon-btn" onClick={() => setShowProfile(true)} title="Farm Profile">
            <FiUser size={20} />
          </button>
          <button className="icon-btn logout" onClick={onLogout} title="Logout">
            <FiLogOut size={20} />
          </button>
        </div>
      </nav>

      {showProfile && <FarmProfile onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Navbar;