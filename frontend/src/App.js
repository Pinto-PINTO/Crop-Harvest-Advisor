import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FarmProvider, useFarm } from './context/FarmContext';
import Login from './components/FarmAuth/Login';
import Register from './components/FarmAuth/Register';
import Dashboard from './components/FarmDashboard/Dashboard';

function AppContent() {
  const { user, initializing } = useFarm();
  const [showRegister, setShowRegister] = useState(false);

  if (initializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          {/* Logo Animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl animate-pulse opacity-20"></div>
            <div className="relative w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-5xl">🌾</span>
            </div>
            <div className="absolute inset-0 rounded-2xl border-4 border-emerald-200 border-t-emerald-500 animate-spin"></div>
          </div>
          
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            CropHarvest Advisor
          </h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-300"></div>
          </div>
          <p className="text-gray-500 text-sm mt-4">Loading your farm data...</p>
        </div>
      </div>
    );
  }

  if (user) {
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
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 20px',
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
      <AppContent />
    </FarmProvider>
  );
}

export default App;