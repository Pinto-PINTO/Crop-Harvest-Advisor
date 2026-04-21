// frontend/src/components/FarmAuth/Login.js
import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';

const Login = ({ onSwitchToRegister }) => {
  const { loginWithFirebase, loading } = useFarm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await loginWithFirebase(email, password);
    if (!result.success) {
      // Show error (already handled in context)
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🌾 Welcome Back!</h2>
          <p>Login to your farm dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farm@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>New farmer? <button onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer' }}>Register Farm</button></p>
        </div>
      </div>
    </div>
  );
};

export default Login;