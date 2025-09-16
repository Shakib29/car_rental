import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';
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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 1 && isAutoPlaying && !isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
      }, 4000); // Auto-slide every 4 seconds

      return () => clearInterval(interval);
    }
  }, [posts.length, isAutoPlaying, isPaused]);

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

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
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

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (isLoading || !isVisible || posts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-primary-700 dark:via-primary-800 dark:to-primary-900 text-white overflow-hidden shadow-2xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Carousel Container */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Slides Container */}
          <div className="relative h-48 sm:h-56 md:h-64">
            <AnimatePresence mode="wait">
              <motion.div
                key={posts[currentIndex].id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {/* Background Image */}
                {posts[currentIndex].image_url && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center rounded-2xl"
                    style={{ backgroundImage: `url(${posts[currentIndex].image_url})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 rounded-2xl" />
                  </div>
                )}

                {/* Content */}
                <div className="relative h-full flex items-center justify-between p-8 md:p-12">
                  <div className="flex-1 min-w-0 max-w-3xl">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4 leading-tight"
                    >
                      {posts[currentIndex].title}
                    </motion.h2>
                    
                    {posts[currentIndex].description && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg sm:text-xl text-white/90 mb-6 leading-relaxed max-w-2xl"
                      >
                        {posts[currentIndex].description}
                      </motion.p>
                    )}
                    
                    {posts[currentIndex].button_text && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleButtonClick(posts[currentIndex].button_link)}
                        className="bg-white text-primary-600 px-8 py-4 rounded-xl font-display font-bold text-lg hover:bg-primary-50 transition-all duration-300 shadow-xl"
                      >
                        {posts[currentIndex].button_text}
                      </motion.button>
                    )}
                  </div>

                  {/* Decorative Elements */}
                  <div className="hidden lg:block relative">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-32 h-32 border-4 border-white/20 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          {posts.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-300 group z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-300 group z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}

          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            {/* Auto-play Toggle */}
            {posts.length > 1 && (
              <button
                onClick={toggleAutoPlay}
                className="p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-300"
                aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
              >
                {isAutoPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-300"
              aria-label="Close banner"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        {posts.length > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-3">
            {posts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-white shadow-lg'
                    : 'w-3 h-3 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {posts.length > 1 && isAutoPlaying && !isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "linear" }}
              key={currentIndex}
            />
          </div>
        )}
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [360, 180, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 right-20 w-6 h-6 bg-white/10 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -25, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 right-10 w-3 h-3 bg-white/15 rounded-full"
        />
      </div>
    </motion.div>
  );
};

export default PromotionalBanner;