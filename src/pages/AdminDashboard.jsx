import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  LogOut
} from 'lucide-react';

const AdminPortal = () => {
  const { user, logout } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [meters, setMeters] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedMeters, setUnassignedMeters] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });

  // Simulated API calls (replace with actual API calls to your Flask backend)
  const API_BASE = 'http://localhost:5000/api';

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    return fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth('/admin/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeters = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/admin/meters');
      const data = await response.json();
      if (data.success) {
        setMeters(data.meters);
      }
    } catch (error) {
      console.error('Failed to fetch meters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = `/admin/transactions?limit=${pagination.limit}&offset=${pagination.offset}${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}`;
      const response = await fetchWithAuth(url);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
        setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedMeters = async () => {
    try {
      const response = await fetchWithAuth('/admin/meters/unassigned');
      const data = await response.json();
      if (data.success) {
        // Handle both possible response structures
        setUnassignedMeters(data.unassigned_meters || data.meters || []);
      } else {
        setUnassignedMeters([]);
      }
    } catch (error) {
      console.error('Failed to fetch unassigned meters:', error);
      setUnassignedMeters([]);
    }
  };

  const assignMeter = async (userId, deviceId, nickname = '') => {
    try {
      const response = await fetchWithAuth('/admin/assign-meter', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, device_id: deviceId, nickname }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Meter assigned successfully!');
        fetchMeters();
        fetchUnassignedMeters();
        setShowAssignModal(false);
      } else {
        alert('Failed to assign meter: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to assign meter:', error);
      alert('Failed to assign meter');
    }
  };

  const createMeter = async (deviceId) => {
    try {
      const response = await fetchWithAuth('/admin/meters/create', {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Meter created successfully!');
        fetchMeters();
        fetchUnassignedMeters();
        setShowMeterModal(false);
      } else {
        alert('Failed to create meter: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to create meter:', error);
      alert('Failed to create meter');
    }
  };

  const completeTransaction = async (transactionId) => {
    try {
      const response = await fetchWithAuth('/admin/transactions/complete', {
        method: 'POST',
        body: JSON.stringify({ transaction_id: transactionId }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Transaction completed successfully!');
        fetchTransactions();
        fetchStats();
      } else {
        alert('Failed to complete transaction: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to complete transaction:', error);
      alert('Failed to complete transaction');
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'meters') {
      fetchMeters();
      fetchUnassignedMeters();
    }
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, filterStatus, pagination.offset]);

  // UI Components
  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </button>
  );

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  const UserModal = () => (
    <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="User Details">
      {selectedUser && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <p className="text-gray-900 dark:text-white">{selectedUser.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <p className="text-gray-900 dark:text-white">{selectedUser.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{selectedUser.email || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meters
            </label>
            <p className="text-gray-900 dark:text-white">{selectedUser.meter_count} meters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedUser.is_admin 
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {selectedUser.is_admin ? 'Admin' : 'User'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Created
            </label>
            <p className="text-gray-900 dark:text-white">
              {new Date(selectedUser.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );

  const MeterModal = () => {
    const [newDeviceId, setNewDeviceId] = useState('');
    
    return (
      <Modal isOpen={showMeterModal} onClose={() => setShowMeterModal(false)} title="Create New Meter">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device ID
            </label>
            <input
              type="text"
              value={newDeviceId}
              onChange={(e) => setNewDeviceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter device ID (e.g., METER001)"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => createMeter(newDeviceId)}
              disabled={!newDeviceId}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Meter
            </button>
            <button
              onClick={() => setShowMeterModal(false)}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  const AssignMeterModal = () => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedMeterDevice, setSelectedMeterDevice] = useState('');
    const [nickname, setNickname] = useState('');
    
    return (
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Meter to User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Meter
            </label>
            <select
              value={selectedMeterDevice}
              onChange={(e) => setSelectedMeterDevice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Choose a meter...</option>
              {unassignedMeters?.map(meter => (
                <option key={meter.device_id} value={meter.device_id}>
                  {meter.device_id}
                </option>
              )) || []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nickname (Optional)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Home Meter, Office Meter"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => assignMeter(selectedUserId, selectedMeterDevice, nickname)}
              disabled={!selectedUserId || !selectedMeterDevice}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Assign Meter
            </button>
            <button
              onClick={() => setShowAssignModal(false)}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  const DataTable = ({ columns, data, onRowClick }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : ""}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Dashboard content
  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users?.toLocaleString() || '0'}
          icon={Users}
          color="bg-blue-600"
          trend="+12% from last month"
        />
        <StatCard
          title="Total Meters"
          value={stats.total_meters?.toLocaleString() || '0'}
          icon={Zap}
          color="bg-green-600"
          trend="+5% from last month"
        />
        <StatCard
          title="Total Transactions"
          value={stats.total_transactions?.toLocaleString() || '0'}
          icon={Activity}
          color="bg-purple-600"
          trend="+18% from last month"
        />
        <StatCard
          title="Units Sold Today"
          value={stats.units_sold_today?.toLocaleString() || '0'}
          icon={DollarSign}
          color="bg-orange-600"
          trend="+8% from yesterday"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending Transactions:</span>
              <span className="font-medium text-orange-600">{stats.pending_transactions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transactions Today:</span>
              <span className="font-medium text-green-600">{stats.transactions_today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Units Sold:</span>
              <span className="font-medium text-blue-600">{stats.total_units_sold?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Units Remaining:</span>
              <span className="font-medium text-purple-600">{stats.total_units_remaining?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700 dark:text-gray-300">API Status: Online</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700 dark:text-gray-300">Database: Connected</span>
            </div>
            <div className="flex items-center">
              {stats.pending_transactions > 0 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              )}
              <span className="text-gray-700 dark:text-gray-300">
                Pending Queue: {stats.pending_transactions || 0} items
              </span>
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
            <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
            <div className="text-gray-500 dark:text-gray-400">@{user.username}</div>
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
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {user.is_admin ? 'Admin' : 'User'}
          </span>
        )
      },
      {
        header: 'Meters',
        key: 'meter_count',
        render: (user) => (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <DataTable
              columns={userColumns}
              data={filteredUsers}
              onRowClick={(user) => {
                setSelectedUser(user);
                setShowUserModal(true);
              }}
            />
          )}
        </div>
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
          <div className="font-medium text-gray-900 dark:text-white">{meter.device_id}</div>
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
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : meter.units_left > 20
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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
      }
    ];

    const filteredMeters = meters.filter(meter =>
      meter.device_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meter Management</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search meters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Meter
            </button>
            <button
              onClick={() => setShowMeterModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Meter
            </button>
            <button
              onClick={() => {
                fetchMeters();
                fetchUnassignedMeters();
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Meters</h3>
            <p className="text-2xl font-bold text-blue-600">{meters.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unassigned</h3>
            <p className="text-2xl font-bold text-orange-600">{unassignedMeters?.length || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Units</h3>
            <p className="text-2xl font-bold text-red-600">
              {meters.filter(m => (m.units_left || 0) < 20).length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <DataTable columns={meterColumns} data={filteredMeters} />
          )}
        </div>
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
            <div className="font-medium text-gray-900 dark:text-white">{transaction.user_name}</div>
            <div className="text-gray-500 dark:text-gray-400">@{transaction.username}</div>
          </div>
        )
      },
      {
        header: 'Meter',
        key: 'device_id',
        render: (transaction) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{transaction.device_id}</div>
            {transaction.nickname && (
              <div className="text-gray-500 dark:text-gray-400">{transaction.nickname}</div>
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
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
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
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : transaction.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                completeTransaction(transaction.id);
              }}
              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
            >
              Complete
            </button>
          )
        )
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Management</h2>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={fetchTransactions}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</h3>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_transactions || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</h3>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending_transactions || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</h3>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.transactions_today || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Units Sold</h3>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_units_sold?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <>
              <DataTable columns={transactionColumns} data={transactions} />
              {pagination.total > pagination.limit && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                      disabled={pagination.offset === 0}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                      disabled={pagination.offset + pagination.limit >= pagination.total}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'meters', label: 'Meters', icon: Zap },
    { id: 'transactions', label: 'Transactions', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Smart Meter Management System</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </div>

        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'users' && <UsersContent />}
        {activeTab === 'meters' && <MetersContent />}
        {activeTab === 'transactions' && <TransactionsContent />}

        <UserModal />
        <MeterModal />
        <AssignMeterModal />
      </div>
    </div>
  );
};

export default AdminPortal;