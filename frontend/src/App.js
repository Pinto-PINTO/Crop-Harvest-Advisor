import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FarmProvider, useFarm } from './context/FarmContext';
import Login from './components/FarmAuth/Login';
import Register from './components/FarmAuth/Register';
import Dashboard from './components/FarmDashboard/Dashboard';
import './styles/farmStyles.css';

function AppContent() {
  const { farm } = useFarm();
  const [showRegister, setShowRegister] = useState(false);

  if (farm) {
    return <Dashboard />;
  }

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