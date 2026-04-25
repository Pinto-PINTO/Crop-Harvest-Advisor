import React, { useEffect, useState, useRef } from 'react';
import { useFarm } from '../../context/FarmContext';
import CropCard from './CropCard';
import AddCropModal from './AddCropModal';
import ReanalyzeModal from './ReanalyzeModal';
import { 
  FiPlus, 
  FiLogOut, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiAlertCircle, 
  FiMenu, 
  FiX,
  FiGrid,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiCalendar
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { farm, crops, loadCrops, loading, logout, user } = useFarm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReanalyzeModal, setShowReanalyzeModal] = useState(false);
  const [selectedCropForReanalysis, setSelectedCropForReanalysis] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [stats, setStats] = useState({ total: 0, ready: 0, growing: 0, atRisk: 0 });

  useEffect(() => {
    const loadData = async () => {
      setIsDashboardLoading(true);
      if (farm?.uid) {
        await loadCrops(farm.uid);
      }
      setIsDashboardLoading(false);
    };
    loadData();
  }, [farm]);

  useEffect(() => {
    setStats({
      total: crops.length,
      ready: crops.filter(c => c.status === 'ready_to_harvest').length,
      growing: crops.filter(c => c.status === 'growing').length,
      atRisk: crops.filter(c => c.health_status === 'check').length,
    });
  }, [crops]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Logged out successfully');
    }
  };

  const handleReanalyze = (crop) => {
    setSelectedCropForReanalysis(crop);
    setShowReanalyzeModal(true);
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.children[0]?.offsetWidth || 350;
      const gap = 24;
      const scrollAmount = cardWidth + gap;
      const newPosition = scrollPosition + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  const statCards = [
    { title: 'Total Crops', value: stats.total, icon: FiGrid, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { title: 'Ready to Harvest', value: stats.ready, icon: FiCheckCircle, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50', text: 'text-green-600' },
    { title: 'Growing', value: stats.growing, icon: FiTrendingUp, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { title: 'Needs Attention', value: stats.atRisk, icon: FiAlertCircle, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50', text: 'text-orange-600' },
  ];

  // Beautiful bouncing logo preloader
  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          {/* Logo Animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Pulsing background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl animate-pulse opacity-20"></div>
            {/* Bouncing Logo */}
            <div className="relative w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-5xl">🌾</span>
            </div>
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-2xl border-4 border-emerald-200 border-t-emerald-500 animate-spin"></div>
          </div>
          
          {/* Loading text with animated dots */}
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-xl">🌾</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden sm:block">
                CropHarvest Advisor
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {farm?.farm_name?.charAt(0).toUpperCase() || 'F'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{farm?.farm_name || 'My Farm'}</p>
                    <p className="text-xs text-gray-500">{user?.email || farm?.email}</p>
                  </div>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{farm?.farm_name}</p>
                        <p className="text-xs text-gray-500">{user?.email || farm?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

    

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {farm?.farm_name?.charAt(0).toUpperCase() || 'F'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{farm?.farm_name || 'My Farm'}</p>
                    <p className="text-xs text-gray-500">{user?.email || farm?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                >
                  <FiLogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.text}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Crops Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Your Crops</h2>
            <p className="text-gray-500 text-sm mt-1">Monitor and manage all your crops</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
          >
            <FiPlus size={18} />
            <span>Add New Crop</span>
          </motion.button>
        </div>

        {/* Horizontal Scrolling Crops Gallery */}
        {crops.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiGrid className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No crops added yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first crop to track</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Add Your First Crop
            </button>
          </motion.div>
        ) : (
          <div className="relative">
            {/* Scroll Buttons - Desktop only */}
            {crops.length > 2 && (
              <>
                <button
                  onClick={() => scroll('left')}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                >
                  <FiChevronLeft size={20} className="text-gray-600" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                >
                  <FiChevronRight size={20} className="text-gray-600" />
                </button>
              </>
            )}
            
            {/* Scrollable Container - Responsive widths */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto gap-4 md:gap-6 pb-4 scroll-smooth hide-scrollbar snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {crops.map((crop, idx) => (
                <motion.div
                  key={crop.crop_id || crop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex-shrink-0 w-full sm:w-80 md:w-80 snap-center"
                >
                  <CropCard crop={crop} onReanalyze={handleReanalyze} />
                </motion.div>
              ))}
            </div>
            
            {/* Mobile scroll indicator dots */}
            {crops.length > 1 && (
              <div className="flex md:hidden justify-center gap-2 mt-4">
                {crops.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const cardWidth = scrollContainerRef.current.children[0]?.offsetWidth || 0;
                        const gap = 16;
                        const newPosition = idx * (cardWidth + gap);
                        scrollContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
                      }
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      Math.abs(scrollPosition / (scrollContainerRef.current?.children[0]?.offsetWidth + 16 || 1) - idx) < 0.5
                        ? 'w-6 bg-emerald-500'
                        : 'w-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer - Green background with white text */}
      <footer className="bg-gradient-to-r from-emerald-600 to-teal-600 mt-12">
        <div className="h-px bg-white/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-xs">🌾</span>
              </div>
              <span className="text-sm font-medium text-white">CropHarvest Advisor</span>
            </div>
            <span className="hidden sm:inline text-white/40 text-xs">•</span>
            <p className="text-white/80 text-xs text-center">
              AI-powered crop management for smarter farming decisions.
            </p>
            <span className="hidden sm:inline text-white/40 text-xs">•</span>
            <p className="text-white/60 text-xs">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showAddModal && <AddCropModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
      
      <AnimatePresence>
        {showReanalyzeModal && selectedCropForReanalysis && (
          <ReanalyzeModal 
            crop={selectedCropForReanalysis} 
            onClose={() => setShowReanalyzeModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;