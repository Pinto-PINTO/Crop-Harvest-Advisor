import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FarmProvider, useFarm } from './context/FarmContext';
import Login from './components/FarmAuth/Login';
import Register from './components/FarmAuth/Register';
import Dashboard from './components/FarmDashboard/Dashboard';
import './styles/farmStyles.css';

function AppContent() {
  const { user, initializing } = useFarm();
  const [showRegister, setShowRegister] = useState(false);

  // Show loading screen while checking auth
  if (initializing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading your farm data...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    return <Dashboard />;
  }

  // Otherwise show login/register
  if (showRegister) {
    return <Register onSwitchToLogin={() => setShowRegister(false)} />;
  }

  return <Login onSwitchToRegister={() => setShowRegister(true)} />;
}

function App() {
  return (
    <FarmProvider>
      <Toaster position="top-right" />
      <AppContent />
    </FarmProvider>
  );
}

export default App;