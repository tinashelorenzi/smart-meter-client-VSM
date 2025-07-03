import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Settings,
  LogOut,
  Bell,
  Shield,
  Activity,
  Database,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const systemStats = [
    {
      title: 'Total Users',
      value: '1,250',
      change: '+12%',
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      title: 'Active Meters',
      value: '2,100',
      change: '+8%',
      icon: <Zap className="w-6 h-6" />,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      title: 'Revenue Today',
      value: 'R45,230',
      change: '+24%',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      title: 'Pending Issues',
      value: '23',
      change: '-15%',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10'
    }
  ];

  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', meters: 2, status: 'active', joined: '2025-07-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', meters: 1, status: 'active', joined: '2025-06-30' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', meters: 3, status: 'pending', joined: '2025-06-29' },
  ];

  const systemAlerts = [
    { id: 1, type: 'warning', message: 'High usage detected on METER045', time: '5 min ago' },
    { id: 2, type: 'info', message: 'New user registration: Alice Brown', time: '12 min ago' },
    { id: 3, type: 'error', message: 'Payment failed for user: @username123', time: '25 min ago' },
  ];

  const quickActions = [
    { title: 'Create User', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
    { title: 'Add Meter', icon: <Zap className="w-5 h-5" />, color: 'bg-green-500' },
    { title: 'Generate Report', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-purple-500' },
    { title: 'System Settings', icon: <Settings className="w-5 h-5" />, color: 'bg-gray-500' },
  ];

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
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">Welcome back, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-button p-3 relative"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
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
          {systemStats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-slate-400 text-sm">{stat.title}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card hover:bg-white/10 transition-all duration-300 p-6 text-center"
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  {action.icon}
                </div>
                <span className="text-white font-medium">{action.title}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Users */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="glass-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Recent Users</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-sm"
                >
                  View All
                </motion.button>
              </div>

              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-4 glass rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{user.name}</h3>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-white font-bold">{user.meters}</div>
                        <div className="text-slate-400 text-xs">Meters</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-400/20 text-green-400' 
                          : 'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {user.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* System Status */}
            <div className="glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">API Server</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Database</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Payment Gateway</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-400 text-sm">Warning</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="glass-card">
              <h3 className="text-xl font-semibold text-white mb-4">System Alerts</h3>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 glass rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'error' ? 'bg-red-400' :
                      alert.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{alert.message}</p>
                      <p className="text-slate-400 text-xs mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Today's Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">New Registrations</span>
                  <span className="text-white font-bold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Transactions</span>
                  <span className="text-white font-bold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Support Tickets</span>
                  <span className="text-white font-bold">8</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;