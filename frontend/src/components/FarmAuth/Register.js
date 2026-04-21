// frontend/src/components/FarmAuth/Register.js
import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';

const Register = ({ onSwitchToLogin }) => {
  const { registerWithFirebase, loading } = useFarm();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    farm_name: '',
    owner_name: '',
    phone: '',
    address: '',
    total_area: '',
    soil_type: 'clay',
    irrigation_type: 'drip'
  });
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setPasswordError('');
    
    const { confirmPassword, ...registerData } = formData;
    const result = await registerWithFirebase(formData.email, formData.password, registerData);
    
    if (result.success) {
      onSwitchToLogin();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🌾 Register Your Farm</h2>
          <p>Create an account to start managing your crops</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="farm@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Min 6 characters"
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Confirm your password"
            />
            {passwordError && <small style={{ color: '#ef4444' }}>{passwordError}</small>}
          </div>
          
          <div className="form-group">
            <label>Farm Name *</label>
            <input
              type="text"
              required
              value={formData.farm_name}
              onChange={(e) => setFormData({...formData, farm_name: e.target.value})}
              placeholder="e.g., Green Valley Farm"
            />
          </div>
          
          <div className="form-group">
            <label>Owner Name *</label>
            <input
              type="text"
              required
              value={formData.owner_name}
              onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
              placeholder="Full name"
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Contact number"
            />
          </div>
          
          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Farm location"
            />
          </div>
          
          <div className="form-group">
            <label>Total Area (hectares) *</label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.total_area}
              onChange={(e) => setFormData({...formData, total_area: e.target.value})}
              placeholder="e.g., 5.5"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register Farm'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>Already have an account? <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer' }}>Login</button></p>
        </div>
      </div>
    </div>
  );
};

export default Register;