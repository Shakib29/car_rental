import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  Search,
  Settings,
  Save,
  LogOut,
  Edit3,
  Plus,
  Megaphone,
  Eye,
  EyeOff,
  Trash2,
  Image
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
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
  const { admin, logout, pricing, updatePricing, addCity, removeCity, addRoute, updateRoute, deleteRoute } = useAdmin();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [promotionalPosts, setPromotionalPosts] = useState<PromotionalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PromotionalPost | null>(null);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [tempPricing, setTempPricing] = useState(pricing);
  const [newCity, setNewCity] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'posts'>('bookings');

  const [routeForm, setRouteForm] = useState({
    fromCity: '',
    toCity: '',
    fourSeaterPrice: 0,
    sixSeaterPrice: 0
  });
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    display_order: 0
  });

  useEffect(() => {
    if (!admin?.isAuthenticated) {
      navigate('/admin');
      return;
    }
    fetchBookings();
    fetchPromotionalPosts();
  }, [admin, navigate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchTerm]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
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
      toast.error('Failed to fetch promotional posts');
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone.includes(searchTerm) ||
        booking.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.to_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus as any }
            : booking
        )
      );

      toast.success(`Booking ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('promotional_posts')
          .update({
            ...postForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('Post updated successfully');
      } else {
        const { error } = await supabase
          .from('promotional_posts')
          .insert(postForm);

        if (error) throw error;
        toast.success('Post created successfully');
      }

      setShowPostModal(false);
      setEditingPost(null);
      setPostForm({
        title: '',
        description: '',
        image_url: '',
        button_text: '',
        button_link: '',
        display_order: 0
      });
      fetchPromotionalPosts();
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const togglePostStatus = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_posts')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      setPromotionalPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, is_active: !currentStatus } : post
        )
      );

      toast.success(`Post ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update post status');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('promotional_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPromotionalPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const openEditModal = (post: PromotionalPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      description: post.description || '',
      image_url: post.image_url || '',
      button_text: post.button_text || '',
      button_link: post.button_link || '',
      display_order: post.display_order
    });
    setShowPostModal(true);
  };

  const handlePricingUpdate = () => {
    updatePricing(tempPricing);
    setShowPricingModal(false);
    toast.success('Pricing updated successfully');
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.estimated_price, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'confirmed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (!admin?.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              RideMax Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Welcome back, {admin.username}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPricingModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Pricing</span>
            </button>
            <button
              onClick={() => setShowCityModal(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Manage Cities</span>
            </button>
            <button
              onClick={() => {
                setEditingRoute(null);
                setRouteForm({
                  fromCity: '',
                  toCity: '',
                  fourSeaterPrice: 0,
                  sixSeaterPrice: 0
                });
                setShowRouteModal(true);
              }}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Manage Routes</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Calendar, label: 'Total Bookings', value: stats.totalBookings, color: 'blue' },
            { icon: Clock, label: 'Pending', value: stats.pendingBookings, color: 'yellow' },
            { icon: CheckCircle, label: 'Confirmed', value: stats.confirmedBookings, color: 'green' },
            { icon: DollarSign, label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, color: 'purple' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-3 rounded-md font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'bookings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 rounded-md font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'posts'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Promotional Posts</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'bookings' && (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, phone, or location..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Bookings Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Recent Bookings ({filteredBookings.length})
                </h2>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">Loading bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">No bookings found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Route
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredBookings.map((booking, index) => (
                        <motion.tr
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {booking.customer_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {booking.customer_phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {booking.service_type === 'outstation' ? 'Outstation' : 'Mumbai Local'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {booking.car_type}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {booking.from_location}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              → {booking.to_location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(booking.travel_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {booking.travel_time}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              ₹{booking.estimated_price.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                    className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                                    title="Confirm booking"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                    title="Cancel booking"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                                  className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                                  title="Mark as completed"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Promotional Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {/* Add Post Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Promotional Posts
              </h2>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setPostForm({
                    title: '',
                    description: '',
                    image_url: '',
                    button_text: '',
                    button_link: '',
                    display_order: 0
                  });
                  setShowPostModal(true);
                }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Post</span>
              </button>
            </motion.div>

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotionalPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                >
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => togglePostStatus(post.id, post.is_active)}
                          className={`p-1 rounded-full ${
                            post.is_active ? 'text-green-600' : 'text-gray-400'
                          }`}
                          title={post.is_active ? 'Active' : 'Inactive'}
                        >
                          {post.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {post.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                        {post.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          post.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {post.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Order: {post.display_order}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(post)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                          title="Edit post"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {promotionalPosts.length === 0 && (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  No promotional posts yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Create your first promotional post to engage customers
                </p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Create First Post
                </button>
              </div>
            )}
          </>
        )}

        {/* Pricing Management Modal */}
        {showPricingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Manage Pricing
                </h2>
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Outstation Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Edit3 className="w-5 h-5 mr-2 text-blue-600" />
                    Outstation Pricing
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      6-Seater Surcharge for Outstation (₹)
                    </label>
                    <input
                      type="number"
                      value={tempPricing.outstationSixSeaterSurcharge}
                      onChange={(e) => setTempPricing(prev => ({
                        ...prev,
                        outstationSixSeaterSurcharge: parseInt(e.target.value) || 0
                      }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Additional amount added to all 6-seater outstation bookings
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {Object.entries(tempPricing.outstation).map(([route, prices]) => (
                      <div key={route} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-800 dark:text-white">{route}</h4>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingRoute(route);
                                setRouteForm({
                                  fromCity: route.split('-')[0],
                                  toCity: route.split('-')[1],
                                  fourSeaterPrice: prices['4-seater'],
                                  sixSeaterPrice: prices['6-seater']
                                });
                                setShowRouteModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit route"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the route ${route}?`)) {
                                  const newPricing = { ...tempPricing };
                                  delete newPricing.outstation[route];
                                  setTempPricing(newPricing);
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete route"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              4-Seater (₹)
                            </label>
                            <input
                              type="number"
                              value={prices['4-seater']}
                              onChange={(e) => setTempPricing(prev => ({
                                ...prev,
                                outstation: {
                                  ...prev.outstation,
                                  [route]: {
                                    ...prev.outstation[route],
                                    '4-seater': parseInt(e.target.value) || 0
                                  }
                                }
                              }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              6-Seater (₹)
                            </label>
                            <input
                              type="number"
                              value={prices['6-seater']}
                              onChange={(e) => setTempPricing(prev => ({
                                ...prev,
                                outstation: {
                                  ...prev.outstation,
                                  [route]: {
                                    ...prev.outstation[route],
                                    '6-seater': parseInt(e.target.value) || 0
                                  }
                                }
                              }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setEditingRoute(null);
                      setRouteForm({
                        fromCity: '',
                        toCity: '',
                        fourSeaterPrice: 0,
                        sixSeaterPrice: 0
                      });
                      setShowRouteModal(true);
                    }}
                    className="mt-4 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Route</span>
                  </button>
                </div>

                {/* Mumbai Local Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Edit3 className="w-5 h-5 mr-2 text-green-600" />
                    Mumbai Local Pricing (Per KM)
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Base Rate (₹/km)
                        </label>
                        <input
                          type="number"
                          value={tempPricing.mumbaiLocal.baseRate}
                          onChange={(e) => setTempPricing(prev => ({
                            ...prev,
                            mumbaiLocal: {
                              ...prev.mumbaiLocal,
                              baseRate: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Airport Rate (₹/km)
                        </label>
                        <input
                          type="number"
                          value={tempPricing.mumbaiLocal.airportRate}
                          onChange={(e) => setTempPricing(prev => ({
                            ...prev,
                            mumbaiLocal: {
                              ...prev.mumbaiLocal,
                              airportRate: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          6-Seater Surcharge (₹)
                        </label>
                        <input
                          type="number"
                          value={tempPricing.mumbaiLocal.sixSeaterSurcharge}
                          onChange={(e) => setTempPricing(prev => ({
                            ...prev,
                            mumbaiLocal: {
                              ...prev.mumbaiLocal,
                              sixSeaterSurcharge: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePricingUpdate}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* City Management Modal */}
        {showCityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Manage Cities
                </h2>
                <button
                  onClick={() => setShowCityModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Add New City */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Add New City
                </h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Enter city name"
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      if (newCity.trim() && !pricing.cities.includes(newCity.trim())) {
                        addCity(newCity.trim());
                        setNewCity('');
                        toast.success('City added successfully');
                      } else {
                        toast.error('City already exists or invalid name');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Add City
                  </button>
                </div>
              </div>

              {/* Current Cities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Current Cities
                </h3>
                <div className="grid gap-3">
                  {pricing.cities.map((city, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="font-medium text-gray-800 dark:text-white">
                        {city}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${city}?`)) {
                            removeCity(city);
                            toast.success('City removed successfully');
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCityModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showRouteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {editingRoute ? 'Edit Route' : 'Add New Route'}
                </h2>
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    if (editingRoute) {
                      updateRoute(editingRoute, routeForm.fourSeaterPrice, routeForm.sixSeaterPrice);
                      toast.success('Route updated successfully');
                    } else {
                      if (!routeForm.fromCity || !routeForm.toCity) {
                        toast.error('Please select both cities');
                        return;
                      }
                      if (routeForm.fromCity === routeForm.toCity) {
                        toast.error('From and To cities must be different');
                        return;
                      }
                      addRoute(routeForm.fromCity, routeForm.toCity, routeForm.fourSeaterPrice, routeForm.sixSeaterPrice);
                      toast.success('Route added successfully');
                    }
                    setShowRouteModal(false);
                    setTempPricing(pricing); // Refresh temp pricing
                  } catch (error: any) {
                    toast.error(error.message || 'Failed to save route');
                  }
                }}
                className="space-y-6"
              >
                {!editingRoute && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        From City *
                      </label>
                      <select
                        value={routeForm.fromCity}
                        onChange={(e) => setRouteForm({ ...routeForm, fromCity: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Select from city</option>
                        {pricing.cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        To City *
                      </label>
                      <select
                        value={routeForm.toCity}
                        onChange={(e) => setRouteForm({ ...routeForm, toCity: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Select to city</option>
                        {pricing.cities.filter(city => city !== routeForm.fromCity).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {editingRoute && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      Editing Route: {editingRoute}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      You can only modify the pricing for this existing route.
                    </p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      4-Seater Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={routeForm.fourSeaterPrice}
                      onChange={(e) => setRouteForm({ ...routeForm, fourSeaterPrice: parseInt(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter 4-seater price"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      6-Seater Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={routeForm.sixSeaterPrice}
                      onChange={(e) => setRouteForm({ ...routeForm, sixSeaterPrice: parseInt(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter 6-seater price"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Note:</strong> The 6-seater price you set here is the base price. An additional surcharge of ₹{pricing.outstationSixSeaterSurcharge} will be automatically added during booking calculations.
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowRouteModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingRoute ? 'Update Route' : 'Add Route'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Post Management Modal */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </h2>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter post title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={postForm.description}
                    onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Enter post description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL
                  </label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={postForm.image_url}
                      onChange={(e) => setPostForm({ ...postForm, image_url: e.target.value })}
                      className="w-full pl-10 pr-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={postForm.button_text}
                      onChange={(e) => setPostForm({ ...postForm, button_text: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Learn More"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Button Link
                    </label>
                    <input
                      type="url"
                      value={postForm.button_link}
                      onChange={(e) => setPostForm({ ...postForm, button_link: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={postForm.display_order}
                    onChange={(e) => setPostForm({ ...postForm, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPost ? 'Update Post' : 'Create Post'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;