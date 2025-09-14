import React from 'react';
import { Car, Clock, Shield, Star, Users, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Car,
      title: 'Premium Fleet',
      description: 'Well-maintained 4 & 6 seater vehicles for your comfort',
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Round-the-clock service for all your travel needs',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Licensed drivers with verified backgrounds',
      color: 'text-orange-600'
    },
    {
      icon: Star,
      title: 'Rated Service',
      description: '4.8+ star rating from thousands of satisfied customers',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Professional Drivers',
      description: 'Experienced and courteous drivers for a pleasant journey',
      color: 'text-indigo-600'
    },
    {
      icon: MapPin,
      title: 'Wide Coverage',
      description: 'Serving Mumbai, Pune, Surat, Nashik and surrounding areas',
      color: 'text-red-600'
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Why Choose RideMax?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the difference with our premium cab services designed for your comfort and convenience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-full bg-gray-100 dark:bg-gray-600 mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;