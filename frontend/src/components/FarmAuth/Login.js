import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Login = ({ onSwitchToRegister }) => {
  const { loginWithFirebase, loading } = useFarm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginWithFirebase(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-600" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🌾</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
            <p className="text-gray-500 mt-1">Login to your farm dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="farm@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <FiLogIn size={18} />
              <span>{loading ? 'Logging in...' : 'Login'}</span>
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            New farmer?{' '}
            <button onClick={onSwitchToRegister} className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
              Register Farm
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;