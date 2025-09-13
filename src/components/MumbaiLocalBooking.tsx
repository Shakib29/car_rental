import React, { useState } from 'react';
import { MapPin, Users, Clock, ArrowRight, User, Phone, Mail, Calendar, Navigation, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LocationAutocomplete from './LocationAutocomplete';

interface BookingData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickup: string;
  drop: string;
  carType: '4-seater' | '6-seater';
  date: string;
  time: string;
}

interface LocationCoordinates {
  lat: number;
  lng: number;
}

const MumbaiLocalBooking: React.FC = () => {
  const [booking, setBooking] = useState<BookingData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickup: '',
    drop: '',
    carType: '4-seater',
    date: '',
    time: ''
  });

  const [pickupCoords, setPickupCoords] = useState<LocationCoordinates | null>(null);
  const [dropCoords, setDropCoords] = useState<LocationCoordinates | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const { pricing } = useAdmin();

  // Calculate distance using OpenRouteService API
  const calculateDistance = async (pickup: LocationCoordinates, drop: LocationCoordinates) => {
    setIsCalculating(true);
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248a1b8c8b8a9b84b8b8b8b8b8b8b8b8b8b&start=${pickup.lng},${pickup.lat}&end=${drop.lng},${drop.lat}`
      );
      
      if (!response.ok) {
        // Fallback to straight-line distance calculation
        const straightDistance = calculateStraightLineDistance(pickup, drop);
        setDistance(straightDistance);
        return;
      }

      const data = await response.json();
      const distanceInMeters = data.features[0]?.properties?.segments?.[0]?.distance || 0;
      const distanceInKm = Math.round((distanceInMeters / 1000) * 100) / 100;
      setDistance(distanceInKm);
    } catch (error) {
      console.error('Error calculating distance:', error);
      // Fallback to straight-line distance
      const straightDistance = calculateStraightLineDistance(pickup, drop);
      setDistance(straightDistance);
    } finally {
      setIsCalculating(false);
    }
  };

  // Fallback straight-line distance calculation
  const calculateStraightLineDistance = (pickup: LocationCoordinates, drop: LocationCoordinates) => {
    const R = 6371; // Earth's radius in km
    const dLat = (drop.lat - pickup.lat) * Math.PI / 180;
    const dLng = (drop.lng - pickup.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickup.lat * Math.PI / 180) * Math.cos(drop.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 100) / 100;
  };

  // Check if location is airport
  const isAirportLocation = (location: string) => {
    const airportKeywords = ['airport', 'terminal', 'chhatrapati shivaji', 'bom', 'mumbai airport'];
    return airportKeywords.some(keyword => 
      location.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const getPrice = () => {
    if (distance === 0) return 0;
    
    const isAirportTrip = isAirportLocation(booking.pickup) || isAirportLocation(booking.drop);
    const rate = isAirportTrip ? pricing.mumbaiLocal.airportRate : pricing.mumbaiLocal.baseRate;
    
    return Math.round(distance * rate);
  };

  const handlePickupChange = (value: string, coordinates?: LocationCoordinates) => {
    setBooking({ ...booking, pickup: value });
    if (coordinates) {
      setPickupCoords(coordinates);
      if (dropCoords) {
        calculateDistance(coordinates, dropCoords);
      }
    }
  };

  const handleDropChange = (value: string, coordinates?: LocationCoordinates) => {
    setBooking({ ...booking, drop: value });
    if (coordinates) {
      setDropCoords(coordinates);
      if (pickupCoords) {
        calculateDistance(pickupCoords, coordinates);
      }
    }
  };

  const saveBookingToDatabase = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          customer_id: 'guest',
          customer_name: booking.customerName,
          customer_phone: booking.customerPhone,
          customer_email: booking.customerEmail || null,
          service_type: 'mumbai-local',
          from_location: booking.pickup,
          to_location: booking.drop,
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
    if (!booking.customerName || !booking.customerPhone || !booking.pickup || !booking.drop || !booking.date || !booking.time) {
      toast.error('Please fill all required fields');
      return;
    }

    if (distance === 0) {
      toast.error('Unable to calculate distance. Please check your locations.');
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
    const isAirportTrip = isAirportLocation(booking.pickup) || isAirportLocation(booking.drop);
    
    const message = encodeURIComponent(
      `Mumbai Local Booking Request:\n\nCustomer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail || 'Not provided'}\n\nPickup: ${booking.pickup}\nDrop: ${booking.drop}\nDistance: ${distance} km\nCar Type: ${booking.carType}\nDate: ${booking.date}\nTime: ${booking.time}\nService Type: ${isAirportTrip ? 'Airport Transfer' : 'Local Ride'}\nEstimated Price: ₹${price}\n\nPlease confirm my booking.`
    );
    
    window.open(`https://wa.me/919860146819?text=${message}`, '_blank');
    toast.success('Redirecting to WhatsApp for booking confirmation');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Navigation className="w-4 h-4" />
          <span>Mumbai Local Service</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          Mumbai Local Rides
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Quick and convenient rides within Mumbai with real-time pricing and GPS tracking
        </p>
      </motion.div>

      {/* Glassmorphism Booking Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 md:p-12 shadow-glass"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-3xl"></div>
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-600/30"
          >
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl mr-3">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              Customer Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={booking.customerName}
                  onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
                  className="w-full p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={booking.customerPhone}
                  onChange={(e) => setBooking({ ...booking, customerPhone: e.target.value })}
                  className="w-full p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={booking.customerEmail}
                onChange={(e) => setBooking({ ...booking, customerEmail: e.target.value })}
                className="w-full p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                placeholder="Enter your email address"
              />
            </div>
          </motion.div>

          {/* Location Selection */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Pickup Location */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pickup Location *
              </label>
              <LocationAutocomplete
                value={booking.pickup}
                onChange={handlePickupChange}
                placeholder="Enter pickup location in Mumbai"
                className="bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-500/50 focus:ring-green-500"
              />
            </div>

            {/* Drop Location */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Drop Location *
              </label>
              <LocationAutocomplete
                value={booking.drop}
                onChange={handleDropChange}
                placeholder="Enter drop location in Mumbai"
                className="bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-500/50 focus:ring-green-500"
              />
            </div>
          </motion.div>

          {/* Distance Display */}
          {distance > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-xl">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-gray-900 dark:text-white">
                      Distance: {distance} km
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isAirportLocation(booking.pickup) || isAirportLocation(booking.drop) 
                        ? 'Airport transfer rate applied' 
                        : 'Standard local rate applied'}
                    </p>
                  </div>
                </div>
                {isCalculating && (
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </motion.div>
          )}

          {/* Car Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Car Type *
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              {(['4-seater', '6-seater'] as const).map(type => (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                    booking.carType === type
                      ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-500 shadow-lg'
                      : 'bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200/50 dark:border-gray-600/50 hover:border-green-300 dark:hover:border-green-600'
                  }`}
                  onClick={() => setBooking({ ...booking, carType: type })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl ${booking.carType === type ? 'bg-green-100 dark:bg-green-800/50' : 'bg-gray-100 dark:bg-gray-600'}`}>
                        <Users className={`w-6 h-6 ${booking.carType === type ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`} />
                      </div>
                      <div>
                        <h4 className={`font-display font-bold ${booking.carType === type ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                          {type}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {type === '4-seater' ? 'Perfect for small groups' : 'Ideal for families'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      booking.carType === type 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {booking.carType === type && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Date and Time */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Travel Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={booking.date}
                  onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-4 p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pickup Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={booking.time}
                  onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                  className="w-full pl-12 pr-4 p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Price Display */}
          {getPrice() > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-1">
                    Estimated Price
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {distance} km × ₹{isAirportLocation(booking.pickup) || isAirportLocation(booking.drop) 
                      ? pricing.mumbaiLocal.airportRate 
                      : pricing.mumbaiLocal.baseRate}/km
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-display font-bold text-green-600 dark:text-green-400">
                    ₹{getPrice().toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">All inclusive</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={distance === 0 || isCalculating}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-5 rounded-2xl font-display font-bold text-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-xl disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <span>Book via WhatsApp</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default MumbaiLocalBooking;