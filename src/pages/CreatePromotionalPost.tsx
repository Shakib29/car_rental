import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Save, 
  ArrowLeft, 
  Image, 
  Type, 
  Link as LinkIcon, 
  Eye, 
  EyeOff,
  Hash,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PostFormData {
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  display_order: number;
}

const CreatePromotionalPost: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    is_active: true,
    display_order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const { admin } = useAdmin();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!admin?.isAuthenticated && !isAdmin()) {
      navigate('/admin');
      return;
    }
  }, [admin, user, navigate, isAdmin]);

  const handleInputChange = (field: keyof PostFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user ID (admin or authenticated user)
      const userId = admin?.id || user?.id || 'admin';

      const { error } = await supabase
        .from('promotional_posts')
        .insert([{
          ...formData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Promotional post created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        image_url: '',
        button_text: '',
        button_link: '',
        is_active: true,
        display_order: 0
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error creating promotional post:', error);
      toast.error(error.message || 'Failed to create promotional post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create Promotional Post
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create a new promotional banner for the homepage
              </p>
            </div>
            
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{previewMode ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                Post Details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Type className="w-4 h-4 inline mr-1" />
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter promotional post title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Enter post description (optional)"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Image className="w-4 h-4 inline mr-1" />
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Type className="w-4 h-4 inline mr-1" />
                  Button Text
                </label>
                <input
                  type="text"
                  value={formData.button_text}
                  onChange={(e) => handleInputChange('button_text', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Learn More"
                />
              </div>

              {/* Button Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Button Link
                </label>
                <input
                  type="url"
                  value={formData.button_link}
                  onChange={(e) => handleInputChange('button_link', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active (visible on homepage)
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Create Post</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Preview */}
          {previewMode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-green-600" />
                  Preview
                </h2>
              </div>

              <div className="p-6">
                {formData.title ? (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg overflow-hidden">
                    {/* Background Image */}
                    {formData.image_url && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{ backgroundImage: `url(${formData.image_url})` }}
                      />
                    )}
                    
                    <div className="relative p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0 mb-4 sm:mb-0">
                          <h3 className="text-lg font-bold truncate">
                            {formData.title}
                          </h3>
                          {formData.description && (
                            <p className="text-sm text-orange-100 mt-1">
                              {formData.description}
                            </p>
                          )}
                        </div>
                        
                        {formData.button_text && (
                          <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg flex-shrink-0">
                            {formData.button_text}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a title to see preview</p>
                  </div>
                )}

                {/* Post Details */}
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`font-medium ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Display Order:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.display_order}</span>
                  </div>
                  {formData.button_link && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Button Link:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400 truncate max-w-32">
                        {formData.button_link}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePromotionalPost;