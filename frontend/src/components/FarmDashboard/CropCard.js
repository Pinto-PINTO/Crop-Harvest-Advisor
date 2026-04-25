import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import CropDetails from './CropDetails';
import { FiEdit2, FiTrash2, FiActivity, FiCalendar, FiMapPin, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CropCard = ({ crop, onReanalyze }) => {
  const { deleteCrop } = useFarm();
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    ready_to_harvest: { label: 'Ready to Harvest', color: 'bg-green-100 text-green-700', icon: '🎉' },
    harvest_soon: { label: 'Harvest Soon', color: 'bg-yellow-100 text-yellow-700', icon: '⏰' },
    maturing: { label: 'Maturing', color: 'bg-blue-100 text-blue-700', icon: '🌱' },
    growing: { label: 'Growing', color: 'bg-purple-100 text-purple-700', icon: '🌿' },
  };

  const status = statusConfig[crop.status] || statusConfig.growing;

  // Health icon and color mapping
  const getHealthIcon = () => {
    switch(crop.health_status) {
      case 'healthy': return <FiCheckCircle size={14} />;
      case 'disease_severe': return <FiAlertCircle size={14} />;
      case 'disease_moderate': return <FiAlertCircle size={14} />;
      case 'disease_mild': return <FiAlertCircle size={14} />;
      default: return <FiActivity size={14} />;
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${crop.crop_type}?`)) {
      const success = await deleteCrop(crop.crop_id || crop.id);
      if (success) {
        toast.success(`${crop.crop_type} deleted successfully`);
      }
    }
  };

  const handleReanalyze = (e) => {
    e.stopPropagation();
    onReanalyze(crop);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100"
        onClick={() => setShowDetails(true)}
      >
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{crop.crop_type}</h3>
              <p className="text-sm text-gray-500">{crop.crop_variety}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.icon} {status.label}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>Planted: {new Date(crop.planting_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>{crop.area_planted} hectares</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FiActivity className="w-4 h-4 mr-2 text-gray-400" />
              <span>{crop.days_planted} days planted</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Growth Progress</span>
              <span>{crop.harvest_percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${crop.harvest_percentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              />
            </div>
          </div>

          {/* Dynamic Health Tag */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm ${crop.health_color || 'bg-green-50 text-green-700'}`}>
            {getHealthIcon()}
            <span>{crop.health_text}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <button onClick={(e) => { e.stopPropagation(); setShowDetails(true); }} className="py-3 text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"><FiEdit2 size={15} /><span>Details</span></button>
          <button onClick={handleReanalyze} className="py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><FiRefreshCw size={15} /><span>Reanalyze</span></button>
          <button onClick={handleDelete} className="py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"><FiTrash2 size={15} /><span>Delete</span></button>
        </div>
      </motion.div>

      {showDetails && <CropDetails crop={crop} onClose={() => setShowDetails(false)} />}
    </>
  );
};

export default CropCard;