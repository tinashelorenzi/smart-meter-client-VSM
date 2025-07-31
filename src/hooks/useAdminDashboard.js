// Fixed version of src/hooks/useAdminDashboard.js with stable dependencies

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useAdminDashboard = () => {
  // State management
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [meters, setMeters] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [unassignedMeters, setUnassignedMeters] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Auto-refresh state
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  
  // Chart state
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [chartLoading, setChartLoading] = useState(false);
  const [selectedChartMeter, setSelectedChartMeter] = useState('all');

  // Modal and interaction state - using refs to avoid dependency issues
  const activeModalsRef = useRef(new Set());
  const userInteractingRef = useRef(false);
  const userInteractionTimeoutRef = useRef(null);

  // Refs for intervals
  const refreshIntervalRef = useRef(null);
  const chartRefreshRef = useRef(null);

  // Stable functions using useCallback with empty dependencies
  const registerModal = useCallback((modalId) => {
    activeModalsRef.current.add(modalId);
    console.log('Modal registered:', modalId, 'Active modals:', Array.from(activeModalsRef.current));
  }, []);

  const unregisterModal = useCallback((modalId) => {
    activeModalsRef.current.delete(modalId);
    console.log('Modal unregistered:', modalId, 'Active modals:', Array.from(activeModalsRef.current));
  }, []);

  const setUserInteraction = useCallback((isInteracting) => {
    userInteractingRef.current = isInteracting;
    
    // Clear existing timeout
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
      userInteractionTimeoutRef.current = null;
    }
    
    // If user started interacting, set a timeout to automatically reset after 30 seconds
    if (isInteracting) {
      userInteractionTimeoutRef.current = setTimeout(() => {
        userInteractingRef.current = false;
        console.log('User interaction timeout - resuming auto-refresh');
      }, 30000);
    }
    
    console.log('User interaction set to:', isInteracting);
  }, []);

  // Check if refresh should be paused
  const shouldPauseRefresh = useCallback(() => {
    const hasActiveModals = activeModalsRef.current.size > 0;
    const isUserInteracting = userInteractingRef.current;
    const shouldPause = hasActiveModals || isUserInteracting;
    
    if (shouldPause) {
      console.log('Refresh paused - Active modals:', hasActiveModals, 'User interacting:', isUserInteracting);
    }
    
    return shouldPause;
  }, []);

  // Modified auto-refresh function with pause capability
  const autoRefreshData = useCallback(async () => {
    if (!isAutoRefreshActive) {
      return;
    }

    if (shouldPauseRefresh()) {
      console.log('Auto-refresh paused due to active modals or user interaction');
      return;
    }
    
    try {
      setConnectionStatus('connecting');
      const data = await adminAPI.getRefreshData();
      
      if (data.success) {
        // Use functional updates to prevent unnecessary re-renders
        setStats(prevStats => {
          // Only update if data actually changed
          if (JSON.stringify(prevStats) !== JSON.stringify(data.stats)) {
            return data.stats;
          }
          return prevStats;
        });
        
        setTransactions(prevTransactions => {
          // Only update if data actually changed
          if (JSON.stringify(prevTransactions) !== JSON.stringify(data.recent_transactions)) {
            return data.recent_transactions;
          }
          return prevTransactions;
        });
        
        setLastRefresh(new Date());
        setRefreshError(null);
        setConnectionStatus('connected');
        
        // Show notification for critical meters (but only if no modals are open)
        if (!shouldPauseRefresh() && data.low_units_meters && data.low_units_meters.length > 0) {
          const count = data.low_units_meters.length;
          if (count > 3) {
            toast.warning(`⚠️ ${count} meters have critically low units`, {
              duration: 5000,
              id: 'low-units-warning'
            });
          }
        }
      } else {
        throw new Error(data.message || 'Refresh failed');
      }
    } catch (error) {
      console.error('Auto-refresh error:', error);
      setRefreshError(error.message);
      setConnectionStatus('error');
    }
  }, [isAutoRefreshActive, shouldPauseRefresh]);

  // Fetch chart data with pause check
  const fetchChartData = useCallback(async () => {
    // Don't fetch chart data if user is interacting with chart controls
    if (userInteractingRef.current) {
      console.log('Chart data fetch paused due to user interaction');
      return;
    }
    
    setChartLoading(true);
    try {
      const data = await adminAPI.getUsageAnalytics(chartPeriod, selectedChartMeter);
      
      if (data.success) {
        setChartData(prevData => {
          // Only update if data actually changed
          if (JSON.stringify(prevData) !== JSON.stringify(data.chart_data)) {
            return data.chart_data;
          }
          return prevData;
        });
      }
    } catch (error) {
      console.error('Chart data fetch error:', error);
      if (!shouldPauseRefresh()) {
        toast.error('Failed to load chart data');
      }
    } finally {
      setChartLoading(false);
    }
  }, [chartPeriod, selectedChartMeter, shouldPauseRefresh]);

  // Fetch all data (for initial load and manual refresh)
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData, metersData, transactionsData, unassignedData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getMeters(),
        adminAPI.getTransactions({ limit: 50 }),
        adminAPI.getUnassignedMeters()
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (usersData.success) setUsers(usersData.users);
      if (metersData.success) setMeters(metersData.meters);
      if (transactionsData.success) setTransactions(transactionsData.transactions);
      if (unassignedData.success) setUnassignedMeters(unassignedData.meters || []);

    } catch (error) {
      console.error('Failed to fetch all data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced meter assignment with validation
  const assignMeterWithValidation = useCallback(async (userId, deviceId, nickname = '') => {
    try {
      await adminAPI.assignMeterWithValidation({ 
        user_id: userId, 
        device_id: deviceId, 
        nickname 
      });
      
      toast.success('Meter assigned successfully!');
      
      // Refresh relevant data
      const [metersData, unassignedData] = await Promise.all([
        adminAPI.getMeters(),
        adminAPI.getUnassignedMeters()
      ]);
      
      if (metersData.success) setMeters(metersData.meters);
      if (unassignedData.success) setUnassignedMeters(unassignedData.meters || []);
      
      // Trigger auto-refresh only if not paused
      if (!shouldPauseRefresh()) {
        autoRefreshData();
      }
      
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to assign meter';
      toast.error(message);
      return { success: false, message };
    }
  }, [autoRefreshData, shouldPauseRefresh]);

  // Create new meter
  const createMeter = useCallback(async (deviceId) => {
    try {
      const data = await adminAPI.createMeter({ device_id: deviceId });
      
      if (data.success) {
        toast.success(`Meter ${deviceId} created successfully!`);
        
        // Refresh meters data
        const [metersData, unassignedData] = await Promise.all([
          adminAPI.getMeters(),
          adminAPI.getUnassignedMeters()
        ]);
        
        if (metersData.success) setMeters(metersData.meters);
        if (unassignedData.success) setUnassignedMeters(unassignedData.meters || []);
        
        return { success: true };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create meter';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Admin top-up function
  const adminTopup = useCallback(async (deviceId, units, notes = '') => {
    try {
      const data = await adminAPI.adminTopup({
        device_id: deviceId,
        units: parseInt(units),
        admin_notes: notes
      });

      if (data.success) {
        const actionType = units < 0 ? 'deduction' : 'top-up';
        toast.success(`Admin ${actionType} successful! ${Math.abs(units)} units ${units < 0 ? 'deducted from' : 'added to'} ${deviceId}`);
        
        // Refresh data only if not paused
        if (!shouldPauseRefresh()) {
          autoRefreshData();
          fetchChartData();
        }
        
        return { success: true };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Admin top-up failed';
      toast.error(message);
      return { success: false, message };
    }
  }, [autoRefreshData, fetchChartData, shouldPauseRefresh]);

  // Setup auto-refresh with stable dependencies
  useEffect(() => {
    if (!isAutoRefreshActive) {
      return;
    }

    // Initial fetch
    autoRefreshData();
    
    // Set up interval
    const intervalId = setInterval(() => {
      autoRefreshData();
    }, 30000); // 30 seconds
    
    refreshIntervalRef.current = intervalId;
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoRefreshActive]); // Only depend on isAutoRefreshActive

  // Setup chart refresh with stable dependencies
  useEffect(() => {
    fetchChartData();
    
    // Refresh chart data every 2 minutes
    const intervalId = setInterval(() => {
      fetchChartData();
    }, 120000);
    
    chartRefreshRef.current = intervalId;
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [chartPeriod, selectedChartMeter]); // Only depend on chart config

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, []); // Empty dependency array for initial load only

  // Cleanup interaction timeout on unmount
  useEffect(() => {
    return () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, []);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshActive(prev => {
      const newValue = !prev;
      if (newValue) {
        toast.success('Auto-refresh enabled');
      } else {
        toast('Auto-refresh disabled', { icon: '⏸️' });
      }
      return newValue;
    });
  }, []);

  // Manual refresh
  const manualRefresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      autoRefreshData(),
      fetchChartData(),
      fetchAllData()
    ]);
    setTimeout(() => setLoading(false), 500);
    toast.success('Data refreshed');
  }, [autoRefreshData, fetchChartData, fetchAllData]);

  return {
    // Data
    stats,
    users,
    meters,
    transactions,
    unassignedMeters,
    chartData,
    
    // Loading states
    loading,
    chartLoading,
    
    // Auto-refresh state
    isAutoRefreshActive,
    lastRefresh,
    refreshError,
    connectionStatus,
    
    // Chart state
    chartPeriod,
    selectedChartMeter,
    
    // Modal and interaction management
    registerModal,
    unregisterModal,
    setUserInteraction,
    
    // Actions
    toggleAutoRefresh,
    manualRefresh,
    assignMeterWithValidation,
    createMeter,
    adminTopup,
    fetchAllData,
    
    // Setters
    setChartPeriod,
    setSelectedChartMeter,
    setUsers,
    setMeters,
    setTransactions,
    setUnassignedMeters
  };
};