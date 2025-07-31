import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { 
  Users, 
  Zap, 
  Activity, 
  DollarSign, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Download,
  RefreshCw,
  UserPlus,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  LogOut,
  CreditCard,
  Minus,
  Info,
  Loader2,
  Wifi,
  WifiOff,
  Play,
  Pause
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [meterDetails, setMeterDetails] = useState(null);
  const [topupData, setTopupData] = useState({ units: '', notes: '' });
  const [processingTopup, setProcessingTopup] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });

  // Use the custom hook for data management with modal controls
  const {
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
  } = useAdminDashboard();

  // Fetch meter details for admin top-up
  const fetchMeterDetails = async (deviceId) => {
    try {
      const meter = meters.find(m => m.device_id === deviceId);
      if (meter) {
        setMeterDetails({
          meter_data: meter,
          assigned_users: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch meter details:', error);
      toast.error('Failed to fetch meter details');
    }
  };

  // Handle admin top-up
  const handleAdminTopup = async () => {
    if (!selectedMeter || !topupData.units) {
      toast.error('Please enter a valid amount');
      return;
    }

    const units = parseInt(topupData.units);
    if (isNaN(units) || units === 0) {
      toast.error('Please enter a valid non-zero amount');
      return;
    }

    if (units < -10000 || units > 10000) {
      toast.error('Amount must be between -10000 and +10000');
      return;
    }

    setProcessingTopup(true);
    try {
      const result = await adminTopup(selectedMeter.device_id, units, topupData.notes);
      if (result.success) {
        setShowTopupModal(false);
        setTopupData({ units: '', notes: '' });
        setSelectedMeter(null);
        setMeterDetails(null);
        unregisterModal('topup');
      }
    } catch (error) {
      console.error('Failed to process admin top-up:', error);
    } finally {
      setProcessingTopup(false);
    }
  };

  // Open top-up modal
  const openTopupModal = async (meter) => {
    setSelectedMeter(meter);
    setShowTopupModal(true);
    registerModal('topup');
    await fetchMeterDetails(meter.device_id);
  };

  // Enhanced meter assignment with validation
  const handleAssignMeter = async (userId, deviceId, nickname = '') => {
    try {
      const result = await assignMeterWithValidation(userId, deviceId, nickname);
      if (result.success) {
        setShowAssignModal(false);
        unregisterModal('assign');
      }
    } catch (error) {
      console.error('Failed to assign meter:', error);
    }
  };

  // Create new meter
  const handleCreateMeter = async (deviceId) => {
    try {
      const result = await createMeter(deviceId);
      if (result.success) {
        setShowMeterModal(false);
        unregisterModal('meter');
      }
    } catch (error) {
      console.error('Failed to create meter:', error);
    }
  };

  // Complete transaction
  const completeTransaction = async (transactionId) => {
    try {
      const response = await fetch(`/api/admin/transactions/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: transactionId }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Transaction completed successfully!');
        manualRefresh();
      } else {
        toast.error('Failed to complete transaction: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to complete transaction:', error);
      toast.error('Failed to complete transaction');
    }
  };

  // UI Components
  const StatCard = ({ title, value, icon: Icon, color, trend, loading: cardLoading = false }) => (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-card border border-white/10"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          {cardLoading ? (
            <div className="flex items-center space-x-2 mt-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span className="text-slate-400">Loading...</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-white mt-1">{value?.toLocaleString() || '0'}</p>
          )}
          {trend && !cardLoading && (
            <p className="text-sm text-green-400 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const TabButton = ({ id, label, icon: Icon, isActive, onClick, badge }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 relative ${
        isActive
          ? 'bg-primary-600 text-white shadow-lg'
          : 'text-slate-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
      {badge && (
        <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
          {badge}
        </span>
      )}
    </motion.button>
  );

  const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", showCloseButton = true }) => {
    if (!isOpen) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`glass-card ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}
          >
            {(title || showCloseButton) && (
              <div className="flex justify-between items-center mb-6">
                {title && (
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                )}
                {showCloseButton && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  >
                    <XCircle className="w-6 h-6" />
                  </motion.button>
                )}
              </div>
            )}
            <div className={title || showCloseButton ? '' : 'pt-6'}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Connection Status Indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {connectionStatus === 'connected' ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : connectionStatus === 'connecting' ? (
          <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span className={`text-sm ${
          connectionStatus === 'connected' ? 'text-green-400' : 
          connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {connectionStatus === 'connected' ? 'Connected' : 
           connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>
      
      {lastRefresh && (
        <span className="text-xs text-slate-500">
          Last: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
      
      {refreshError && (
        <AlertTriangle className="w-4 h-4 text-red-400" title={refreshError} />
      )}
    </div>
  );

  // Fixed AdminTopupModal Component - Memoized to prevent re-renders
  const AdminTopupModal = React.memo(() => {
    // Local state for form data to prevent external interference
    const [localTopupData, setLocalTopupData] = useState({ units: '', notes: '' });
    
    // Reset form data when modal opens
    useEffect(() => {
      if (showTopupModal) {
        registerModal('topup');
        // Reset local form data when modal opens
        setLocalTopupData({ units: '', notes: '' });
        return () => unregisterModal('topup');
      }
    }, [showTopupModal]); // Only depend on showTopupModal state

    // Memoize the close handler to prevent re-renders
    const handleClose = useCallback(() => {
      setShowTopupModal(false);
      setSelectedMeter(null);
      setMeterDetails(null);
      setLocalTopupData({ units: '', notes: '' });
      unregisterModal('topup');
    }, []);

    // Memoize the submit handler
    const handleSubmit = useCallback(async () => {
      if (!selectedMeter || !localTopupData.units) {
        toast.error('Please enter a valid amount');
        return;
      }

      const units = parseInt(localTopupData.units);
      if (isNaN(units) || units === 0) {
        toast.error('Please enter a valid non-zero amount');
        return;
      }

      if (units < -10000 || units > 10000) {
        toast.error('Amount must be between -10000 and +10000');
        return;
      }

      setProcessingTopup(true);
      try {
        const result = await adminTopup(selectedMeter.device_id, units, localTopupData.notes);
        if (result.success) {
          handleClose();
        }
      } catch (error) {
        console.error('Top-up failed:', error);
      } finally {
        setProcessingTopup(false);
      }
    }, [selectedMeter, localTopupData, adminTopup, handleClose]);

    return (
      <Modal 
        isOpen={showTopupModal} 
        onClose={handleClose}
        title="Admin Meter Top-up / Deduction"
        maxWidth="max-w-lg"
      >
        {selectedMeter && (
          <div className="space-y-6">
            {/* Meter Information */}
            <div className="glass rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Meter Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Device ID:</span>
                  <p className="font-medium text-white">{selectedMeter.device_id}</p>
                </div>
                <div>
                  <span className="text-slate-400">Current Usage:</span>
                  <p className="font-medium text-white">{selectedMeter.kw_usage || 0} kW</p>
                </div>
                <div>
                  <span className="text-slate-400">Units Left:</span>
                  <p className="font-medium text-white">{selectedMeter.units_left || 0} units</p>
                </div>
                <div>
                  <span className="text-slate-400">Pending Units:</span>
                  <p className="font-medium text-white">{selectedMeter.pending_units || 0} units</p>
                </div>
              </div>
            </div>

            {/* Top-up Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Units Amount
                </label>
                <input
                  type="number"
                  value={localTopupData.units}
                  onChange={(e) => setLocalTopupData(prev => ({ ...prev, units: e.target.value }))}
                  onFocus={() => setUserInteraction(true)}
                  onBlur={() => setUserInteraction(false)}
                  placeholder="Enter amount (positive to add, negative to deduct)"
                  className="input-field w-full"
                  min="-10000"
                  max="10000"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Range: -10,000 to +10,000 units. Use negative values for deductions.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={localTopupData.notes}
                  onChange={(e) => setLocalTopupData(prev => ({ ...prev, notes: e.target.value }))}
                  onFocus={() => setUserInteraction(true)}
                  onBlur={() => setUserInteraction(false)}
                  placeholder="Enter reason for this adjustment..."
                  className="input-field w-full"
                  rows="3"
                  maxLength="500"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quick Amounts
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setLocalTopupData(prev => ({ ...prev, units: amount.toString() }))}
                      className="px-3 py-2 text-sm glass-button hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[-50, -100, -200, -500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setLocalTopupData(prev => ({ ...prev, units: amount.toString() }))}
                      className="px-3 py-2 text-sm glass-button hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={handleClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={processingTopup || !localTopupData.units}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {processingTopup ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {localTopupData.units && parseInt(localTopupData.units) < 0 ? 'Deduct' : 'Top Up'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    );
  });

  // Fixed ChartsModal Component
  const ChartsModal = () => {
    useEffect(() => {
      if (showChartsModal) {
        registerModal('charts');
        return () => unregisterModal('charts');
      }
    }, [showChartsModal]); // Only depend on showChartsModal state

    return (
      <Modal 
        isOpen={showChartsModal} 
        onClose={() => {
          setShowChartsModal(false);
          unregisterModal('charts');
        }} 
        title="Usage Analytics & Charts"
        maxWidth="max-w-6xl"
      >
        <div className="space-y-6">
          {/* Chart Controls */}
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-white">System Analytics</h4>
            <div className="flex items-center space-x-3">
              <select
                value={selectedChartMeter}
                onChange={(e) => setSelectedChartMeter(e.target.value)}
                onFocus={() => setUserInteraction(true)}
                onBlur={() => setUserInteraction(false)}
                className="input-field text-sm"
              >
                <option value="all">All Meters</option>
                {meters.map(meter => (
                  <option key={meter.device_id} value={meter.device_id}>
                    {meter.device_id}
                  </option>
                ))}
              </select>
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                onFocus={() => setUserInteraction(true)}
                onBlur={() => setUserInteraction(false)}
                className="input-field text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Main Usage Chart */}
          <div className="glass rounded-xl p-6">
            <h5 className="text-white font-medium mb-4">Usage Analytics</h5>
            {chartLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="period" 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(103, 122, 229, 0.3)',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avg_usage" 
                      stroke="#677AE5" 
                      strokeWidth={2}
                      name="Avg Usage (kW)"
                      dot={{ fill: '#677AE5', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="units_purchased" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Units Purchased"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Volume Chart */}
            <div className="glass rounded-xl p-6">
              <h5 className="text-white font-medium mb-4">Transaction Volume</h5>
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(103, 122, 229, 0.3)',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="transaction_count" fill="#677AE5" name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Units Overview Chart */}
            <div className="glass rounded-xl p-6">
              <h5 className="text-white font-medium mb-4">Units Overview</h5>
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(103, 122, 229, 0.3)',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="units_purchased" fill="#10B981" name="Units Purchased" />
                      <Bar dataKey="units_deducted" fill="#EF4444" name="Units Deducted" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Chart Summary */}
          <div className="glass rounded-xl p-6">
            <h5 className="text-white font-medium mb-4">Summary Statistics</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {chartData.reduce((sum, item) => sum + (item.avg_usage || 0), 0).toFixed(1)}
                </div>
                <div className="text-slate-400 text-sm">Total Avg Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {chartData.reduce((sum, item) => sum + (item.units_purchased || 0), 0)}
                </div>
                <div className="text-slate-400 text-sm">Units Purchased</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {chartData.reduce((sum, item) => sum + (item.units_deducted || 0), 0)}
                </div>
                <div className="text-slate-400 text-sm">Units Deducted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {chartData.reduce((sum, item) => sum + (item.transaction_count || 0), 0)}
                </div>
                <div className="text-slate-400 text-sm">Total Transactions</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // Fixed UserModal Component
  const UserModal = () => {
    useEffect(() => {
      if (showUserModal) {
        registerModal('user');
        return () => unregisterModal('user');
      }
    }, [showUserModal]); // Only depend on showUserModal state

    return (
      <Modal 
        isOpen={showUserModal} 
        onClose={() => {
          setShowUserModal(false);
          unregisterModal('user');
        }} 
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <p className="text-white">{selectedUser.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <p className="text-white">{selectedUser.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <p className="text-white">{selectedUser.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Meters</label>
              <p className="text-white">{selectedUser.meter_count} meters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedUser.is_admin 
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {selectedUser.is_admin ? 'Admin' : 'User'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Created</label>
              <p className="text-white">
                {new Date(selectedUser.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    );
  };

  // Fixed MeterModal Component
  const MeterModal = () => {
    const [newDeviceId, setNewDeviceId] = useState('');
    
    useEffect(() => {
      if (showMeterModal) {
        registerModal('meter');
        return () => unregisterModal('meter');
      }
    }, [showMeterModal]); // Only depend on showMeterModal state
    
    return (
      <Modal 
        isOpen={showMeterModal} 
        onClose={() => {
          setShowMeterModal(false);
          unregisterModal('meter');
        }} 
        title="Create New Meter"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Device ID</label>
            <input
              type="text"
              value={newDeviceId}
              onChange={(e) => setNewDeviceId(e.target.value)}
              onFocus={() => setUserInteraction(true)}
              onBlur={() => setUserInteraction(false)}
              className="input-field w-full"
              placeholder="Enter device ID (e.g., METER001)"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleCreateMeter(newDeviceId)}
              disabled={!newDeviceId}
              className="btn-primary flex-1"
            >
              Create Meter
            </button>
            <button
              onClick={() => {
                setShowMeterModal(false);
                unregisterModal('meter');
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Fixed AssignMeterModal Component
  const AssignMeterModal = () => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedMeterDevice, setSelectedMeterDevice] = useState('');
    const [nickname, setNickname] = useState('');
    const [assignmentError, setAssignmentError] = useState('');
    
    useEffect(() => {
      if (showAssignModal) {
        registerModal('assign');
        return () => unregisterModal('assign');
      }
    }, [showAssignModal]); // Only depend on showAssignModal state
    
    const handleAssignSubmit = async () => {
      if (!selectedUserId || !selectedMeterDevice) {
        setAssignmentError('Please select both user and meter');
        return;
      }

      // Client-side validation: Check if meter is already assigned
      const isAssigned = meters.some(meter => 
        meter.device_id === selectedMeterDevice && meter.user_count > 0
      );

      if (isAssigned) {
        setAssignmentError('This meter is already assigned to another user. Please choose an unassigned meter.');
        return;
      }

      setAssignmentError('');
      await handleAssignMeter(selectedUserId, selectedMeterDevice, nickname);
    };
    
    return (
      <Modal 
        isOpen={showAssignModal} 
        onClose={() => {
          setShowAssignModal(false);
          unregisterModal('assign');
        }} 
        title="Assign Meter to User"
      >
        <div className="space-y-4">
          {assignmentError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {assignmentError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              onFocus={() => setUserInteraction(true)}
              onBlur={() => setUserInteraction(false)}
              className="input-field w-full"
            >
              <option value="">Choose a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.username})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Meter</label>
            <select
              value={selectedMeterDevice}
              onChange={(e) => setSelectedMeterDevice(e.target.value)}
              onFocus={() => setUserInteraction(true)}
              onBlur={() => setUserInteraction(false)}
              className="input-field w-full"
            >
              <option value="">Choose a meter...</option>
              {unassignedMeters?.map(meter => (
                <option key={meter.device_id} value={meter.device_id}>
                  {meter.device_id} (Unassigned)
                </option>
              )) || []}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Only unassigned meters are shown. Assigned meters: {meters.filter(m => m.user_count > 0).length}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nickname (Optional)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onFocus={() => setUserInteraction(true)}
              onBlur={() => setUserInteraction(false)}
              className="input-field w-full"
              placeholder="e.g., Home Meter, Office Meter"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAssignSubmit}
              disabled={!selectedUserId || !selectedMeterDevice}
              className="btn-primary flex-1"
            >
              Assign Meter
            </button>
            <button
              onClick={() => {
                setShowAssignModal(false);
                unregisterModal('assign');
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  const DataTable = ({ columns, data, onRowClick, isLoading = false }) => (
    <div className="glass rounded-xl overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {data.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Dashboard content
  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={Users}
          color="bg-blue-600"
          trend="+12% from last month"
          loading={loading}
        />
        <StatCard
          title="Total Meters"
          value={stats.total_meters}
          icon={Zap}
          color="bg-green-600"
          trend="+5% from last month"
          loading={loading}
        />
        <StatCard
          title="Total Transactions"
          value={stats.total_transactions}
          icon={Activity}
          color="bg-purple-600"
          trend="+18% from last month"
          loading={loading}
        />
        <StatCard
          title="Units Sold Today"
          value={stats.units_sold_today}
          icon={DollarSign}
          color="bg-orange-600"
          trend="+8% from yesterday"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Pending Transactions:</span>
              <span className="font-medium text-orange-400">{stats.pending_transactions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transactions Today:</span>
              <span className="font-medium text-green-400">{stats.transactions_today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Units Sold:</span>
              <span className="font-medium text-blue-400">{stats.total_units_sold?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Units Remaining:</span>
              <span className="font-medium text-purple-400">{stats.total_units_remaining?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">System Health</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChartsModal(true)}
              className="btn-primary flex items-center text-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Charts
            </motion.button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-slate-300">API Status: Online</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-slate-300">Database: Connected</span>
            </div>
            <div className="flex items-center">
              {stats.pending_transactions > 0 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              )}
              <span className="text-slate-300">
                Pending Queue: {stats.pending_transactions || 0} items
              </span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <ConnectionStatus />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Users management content
  const UsersContent = () => {
    const userColumns = [
      {
        header: 'User',
        key: 'name',
        render: (user) => (
          <div>
            <div className="font-medium text-white">{user.name}</div>
            <div className="text-slate-400">@{user.username}</div>
          </div>
        )
      },
      {
        header: 'Email',
        key: 'email',
        render: (user) => user.email || 'Not provided'
      },
      {
        header: 'Role',
        key: 'is_admin',
        render: (user) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.is_admin 
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-slate-700 text-slate-300'
          }`}>
            {user.is_admin ? 'Admin' : 'User'}
          </span>
        )
      },
      {
        header: 'Meters',
        key: 'meter_count',
        render: (user) => (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
            {user.meter_count} meters
          </span>
        )
      },
      {
        header: 'Created',
        key: 'created_at',
        render: (user) => new Date(user.created_at).toLocaleDateString()
      }
    ];

    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setUserInteraction(true)}
                onBlur={() => setUserInteraction(false)}
                className="input-field pl-10"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={manualRefresh}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>

        <DataTable
          columns={userColumns}
          data={filteredUsers}
          onRowClick={(user) => {
            setSelectedUser(user);
            setShowUserModal(true);
          }}
          isLoading={loading}
        />
      </div>
    );
  };

  // Meters management content
  const MetersContent = () => {
    const meterColumns = [
      {
        header: 'Device ID',
        key: 'device_id',
        render: (meter) => (
          <div className="font-medium text-white">{meter.device_id}</div>
        )
      },
      {
        header: 'Current Usage',
        key: 'kw_usage',
        render: (meter) => `${meter.kw_usage || 0} kW`
      },
      {
        header: 'Units Left',
        key: 'units_left',
        render: (meter) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            meter.units_left > 50 
              ? 'bg-green-500/20 text-green-400'
              : meter.units_left > 20
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
          }`}>
            {meter.units_left || 0} units
          </span>
        )
      },
      {
        header: 'Pending',
        key: 'pending_units',
        render: (meter) => `${meter.pending_units || 0} units`
      },
      {
        header: 'Users',
        key: 'user_count',
        render: (meter) => `${meter.user_count || 0} users`
      },
      {
        header: 'Last Update',
        key: 'last_update',
        render: (meter) => meter.last_update || 'Never'
      },
      {
        header: 'Actions',
        key: 'actions',
        render: (meter) => (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                openTopupModal(meter);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
              title="Admin Top-up/Deduction"
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Top-up
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowChartsModal(true);
              }}
              className="bg-slate-600 text-white px-3 py-1 rounded text-xs hover:bg-slate-700 transition-colors flex items-center"
              title="View Analytics"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Charts
            </motion.button>
          </div>
        )
      }
    ];

    const filteredMeters = meters.filter(meter =>
      meter.device_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Meter Management</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search meters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setUserInteraction(true)}
                onBlur={() => setUserInteraction(false)}
                className="input-field pl-10"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAssignModal(true)}
              className="btn-primary flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Meter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowMeterModal(true)}
              className="btn-secondary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Meter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={manualRefresh}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Meters"
            value={meters.length}
            icon={Zap}
            color="bg-blue-600"
            loading={loading}
          />
          <StatCard
            title="Unassigned"
            value={unassignedMeters?.length || 0}
            icon={AlertTriangle}
            color="bg-orange-600"
            loading={loading}
          />
          <StatCard
            title="Low Units"
            value={meters.filter(m => (m.units_left || 0) < 20).length}
            icon={AlertTriangle}
            color="bg-red-600"
            loading={loading}
          />
        </div>

        <DataTable 
          columns={meterColumns} 
          data={filteredMeters} 
          isLoading={loading}
        />
      </div>
    );
  };

  // Transactions content
  const TransactionsContent = () => {
    const transactionColumns = [
      {
        header: 'ID',
        key: 'id'
      },
      {
        header: 'User',
        key: 'user_name',
        render: (transaction) => (
          <div>
            <div className="font-medium text-white">{transaction.user_name}</div>
            <div className="text-slate-400">@{transaction.username}</div>
          </div>
        )
      },
      {
        header: 'Meter',
        key: 'device_id',
        render: (transaction) => (
          <div>
            <div className="font-medium text-white">{transaction.device_id}</div>
            {transaction.nickname && (
              <div className="text-slate-400">{transaction.nickname}</div>
            )}
          </div>
        )
      },
      {
        header: 'Units',
        key: 'units',
        render: (transaction) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            transaction.is_negative
              ? 'bg-red-500/20 text-red-400'
              : 'bg-green-500/20 text-green-400'
          }`}>
            {transaction.is_negative ? '-' : '+'}{Math.abs(transaction.units)} units
          </span>
        )
      },
      {
        header: 'Status',
        key: 'status',
        render: (transaction) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            transaction.status === 'completed'
              ? 'bg-green-500/20 text-green-400'
              : transaction.status === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
          }`}>
            {transaction.status}
          </span>
        )
      },
      {
        header: 'Date',
        key: 'timestamp'
      },
      {
        header: 'Actions',
        key: 'actions',
        render: (transaction) => (
          transaction.status === 'pending' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                completeTransaction(transaction.id);
              }}
              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
            >
              Complete
            </motion.button>
          )
        )
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Transaction Management</h2>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              onFocus={() => setUserInteraction(true)}
              onBlur={() => setUserInteraction(false)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={manualRefresh}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total"
            value={stats.total_transactions}
            icon={Activity}
            color="bg-blue-600"
            loading={loading}
          />
          <StatCard
            title="Pending"
            value={stats.pending_transactions}
            icon={Clock}
            color="bg-yellow-600"
            loading={loading}
          />
          <StatCard
            title="Today"
            value={stats.transactions_today}
            icon={CheckCircle}
            color="bg-green-600"
            loading={loading}
          />
          <StatCard
            title="Units Sold"
            value={stats.total_units_sold}
            icon={DollarSign}
            color="bg-purple-600"
            loading={loading}
          />
        </div>

        <DataTable 
          columns={transactionColumns} 
          data={transactions} 
          isLoading={loading}
        />

        {pagination.total > pagination.limit && (
          <div className="glass-card p-4 flex justify-between items-center">
            <span className="text-sm text-slate-300">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
            </span>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Next
              </motion.button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'meters', label: 'Meters', icon: Zap },
    { id: 'transactions', label: 'Transactions', icon: Activity, badge: stats.pending_transactions > 0 ? stats.pending_transactions : null },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center glow-primary">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                <p className="text-slate-400 text-sm">Smart Meter Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleAutoRefresh}
                className={`glass-button p-3 ${isAutoRefreshActive ? 'text-green-400' : 'text-slate-400'}`}
                title={isAutoRefreshActive ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                {isAutoRefreshActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={manualRefresh}
                disabled={loading}
                className="glass-button p-3"
                title="Manual refresh"
              >
                <RefreshCw className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={setActiveTab}
              badge={tab.badge}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'users' && <UsersContent />}
            {activeTab === 'meters' && <MetersContent />}
            {activeTab === 'transactions' && <TransactionsContent />}
          </motion.div>
        </AnimatePresence>

        {/* Modals */}
        <UserModal />
        <MeterModal />
        <AssignMeterModal />
        <AdminTopupModal />
        <ChartsModal />
      </div>
    </div>
  );
};

export default AdminDashboard;