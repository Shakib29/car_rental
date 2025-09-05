import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface PromotionalPost {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  display_order: number;
}

const PromotionalBanner: React.FC = () => {
  const [posts, setPosts] = useState<PromotionalPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
      }, 5000); // Auto-slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [posts.length]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_posts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching promotional posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const handleButtonClick = (link: string | null) => {
    if (link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        window.location.href = link;
      }
    }
  };

  if (isLoading || !isVisible || posts.length === 0) {
    return null;
  }

  const currentPost = posts[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="relative bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 text-white overflow-hidden"
    >
      {/* Background Image */}
      {currentPost.image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${currentPost.image_url})` }}
        />
      )}
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPost.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0 mb-4 sm:mb-0">
                  <h3 className="text-lg sm:text-xl font-bold truncate">
                    {currentPost.title}
                  </h3>
                  {currentPost.description && (
                    <p className="text-sm sm:text-base text-orange-100 mt-1 line-clamp-2">
                      {currentPost.description}
                    </p>
                  )}
                </div>
                
                {currentPost.button_text && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleButtonClick(currentPost.button_link)}
                    className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-50 transition-colors shadow-lg flex-shrink-0"
                  >
                    {currentPost.button_text}
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 ml-4">
            {posts.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Previous offer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Next offer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        {posts.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {posts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PromotionalBanner;