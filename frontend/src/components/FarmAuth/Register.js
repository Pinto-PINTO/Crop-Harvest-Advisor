import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Register = ({ onSwitchToLogin }) => {
  const { registerWithFirebase, loading } = useFarm();
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', farm_name: '', owner_name: '', phone: '', address: '', total_area: '', soil_type: 'clay', irrigation_type: 'drip'
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
    if (result.success) onSwitchToLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-600" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🌾</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Register Your Farm</h2>
            <p className="text-gray-500 mt-1">Create an account to start managing your crops</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Farm Name *</label><input type="text" required value={formData.farm_name} onChange={(e) => setFormData({...formData, farm_name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Green Valley Farm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label><input type="text" required value={formData.owner_name} onChange={(e) => setFormData({...formData, owner_name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Full name" /></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Email *</label><div className="relative"><FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="farm@example.com" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label><div className="relative"><FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Contact number" /></div></div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-2">Address *</label><div className="relative"><FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Farm location" /></div></div>

            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Total Area (hectares) *</label><input type="number" step="0.1" required value={formData.total_area} onChange={(e) => setFormData({...formData, total_area: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., 5.5" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label><select value={formData.soil_type} onChange={(e) => setFormData({...formData, soil_type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"><option value="clay">Clay</option><option value="sandy">Sandy</option><option value="loamy">Loamy</option><option value="silty">Silty</option></select></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Irrigation Type</label><select value={formData.irrigation_type} onChange={(e) => setFormData({...formData, irrigation_type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"><option value="drip">Drip Irrigation</option><option value="sprinkler">Sprinkler</option><option value="flood">Flood Irrigation</option><option value="rainfed">Rainfed</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Password *</label><div className="relative"><FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Min 6 characters" /></div></div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label><div className="relative"><FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Confirm password" /></div>{passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}</div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50">{loading ? 'Registering...' : 'Register Farm'}</button>
          </form>

          <p className="text-center text-gray-600 mt-6">Already have an account? <button onClick={onSwitchToLogin} className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">Login</button></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;