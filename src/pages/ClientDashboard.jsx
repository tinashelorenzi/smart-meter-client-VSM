import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { meterAPI } from '../services/api';
import { usePolling } from '../hooks/useApi';
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Battery, 
  Plus,
  Settings,
  LogOut,
  Bell,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Activity,
  RefreshCw,
  Eye,
  Loader2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/helpers';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [meters, setMeters] = useState([]);
  const [loadingMeters, setLoadingMeters] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showAddMeterModal, setShowAddMeterModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processingTopUp, setProcessingTopUp] = useState(false);
  const [addingMeter, setAddingMeter] = useState(false);
  const [newMeterData, setNewMeterData] = useState({ device_id: '', nickname: '' });

  // Fetch user meters
  const fetchMeters = useCallback(async () => {
    try {
      setLoadingMeters(true);
      const response = await meterAPI.getUserMeters();
      if (response.success) {
        setMeters(response.meters || []);
      }
    } catch (error) {
      toast.error('Failed to fetch meter data');
      console.error('Fetch meters error:', error);
    } finally {
      setLoadingMeters(false);
    }
  }, []);

  // Real-time polling for meter updates
  const { data: pollingData, startPolling, stopPolling } = usePolling(
    meterAPI.getUserMeters,
    30000 // Poll every 30 seconds
  );

  // Update meters when polling data changes
  useEffect(() => {
    if (pollingData?.success && pollingData.meters) {
      setMeters(pollingData.meters);
    }
  }, [pollingData]);

  // Initial load
  useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMeters();
    setTimeout(() => setRefreshing(false), 500); // Small delay for UX
    toast.success('Data refreshed');
  };

  // Process top-up
  const handleTopUp = async () => {
    if (!selectedMeter || !topUpAmount) {
      toast.error('Please select a meter and enter amount');
      return;
    }

    const units = parseInt(topUpAmount);
    if (isNaN(units) || units <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessingTopUp(true);
    try {
      const response = await meterAPI.topup({
        device_id: selectedMeter.device_id,
        units: units
      });

      if (response.success) {
        toast.success(`Successfully added ${units} units to ${selectedMeter.nickname}`);
        setShowTopUpModal(false);
        setTopUpAmount('');
        setSelectedMeter(null);
        // Refresh meter data
        await fetchMeters();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Top-up failed. Please try again.';
      toast.error(message);
    } finally {
      setProcessingTopUp(false);
    }
  };

  // Add new meter
  const handleAddMeter = async () => {
    if (!newMeterData.device_id.trim()) {
      toast.error('Please enter a meter ID');
      return;
    }

    setAddingMeter(true);
    try {
      const response = await meterAPI.addMeter({
        device_id: newMeterData.device_id.trim(),
        nickname: newMeterData.nickname.trim() || 'My Meter'
      });

      if (response.success) {
        toast.success(`Meter ${response.device_id} added successfully`);
        setShowAddMeterModal(false);
        setNewMeterData({ device_id: '', nickname: '' });
        // Refresh meter data
        await fetchMeters();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add meter. Please try again.';
      toast.error(message);
    } finally {
      setAddingMeter(false);
    }
  };

  // Calculate summary stats
  const stats = {
    totalUnits: meters.reduce((sum, meter) => sum + (parseFloat(meter.units_left) || 0), 0),
    totalUsage: meters.reduce((sum, meter) => sum + (parseFloat(meter.kw_usage) || 0), 0),
    pendingUnits: meters.reduce((sum, meter) => sum + (parseFloat(meter.pending_units) || 0), 0),
    totalValue: meters.reduce((sum, meter) => sum + (parseFloat(meter.units_left) || 0), 0) // Assuming R1 per unit
  };

  // Quick top-up amounts
  const quickAmounts = [50, 100, 200, 500];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center glow-primary">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Welcome back, {user?.name}</h1>
                <p className="text-slate-400 text-sm">Your Energy Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="glass-button p-3 relative"
              >
                <RefreshCw className={`w-5 h-5 text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-button p-3 relative"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {meters.some(meter => parseFloat(meter.units_left) < 50) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-button p-3"
              >
                <Settings className="w-5 h-5 text-slate-300" />
              </motion.button>
              
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-button p-3 hover:text-red-400"
              >
                <LogOut className="w-5 h-5 text-slate-300" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div whileHover={{ scale: 1.02, y: -5 }} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-400/10 p-3 rounded-xl">
                <Battery className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {stats.totalUnits}
              <span className="text-lg text-slate-400 ml-1">kWh</span>
            </h3>
            <p className="text-slate-400 text-sm">Total Units Remaining</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-400/10 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {stats.totalUsage.toFixed(1)}
              <span className="text-lg text-slate-400 ml-1">kW</span>
            </h3>
            <p className="text-slate-400 text-sm">Current Usage</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-400/10 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {formatCurrency(stats.totalValue)}
            </h3>
            <p className="text-slate-400 text-sm">Total Value</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-400/10 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {stats.pendingUnits}
              <span className="text-lg text-slate-400 ml-1">kWh</span>
            </h3>
            <p className="text-slate-400 text-sm">Pending Units</p>
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Meters Section */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Your Smart Meters</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddMeterModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Meter</span>
              </motion.button>
            </div>

            {loadingMeters ? (
              <div className="glass-card flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
                  <p className="text-slate-400">Loading your meters...</p>
                </div>
              </div>
            ) : meters.length === 0 ? (
              <div className="glass-card text-center py-12">
                <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Meters Found</h3>
                <p className="text-slate-400 mb-6">Add your first smart meter to get started</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddMeterModal(true)}
                  className="btn-primary"
                >
                  Add Your First Meter
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                {meters.map((meter, index) => (
                  <motion.div
                    key={meter.device_id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    whileHover={{ scale: 1.01 }}
                    className="glass-card hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{meter.nickname}</h3>
                        <p className="text-slate-400 text-sm">{meter.device_id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(parseFloat(meter.units_left) || 0) < 50 ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 text-sm font-medium">Low Units</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">Active</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${(parseFloat(meter.units_left) || 0) < 50 ? 'text-red-400' : 'text-white'}`}>
                          {parseFloat(meter.units_left) || 0}
                        </div>
                        <div className="text-slate-400 text-sm">Units Left</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{parseFloat(meter.kw_usage) || 0}</div>
                        <div className="text-slate-400 text-sm">Current kW</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{parseFloat(meter.pending_units) || 0}</div>
                        <div className="text-slate-400 text-sm">Pending</div>
                      </div>
                    </div>

                    {/* Progress bar for units */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Usage Level</span>
                        <span>{(parseFloat(meter.units_left) || 0) > 200 ? 'Excellent' : (parseFloat(meter.units_left) || 0) > 100 ? 'Good' : (parseFloat(meter.units_left) || 0) > 50 ? 'Fair' : 'Critical'}</span>
                      </div>
                      <div className="w-full bg-dark-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            (parseFloat(meter.units_left) || 0) > 100 ? 'bg-green-400' :
                            (parseFloat(meter.units_left) || 0) > 50 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(100, ((parseFloat(meter.units_left) || 0) / 200) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 mb-4">
                      Last updated: {meter.last_update !== 'N/A' ? formatRelativeTime(meter.last_update) : 'Never'}
                    </div>

                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMeter(meter);
                          setShowTopUpModal(true);
                        }}
                        className="btn-primary flex-1 flex items-center justify-center space-x-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Top Up</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-secondary flex items-center justify-center"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-secondary flex items-center justify-center"
                      >
                        <Eye className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Top-up */}
            <div className="glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Top-up</h3>
              <div className="space-y-3">
                {quickAmounts.map((amount) => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (meters.length === 0) {
                        toast.error('Please add a meter first');
                        return;
                      }
                      setSelectedMeter(meters[0]); // Default to first meter
                      setTopUpAmount(amount.toString());
                      setShowTopUpModal(true);
                    }}
                    className="w-full glass-button text-left flex justify-between items-center"
                  >
                    <span className="text-white">{formatCurrency(amount)}</span>
                    <span className="text-slate-400">{amount} units</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Auto-refresh</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Last Update</span>
                  <span className="text-slate-400 text-sm">{formatRelativeTime(new Date())}</span>
                </div>
              </div>
            </div>

            {/* Energy Tips */}
            <div className="glass-card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
              <h3 className="text-xl font-semibold text-white mb-4">💡 Energy Tip</h3>
              <p className="text-slate-300 text-sm mb-3">
                Monitor your usage patterns to identify peak consumption times. Consider using high-energy appliances during off-peak hours to optimize costs.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary text-sm"
              >
                View More Tips
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top-up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTopUpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Top Up Meter</h3>
                <button
                  onClick={() => setShowTopUpModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedMeter && (
                <div className="mb-6">
                  <div className="glass rounded-lg p-4 mb-4">
                    <h4 className="text-white font-medium">{selectedMeter.nickname}</h4>
                    <p className="text-slate-400 text-sm">{selectedMeter.device_id}</p>
                    <p className="text-slate-300 text-sm mt-2">
                      Current balance: <span className="font-bold">{parseFloat(selectedMeter.units_left) || 0} units</span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Amount (Units)
                    </label>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="input-field w-full"
                      min="1"
                      max="1000"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      Cost: {topUpAmount ? formatCurrency(parseInt(topUpAmount) || 0) : formatCurrency(0)}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTopUpAmount(amount.toString())}
                        className={`glass-button text-center py-2 text-sm ${
                          topUpAmount === amount.toString() ? 'bg-primary-500/20 border-primary-500' : ''
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowTopUpModal(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTopUp}
                      disabled={processingTopUp || !topUpAmount}
                      className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    >
                      {processingTopUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Top Up {formatCurrency(parseInt(topUpAmount) || 0)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Meter Modal */}
      <AnimatePresence>
        {showAddMeterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddMeterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Add New Meter</h3>
                <button
                  onClick={() => setShowAddMeterModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Meter ID *
                  </label>
                  <input
                    type="text"
                    value={newMeterData.device_id}
                    onChange={(e) => setNewMeterData(prev => ({ ...prev, device_id: e.target.value }))}
                    placeholder="Enter meter ID (e.g., METER001)"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={newMeterData.nickname}
                    onChange={(e) => setNewMeterData(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="e.g., Home Meter, Office Meter"
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddMeterModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeter}
                  disabled={addingMeter || !newMeterData.device_id.trim()}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {addingMeter ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Meter</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;