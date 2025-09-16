import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Car, 
  DollarSign, 
  Settings, 
  LogOut, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  service_type: 'outstation' | 'mumbai-local';
  from_location: string;
  to_location: string;
  car_type: string;
  travel_date: string;
  travel_time: string;
  estimated_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

interface PromotionalPost {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { admin, pricing, logout, updatePricing, addCity, removeCity, addRoute, updateRoute, deleteRoute } = useAdmin();
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'pricing' | 'promotions'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [promotionalPosts, setPromotionalPosts] = useState<PromotionalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPricing, setEditingPricing] = useState(false);
  const [tempPricing, setTempPricing] = useState(pricing);
  const [newCity, setNewCity] = useState('');
  const [newRoute, setNewRoute] = useState({ from: '', to: '', fourSeater: 0, sixSeater: 0 });
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    display_order: 0
  });
  const [editingPost, setEditingPost] = useState<string | null>(null);

  useEffect(() => {
    if (!admin?.isAuthenticated && !user) {
      navigate('/admin');
      return;
    }
    fetchBookings();
    fetchPromotionalPosts();
  }, [admin, user, navigate]);

  useEffect(() => {
    setTempPricing(pricing);
  }, [pricing]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPromotionalPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_posts')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotionalPosts(data || []);
    } catch (error) {
      console.error('Error fetching promotional posts:', error);
      toast.error('Failed to fetch promotional posts');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: status as any } : booking
      ));
      
      toast.success('Booking status updated');
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleLogout = () => {
    if (admin?.isAuthenticated) {
      logout();
    } else {
      authLogout();
    }
    navigate('/');
  };

  const savePricing = () => {
    updatePricing(tempPricing);
    setEditingPricing(false);
    toast.success('Pricing updated successfully');
  };

  const handleAddCity = () => {
    if (newCity.trim() && !tempPricing.cities.includes(newCity.trim())) {
      addCity(newCity.trim());
      setNewCity('');
      toast.success('City added successfully');
    }
  };

  const handleRemoveCity = (city: string) => {
    removeCity(city);
    toast.success('City removed successfully');
  };

  const handleAddRoute = () => {
    if (newRoute.from && newRoute.to && newRoute.fourSeater > 0 && newRoute.sixSeater > 0) {
      try {
        addRoute(newRoute.from, newRoute.to, newRoute.fourSeater, newRoute.sixSeater);
        setNewRoute({ from: '', to: '', fourSeater: 0, sixSeater: 0 });
        toast.success('Route added successfully');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleUpdateRoute = (routeKey: string) => {
    const route = tempPricing.outstation[routeKey];
    if (route) {
      updateRoute(routeKey, route['4-seater'], route['6-seater']);
      setEditingRoute(null);
      toast.success('Route updated successfully');
    }
  };

  const handleDeleteRoute = (routeKey: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      deleteRoute(routeKey);
      toast.success('Route deleted successfully');
    }
  };

  const createPromotionalPost = async () => {
    try {
      const { error } = await supabase
        .from('promotional_posts')
        .insert([newPost]);

      if (error) throw error;
      
      fetchPromotionalPosts();
      setNewPost({
        title: '',
        description: '',
        image_url: '',
        button_text: '',
        button_link: '',
        display_order: 0
      });
      toast.success('Promotional post created');
    } catch (error) {
      console.error('Error creating promotional post:', error);
      toast.error('Failed to create promotional post');
    }
  };

  const updatePromotionalPost = async (postId: string, updates: Partial<PromotionalPost>) => {
    try {
      const { error } = await supabase
        .from('promotional_posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;
      
      fetchPromotionalPosts();
      setEditingPost(null);
      toast.success('Promotional post updated');
    } catch (error) {
      console.error('Error updating promotional post:', error);
      toast.error('Failed to update promotional post');
    }
  };

  const deletePromotionalPost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this promotional post?')) return;
    
    try {
      const { error } = await supabase
        .from('promotional_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      fetchPromotionalPosts();
      toast.success('Promotional post deleted');
    } catch (error) {
      console.error('Error deleting promotional post:', error);
      toast.error('Failed to delete promotional post');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.estimated_price, 0)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome, {admin?.username || user?.name || 'Administrator'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'bookings', label: 'Bookings', icon: Car },
            { id: 'pricing', label: 'Pricing', icon: DollarSign },
            { id: 'promotions', label: 'Promotions', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.confirmedBookings}</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {bookings.slice(0, 5).map((booking) => {
                      const StatusIcon = getStatusIcon(booking.status);
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.customer_name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{booking.customer_phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{booking.from_location}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">to {booking.to_location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(booking.travel_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            ₹{booking.estimated_price.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Bookings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Travel Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {bookings.map((booking) => {
                    const StatusIcon = getStatusIcon(booking.status);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.customer_name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {booking.customer_phone}
                              </div>
                              {booking.customer_email && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {booking.customer_email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white capitalize">{booking.service_type.replace('-', ' ')}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{booking.car_type}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="text-sm text-gray-900 dark:text-white">{booking.from_location}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">to {booking.to_location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                {new Date(booking.travel_date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{booking.travel_time}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={booking.status}
                            onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-3 py-1 border-0 ${getStatusColor(booking.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="text-gray-900 dark:text-white">₹{booking.estimated_price.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-8">
            {/* Mumbai Local Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mumbai Local Pricing</h3>
                {!editingPricing ? (
                  <button
                    onClick={() => setEditingPricing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Pricing</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={savePricing}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingPricing(false);
                        setTempPricing(pricing);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      4-Seater Rate (₹/km)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.mumbaiLocal.fourSeaterRate}
                      onChange={(e) => setTempPricing({
                        ...tempPricing,
                        mumbaiLocal: {
                          ...tempPricing.mumbaiLocal,
                          fourSeaterRate: Number(e.target.value)
                        }
                      })}
                      disabled={!editingPricing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      6-Seater Rate (₹/km)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.mumbaiLocal.sixSeaterRate}
                      onChange={(e) => setTempPricing({
                        ...tempPricing,
                        mumbaiLocal: {
                          ...tempPricing.mumbaiLocal,
                          sixSeaterRate: Number(e.target.value)
                        }
                      })}
                      disabled={!editingPricing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Airport 4-Seater Rate (₹/km)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.mumbaiLocal.airportFourSeaterRate}
                      onChange={(e) => setTempPricing({
                        ...tempPricing,
                        mumbaiLocal: {
                          ...tempPricing.mumbaiLocal,
                          airportFourSeaterRate: Number(e.target.value)
                        }
                      })}
                      disabled={!editingPricing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Airport 6-Seater Rate (₹/km)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.mumbaiLocal.airportSixSeaterRate}
                      onChange={(e) => setTempPricing({
                        ...tempPricing,
                        mumbaiLocal: {
                          ...tempPricing.mumbaiLocal,
                          airportSixSeaterRate: Number(e.target.value)
                        }
                      })}
                      disabled={!editingPricing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    />
                  </div>
                </div>
                
                {/* Pricing Info */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Mumbai Local Pricing Structure</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                        • No base fare - customers pay only for distance traveled<br/>
                        • Separate rates for 4-seater and 6-seater vehicles<br/>
                        • Higher rates for airport transfers<br/>
                        • Minimum fare of ₹100 applies to all rides
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Outstation Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Outstation Routes</h3>
              </div>
              <div className="p-6">
                {/* Add New Route */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Add New Route</h4>
                  <div className="grid md:grid-cols-4 gap-4">
                    <select
                      value={newRoute.from}
                      onChange={(e) => setNewRoute({ ...newRoute, from: e.target.value })}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    >
                      <option value="">From City</option>
                      {pricing.cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <select
                      value={newRoute.to}
                      onChange={(e) => setNewRoute({ ...newRoute, to: e.target.value })}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    >
                      <option value="">To City</option>
                      {pricing.cities.filter(city => city !== newRoute.from).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="4-Seater Price"
                      value={newRoute.fourSeater || ''}
                      onChange={(e) => setNewRoute({ ...newRoute, fourSeater: Number(e.target.value) })}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="6-Seater Price"
                      value={newRoute.sixSeater || ''}
                      onChange={(e) => setNewRoute({ ...newRoute, sixSeater: Number(e.target.value) })}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleAddRoute}
                    className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Route</span>
                  </button>
                </div>

                {/* Existing Routes */}
                <div className="space-y-4">
                  {Object.entries(pricing.outstation).map(([routeKey, prices]) => (
                    <div key={routeKey} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{routeKey}</h4>
                      </div>
                      <div className="flex items-center space-x-4">
                        {editingRoute === routeKey ? (
                          <>
                            <input
                              type="number"
                              value={tempPricing.outstation[routeKey]['4-seater']}
                              onChange={(e) => setTempPricing({
                                ...tempPricing,
                                outstation: {
                                  ...tempPricing.outstation,
                                  [routeKey]: {
                                    ...tempPricing.outstation[routeKey],
                                    '4-seater': Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
                            />
                            <input
                              type="number"
                              value={tempPricing.outstation[routeKey]['6-seater']}
                              onChange={(e) => setTempPricing({
                                ...tempPricing,
                                outstation: {
                                  ...tempPricing.outstation,
                                  [routeKey]: {
                                    ...tempPricing.outstation[routeKey],
                                    '6-seater': Number(e.target.value)
                                  }
                                }
                              })}
                              className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
                            />
                            <button
                              onClick={() => handleUpdateRoute(routeKey)}
                              className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingRoute(null)}
                              className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-gray-600 dark:text-gray-300">4-seater: ₹{prices['4-seater']}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">6-seater: ₹{prices['6-seater']}</span>
                            <button
                              onClick={() => setEditingRoute(routeKey)}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoute(routeKey)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cities Management */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Cities</h3>
              </div>
              <div className="p-6">
                <div className="flex space-x-4 mb-6">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Enter city name"
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  />
                  <button
                    onClick={handleAddCity}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add City</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pricing.cities.map(city => (
                    <div key={city} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <span className="text-gray-900 dark:text-white">{city}</span>
                      <button
                        onClick={() => handleRemoveCity(city)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div className="space-y-8">
            {/* Add New Promotional Post */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Promotional Post</h3>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      placeholder="Enter promotional title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
                    <input
                      type="number"
                      value={newPost.display_order}
                      onChange={(e) => setNewPost({ ...newPost, display_order: Number(e.target.value) })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newPost.description}
                      onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      placeholder="Enter description (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={newPost.image_url}
                      onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={newPost.button_text}
                      onChange={(e) => setNewPost({ ...newPost, button_text: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      placeholder="Learn More"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button Link</label>
                    <input
                      type="url"
                      value={newPost.button_link}
                      onChange={(e) => setNewPost({ ...newPost, button_link: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <button
                  onClick={createPromotionalPost}
                  className="mt-6 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Post</span>
                </button>
              </div>
            </div>

            {/* Existing Promotional Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Promotional Posts</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {promotionalPosts.map((post) => (
                  <div key={post.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">{post.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            post.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {post.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                            Order: {post.display_order}
                          </span>
                        </div>
                        {post.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{post.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          {post.image_url && <span>Has Image</span>}
                          {post.button_text && <span>Button: {post.button_text}</span>}
                          <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updatePromotionalPost(post.id, { is_active: !post.is_active })}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            post.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {post.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deletePromotionalPost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;