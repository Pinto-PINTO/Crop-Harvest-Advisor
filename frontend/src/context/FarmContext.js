import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  auth, 
  db,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
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

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        // Load farm profile from Firestore
        try {
          const farmDoc = await getDoc(doc(db, 'farms', user.uid));
          if (farmDoc.exists()) {
            setFarm({ uid: user.uid, ...farmDoc.data() });
          } else {
            // Create basic farm profile if doesn't exist
            const basicFarm = {
              uid: user.uid,
              email: user.email,
              farm_name: user.email.split('@')[0],
              created_at: new Date().toISOString()
            };
            await setDoc(doc(db, 'farms', user.uid), basicFarm);
            setFarm(basicFarm);
          }
        } catch (error) {
          console.error('Error loading farm:', error);
        }
        await loadCrops(user.uid);
      } else {
        setUser(null);
        setFarm(null);
        setCrops([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const registerWithFirebase = async (email, password, farmData) => {
    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Clean farm data before saving
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
      
      // Store farm profile in Firestore
      await setDoc(doc(db, 'farms', user.uid), cleanFarmData);
      
      // Also register with backend
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
      
      // Get farm profile from Firestore
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
    try {
      await signOut(auth);
      setFarm(null);
      setCrops([]);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const loadCrops = async (farmId) => {
    if (!farmId) return;
    
    setLoading(true);
    try {
      // Get crops from Firestore
      const q = query(collection(db, 'crops'), where('farm_id', '==', farmId));
      const querySnapshot = await getDocs(q);
      const cropsList = [];
      querySnapshot.forEach((doc) => {
        // Store both id and crop_id for compatibility
        cropsList.push({ 
          id: doc.id, 
          crop_id: doc.id, 
          ...doc.data() 
        });
      });
      
      // Enhance with calculations
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
      setLoading(false);
    }
  };

  const addCrop = async (cropData) => {
    setLoading(true);
    try {
      // Get the authenticated user's UID
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('You must be logged in to add crops');
        return { success: false, error: 'Not authenticated' };
      }
      
      // Use the authenticated user's UID as farm_id
      const farmId = currentUser.uid;
      
      // Clean the crop data
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
      
      // Only add optional fields if they exist
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
      // Validate cropId
      if (!cropId) {
        console.error('No crop ID provided to updateCrop');
        toast.error('Cannot update crop: Missing crop ID');
        return false;
      }
      
      console.log('Updating crop ID:', cropId);
      console.log('Updates received:', updates);
      
      // Get the authenticated user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('You must be logged in to update crops');
        return false;
      }
      
      // Build update object manually
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      // Add each field individually if it exists
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
      
      console.log('Final update data:', updateData);
      
      // Get reference to the crop document
      const cropRef = doc(db, 'crops', cropId);
      
      // Update the document
      await updateDoc(cropRef, updateData);
      
      toast.success('Crop updated successfully');
      
      // Reload crops to refresh the list
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

  return (
    <FarmContext.Provider value={{
      user,
      farm,
      crops,
      loading,
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