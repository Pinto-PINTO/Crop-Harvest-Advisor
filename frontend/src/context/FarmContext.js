import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  auth, 
  db,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from '../firebase';

const FarmContext = createContext();
export const useFarm = () => useContext(FarmContext);

const API_URL = 'http://localhost:8000/api';

export const FarmProvider = ({ children }) => {
  const [farm, setFarm] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Load crops function - defined outside useEffect to avoid recreation
  const loadCrops = async (farmId) => {
    if (!farmId) return;
    
    setLoading(true);
    try {
      const q = query(collection(db, 'crops'), where('farm_id', '==', farmId));
      const querySnapshot = await getDocs(q);
      const cropsList = [];
      querySnapshot.forEach((doc) => {
        cropsList.push({ 
          id: doc.id, 
          crop_id: doc.id, 
          ...doc.data() 
        });
      });
      
      const enhancedCrops = cropsList.map(crop => {
        try {
          const plantingDate = new Date(crop.planting_date);
          const today = new Date();
          const daysPlanted = Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, (crop.expected_days_to_harvest || 90) - daysPlanted);
          const harvestPercentage = Math.min(100, Math.floor((daysPlanted / (crop.expected_days_to_harvest || 90)) * 100));
          
          let status, statusText, statusColor;
          if (daysRemaining <= 0) {
            status = 'ready_to_harvest';
            statusText = 'Ready to Harvest!';
            statusColor = '#10b981';
          } else if (daysRemaining <= 7) {
            status = 'harvest_soon';
            statusText = `Harvest in ${daysRemaining} days`;
            statusColor = '#f59e0b';
          } else if (daysRemaining <= 14) {
            status = 'maturing';
            statusText = `${daysRemaining} days remaining`;
            statusColor = '#3b82f6';
          } else {
            status = 'growing';
            statusText = `${daysRemaining} days to harvest`;
            statusColor = '#8b5cf6';
          }
          
          return {
            ...crop,
            days_planted: daysPlanted,
            days_remaining: daysRemaining,
            harvest_percentage: harvestPercentage,
            status,
            status_text: statusText,
            status_color: statusColor,
            health_status: daysPlanted % 3 !== 0 ? 'healthy' : 'check',
            health_text: daysPlanted % 3 !== 0 ? 'Healthy' : 'Needs Inspection'
          };
        } catch (err) {
          console.error('Error enhancing crop:', err);
          return crop;
        }
      });
      
      setCrops(enhancedCrops);
    } catch (error) {
      console.error('Error loading crops:', error);
      toast.error('Failed to load crops');
    } finally {
    setLoading(false); // Make sure this is set to false after
  }
  };

  // Monitor auth state - FIXED to prevent infinite loop
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log('Auth state changed:', authUser ? `User: ${authUser.email}` : 'No user');
      
      if (!isMounted) return;
      
      if (authUser) {
        setUser(authUser);
        try {
          const farmDoc = await getDoc(doc(db, 'farms', authUser.uid));
          if (farmDoc.exists()) {
            setFarm({ uid: authUser.uid, ...farmDoc.data() });
          } else {
            const basicFarm = {
              uid: authUser.uid,
              email: authUser.email,
              farm_name: authUser.email.split('@')[0],
              created_at: new Date().toISOString()
            };
            await setDoc(doc(db, 'farms', authUser.uid), basicFarm);
            setFarm(basicFarm);
          }
          await loadCrops(authUser.uid);
        } catch (error) {
          console.error('Error loading farm:', error);
        }
      } else {
        setUser(null);
        setFarm(null);
        setCrops([]);
      }
      
      // Only set initializing to false after everything is done
      if (isMounted) {
        setInitializing(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  const registerWithFirebase = async (email, password, farmData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const cleanFarmData = {
        uid: user.uid,
        email: email,
        farm_name: farmData.farm_name || '',
        owner_name: farmData.owner_name || '',
        phone: farmData.phone || '',
        address: farmData.address || '',
        total_area: farmData.total_area || 0,
        soil_type: farmData.soil_type || 'clay',
        irrigation_type: farmData.irrigation_type || 'drip',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'farms', user.uid), cleanFarmData);
      
      try {
        await axios.post(`${API_URL}/firebase-auth`, {
          id_token: await user.getIdToken(),
          email: email,
          farm_name: farmData.farm_name,
          owner_name: farmData.owner_name
        });
      } catch (backendError) {
        console.warn('Backend registration warning:', backendError);
      }
      
      toast.success('Farm registered successfully!');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithFirebase = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const farmDoc = await getDoc(doc(db, 'farms', user.uid));
      if (farmDoc.exists()) {
        setFarm({ uid: user.uid, ...farmDoc.data() });
      }
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
  setLoading(true);
  try {
    await signOut(auth);
    setUser(null);
    setFarm(null);
    setCrops([]);
    localStorage.removeItem('farm_session');
    sessionStorage.clear();
    // Remove the toast here - it's already shown in Dashboard handleLogout
    // toast.success('Logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    toast.error(error.message || 'Logout failed');
    return { success: false, error: error.message };
  } finally {
    setLoading(false);
  }
};

  const addCrop = async (cropData) => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('You must be logged in to add crops');
        return { success: false, error: 'Not authenticated' };
      }
      
      const farmId = currentUser.uid;
      
      const cleanCropData = {
        farm_id: farmId,
        crop_type: cropData.crop_type || '',
        crop_variety: cropData.crop_variety || '',
        planting_date: cropData.planting_date || new Date().toISOString().split('T')[0],
        area_planted: parseFloat(cropData.area_planted) || 0,
        expected_days_to_harvest: parseInt(cropData.expected_days_to_harvest) || 90,
        notes: cropData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (cropData.ai_analysis) cleanCropData.ai_analysis = cropData.ai_analysis;
      if (cropData.image_url) cleanCropData.image_url = cropData.image_url;
      
      const docRef = await addDoc(collection(db, 'crops'), cleanCropData);
      toast.success('Crop added successfully!');
      await loadCrops(farmId);
      return { success: true, crop_id: docRef.id };
    } catch (error) {
      console.error('Error adding crop:', error);
      toast.error(error.message || 'Failed to add crop');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateCrop = async (cropId, updates) => {
    setLoading(true);
    try {
      if (!cropId) {
        console.error('No crop ID provided to updateCrop');
        toast.error('Cannot update crop: Missing crop ID');
        return false;
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('You must be logged in to update crops');
        return false;
      }
      
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.crop_type !== undefined && updates.crop_type !== '') {
        updateData.crop_type = updates.crop_type;
      }
      if (updates.crop_variety !== undefined && updates.crop_variety !== '') {
        updateData.crop_variety = updates.crop_variety;
      }
      if (updates.planting_date !== undefined && updates.planting_date !== '') {
        updateData.planting_date = updates.planting_date;
      }
      if (updates.area_planted !== undefined && updates.area_planted !== '') {
        updateData.area_planted = parseFloat(updates.area_planted);
      }
      if (updates.expected_days_to_harvest !== undefined && updates.expected_days_to_harvest !== '') {
        updateData.expected_days_to_harvest = parseInt(updates.expected_days_to_harvest);
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }
      
      const cropRef = doc(db, 'crops', cropId);
      await updateDoc(cropRef, updateData);
      
      toast.success('Crop updated successfully');
      await loadCrops(currentUser.uid);
      
      return true;
    } catch (error) {
      console.error('Error updating crop:', error);
      toast.error(error.message || 'Failed to update crop');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCrop = async (cropId) => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      await deleteDoc(doc(db, 'crops', cropId));
      toast.success('Crop deleted successfully');
      if (currentUser) {
        await loadCrops(currentUser.uid);
      }
      return true;
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast.error('Failed to delete crop');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateFarmProfile = async (uid, updates) => {
    setLoading(true);
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'farms', uid), updateData);
      setFarm(prev => ({ ...prev, ...updateData }));
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating farm:', error);
      toast.error('Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen only during initial auth check
  
  return (
    <FarmContext.Provider value={{
      user,
      farm,
      crops,
      loading,
      initializing,
      registerWithFirebase,
      loginWithFirebase,
      logout,
      loadCrops,
      addCrop,
      updateCrop,
      deleteCrop,
      updateFarmProfile
    }}>
      {children}
    </FarmContext.Provider>
  );
};