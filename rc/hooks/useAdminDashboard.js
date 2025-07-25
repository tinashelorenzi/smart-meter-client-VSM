// Create this as src/hooks/useAdminDashboard.js

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

  // Refs for intervals
  const refreshIntervalRef = useRef(null);
  const chartRefreshRef = useRef(null);

  // Auto-refresh function
  const autoRefreshData = useCallback(async () => {
    if (!isAutoRefreshActive) return;
    
    try {
      setConnectionStatus('connecting');
      const data = await adminAPI.getRefreshData();
      
      if (data.success) {
        setStats(data.stats);
        setTransactions(data.recent_transactions);
        setLastRefresh(new Date());
        setRefreshError(null);
        setConnectionStatus('connected');
        
        // Show notification for critical meters
        if (data.low_units_meters && data.low_units_meters.length > 0) {
          const count = data.low_units_meters.length;
          if (count > 3) { // Only show toast if many meters are critical
            toast.warning(`⚠️ ${count} meters have critically low units`, {
              duration: 5000,
              id: 'low-units-warning' // Prevent duplicate toasts
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
  }, [isAutoRefreshActive]);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      const data = await adminAPI.getUsageAnalytics(chartPeriod, selectedChartMeter);
      
      if (data.success) {
        setChartData(data.chart_data);
      }
    } catch (error) {
      console.error('Chart data fetch error:', error);
      toast.error('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  }, [chartPeriod, selectedChartMeter]);

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
      
      // Trigger auto-refresh
      autoRefreshData();
      
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to assign meter';
      toast.error(message);
      return { success: false, message };
    }
  }, [autoRefreshData]);

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
        
        // Refresh data
        autoRefreshData();
        fetchChartData();
        
        return { success: true };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Admin top-up failed';
      toast.error(message);
      return { success: false, message };
    }
  }, [autoRefreshData, fetchChartData]);

  // Setup auto-refresh
  useEffect(() => {
    if (isAutoRefreshActive) {
      // Initial fetch
      autoRefreshData();
      
      // Set up interval
      refreshIntervalRef.current = setInterval(autoRefreshData, 30000); // 30 seconds
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [isAutoRefreshActive, autoRefreshData]);

  // Setup chart refresh
  useEffect(() => {
    fetchChartData();
    
    // Refresh chart data every 2 minutes
    chartRefreshRef.current = setInterval(fetchChartData, 120000);
    
    return () => {
      if (chartRefreshRef.current) {
        clearInterval(chartRefreshRef.current);
      }
    };
  }, [fetchChartData]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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