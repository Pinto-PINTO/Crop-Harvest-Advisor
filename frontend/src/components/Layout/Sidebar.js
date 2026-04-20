import React from 'react';
import { FiHome, FiPlus, FiList, FiSettings, FiHelpCircle } from 'react-icons/fi';

const Sidebar = ({ currentView, onViewChange, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome /> },
    { id: 'crops', label: 'My Crops', icon: <FiList /> },
    { id: 'add-crop', label: 'Add Crop', icon: <FiPlus /> },
    { id: 'settings', label: 'Settings', icon: <FiSettings /> },
    { id: 'help', label: 'Help', icon: <FiHelpCircle /> }
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>🌾 Menu</h3>
          <button className="close-sidebar" onClick={onClose}>×</button>
        </div>
        
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => {
                onViewChange(item.id);
                onClose();
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 998;
        }
        
        .sidebar {
          position: fixed;
          top: 0;
          left: -280px;
          width: 280px;
          height: 100vh;
          background: white;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          transition: left 0.3s ease;
          z-index: 999;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar.open {
          left: 0;
        }
        
        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .close-sidebar {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }
        
        .sidebar-menu {
          flex: 1;
          padding: 1rem 0;
        }
        
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 1rem;
        }
        
        .sidebar-item:hover {
          background: #f3f4f6;
        }
        
        .sidebar-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .sidebar-icon {
          font-size: 1.25rem;
        }
      `}</style>
    </>
  );
};

export default Sidebar;