import React from 'react';
import { ArrowRight, MapPin, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Premium Cab Services
              <span className="block text-orange-400">Across Maharashtra</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Experience comfortable and reliable transportation with our professional drivers. 
              From airport transfers to outstation journeys, we've got you covered.
            </p>
            
            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Clock, text: '24/7 Service' },
                { icon: Shield, text: 'Safe & Secure' },
                { icon: MapPin, text: 'Multiple Cities' }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex items-center space-x-2 bg-white/10 rounded-lg p-3"
                >
                  <feature.icon className="w-5 h-5 text-orange-400" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            <Link to="/services">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center space-x-2 transition-colors shadow-lg"
              >
                <span>Book Your Ride</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Car Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <motion.img
              src="https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Premium Cab"
              className="w-full h-auto rounded-lg shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg"></div>
          </motion.div>
        </div>
      </div>

      {/* Animated Car Path */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      ></motion.div>
    </section>
  );
};

export default Hero;