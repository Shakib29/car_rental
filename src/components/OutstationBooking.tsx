import React, { useState } from 'react';
import { MapPin, Users, Clock, ArrowRight, User, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import AuthModal from './AuthModal';

interface BookingData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  from: string;
  to: string;
  carType: '4-seater' | '6-seater';
  date: string;
  time: string;
}

const OutstationBooking: React.FC = () => {
  const [booking, setBooking] = useState<BookingData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    from: '',
    to: '',
    carType: '4-seater',
    date: '',
    time: ''
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  const cities = ['Mumbai', 'Pune', 'Surat', 'Nashik'];
  
  const pricing = {
    '4-seater': {
      'Mumbai-Pune': 2500,
      'Mumbai-Surat': 3500,
      'Mumbai-Nashik': 2800,
      'Pune-Surat': 4000,
      'Pune-Nashik': 2200,
      'Surat-Nashik': 3200
    },
    '6-seater': {
      'Mumbai-Pune': 3500,
      'Mumbai-Surat': 4500,
      'Mumbai-Nashik': 3800,
      'Pune-Surat': 5000,
      'Pune-Nashik': 3200,
      'Surat-Nashik': 4200
    }
  };

  const getPrice = () => {
    if (!booking.from || !booking.to || booking.from === booking.to) return 0;
    const route = `${booking.from}-${booking.to}`;
    const reverseRoute = `${booking.to}-${booking.from}`;
    return pricing[booking.carType][route] || pricing[booking.carType][reverseRoute] || 0;
  };

  const saveBookingToDatabase = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          customer_id: user?.id || 'guest',
          customer_name: booking.customerName,
          customer_phone: booking.customerPhone,
          customer_email: booking.customerEmail || null,
          service_type: 'outstation',
          from_location: booking.from,
          to_location: booking.to,
          car_type: booking.carType,
          travel_date: booking.date,
          travel_time: booking.time,
          estimated_price: getPrice(),
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving booking:', error);
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking.customerName || !booking.customerPhone || !booking.from || !booking.to || !booking.date || !booking.time) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Save to database first
    saveBookingToDatabase().then(saved => {
      if (!saved) {
        toast.error('Failed to save booking. Please try again.');
        return;
      }
    });
    
    const price = getPrice();
    const message = encodeURIComponent(
      `Outstation Booking Request:\n\nCustomer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail || 'Not provided'}\n\nFrom: ${booking.from}\nTo: ${booking.to}\nCar Type: ${booking.carType}\nDate: ${booking.date}\nTime: ${booking.time}\nEstimated Price: ₹${price}\n\nPlease confirm my booking.`
    );
    
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
    toast.success('Redirecting to WhatsApp for booking confirmation');
  };

  // Auto-fill customer info if logged in
  React.useEffect(() => {
    if (user && !user.isAdmin) {
      setBooking(prev => ({
        ...prev,
        customerName: user.name || '',
        customerPhone: user.phone,
        customerEmail: user.email || ''
      }));
    }
  }, [user]);

  return (
    <>
      <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <MapPin className="w-6 h-6 mr-2 text-blue-600" />
          Outstation Booking
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Customer Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={booking.customerName}
                  onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={booking.customerPhone}
                  onChange={(e) => setBooking({ ...booking, customerPhone: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={booking.customerEmail}
                onChange={(e) => setBooking({ ...booking, customerEmail: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* From City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From City
              </label>
              <select
                value={booking.from}
                onChange={(e) => setBooking({ ...booking, from: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select departure city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* To City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To City
              </label>
              <select
                value={booking.to}
                onChange={(e) => setBooking({ ...booking, to: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select destination city</option>
                {cities.filter(city => city !== booking.from).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Car Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Car Type
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              {(['4-seater', '6-seater'] as const).map(type => (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    booking.carType === type
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                  onClick={() => setBooking({ ...booking, carType: type })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="font-medium text-gray-800 dark:text-white">
                        {type}
                      </span>
                    </div>
                    <input
                      type="radio"
                      checked={booking.carType === type}
                      onChange={() => setBooking({ ...booking, carType: type })}
                      className="text-blue-600"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Travel Date
              </label>
              <input
                type="date"
                value={booking.date}
                onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departure Time
              </label>
              <input
                type="time"
                value={booking.time}
                onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Price Display */}
          {getPrice() > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-800 dark:text-white">
                  Estimated Price:
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{getPrice().toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <span>Book via WhatsApp</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // Auto-fill will happen via useEffect
        }}
      />
    </>
  );
};

export default OutstationBooking;