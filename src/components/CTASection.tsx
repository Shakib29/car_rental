import React from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CTASection: React.FC = () => {
  const handleCallNow = () => {
    window.open('tel:+919876543210');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hi! I would like to book a cab service. Please provide me with more details.');
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Book Your Ride?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get in touch with us now for instant booking and competitive pricing. 
            Our team is available 24/7 to assist you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCallNow}
              className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Phone className="w-5 h-5" />
              <span>Call Now</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
            >
              <span>WhatsApp</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;