import React, { useState } from 'react';
import { MapPin, Users, Clock, ArrowRight, User, Phone, Mail, Calendar, Navigation, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import GeoapifyAutocomplete from './GeoapifyAutocomplete';
import RouteMap from './RouteMap';
import FareBreakdown from './FareBreakdown';
import { calculateRoute, getFareBreakdown, isAirportLocation } from '../lib/geoapify';

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
  const [duration, setDuration] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const { pricing } = useAdmin();
  const { user } = useAuth();

  // Calculate distance and duration using Geoapify API
  const calculateRouteDetails = async (pickup: LocationCoordinates, drop: LocationCoordinates) => {
    setIsCalculating(true);
    try {
      const result = await calculateRoute(
        { lat: pickup.lat, lon: pickup.lng },
        { lat: drop.lat, lon: drop.lng }
      );
      
      if (result) {
        setDistance(result.distance);
        setDuration(result.duration);
      } else {
        // Fallback to straight-line distance
        const straightDistance = calculateStraightLineDistance(pickup, drop);
        setDistance(straightDistance);
        setDuration(Math.round(straightDistance * 3)); // Rough estimate: 3 min per km
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback to straight-line distance
      const straightDistance = calculateStraightLineDistance(pickup, drop);
      setDistance(straightDistance);
      setDuration(Math.round(straightDistance * 3));
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

  const getFare = () => {
    if (distance === 0) return null;
    
    const isAirportTrip = isAirportLocation(booking.pickup) || isAirportLocation(booking.drop);
    return getFareBreakdown(distance, isAirportTrip);
  };

  const handlePickupChange = (value: string, coordinates?: LocationCoordinates) => {
    setBooking({ ...booking, pickup: value });
    if (coordinates) {
      setPickupCoords({ lat: coordinates.lat, lng: coordinates.lon });
      if (dropCoords) {
        calculateRouteDetails({ lat: coordinates.lat, lng: coordinates.lon }, dropCoords);
      }
    }
  };

  const handleDropChange = (value: string, coordinates?: LocationCoordinates) => {
    setBooking({ ...booking, drop: value });
    if (coordinates) {
      setDropCoords({ lat: coordinates.lat, lng: coordinates.lon });
      if (pickupCoords) {
        calculateRouteDetails(pickupCoords, { lat: coordinates.lat, lng: coordinates.lon });
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
          estimated_price: getFare()?.total || 0,
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
    
    const fareDetails = getFare();
    const isAirportTrip = isAirportLocation(booking.pickup) || isAirportLocation(booking.drop);
    
    const message = encodeURIComponent(
      `Mumbai Local Booking Request:\n\nCustomer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail || 'Not provided'}\n\nPickup: ${booking.pickup}\nDrop: ${booking.drop}\nDistance: ${distance} km\nDuration: ${duration} min\nCar Type: ${booking.carType}\nDate: ${booking.date}\nTime: ${booking.time}\nService Type: ${isAirportTrip ? 'Airport Transfer' : 'Local Ride'}\nEstimated Price: ₹${fareDetails?.total || 0}\n\nPlease confirm my booking.`
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
                  value={user?.name || booking.customerName}
                  onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
                  className="w-full p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                  placeholder="Enter your full name"
                  defaultValue={user?.name || ''}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={user?.phone || booking.customerPhone}
                  onChange={(e) => setBooking({ ...booking, customerPhone: e.target.value })}
                  className="w-full p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                  placeholder="Enter your phone number"
                  defaultValue={user?.phone || ''}
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
                value={user?.email || booking.customerEmail}
                onChange={(e) => setBooking({ ...booking, customerEmail: e.target.value })}
                className="w-full p-4 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                placeholder="Enter your email address"
                defaultValue={user?.email || ''}
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
              <GeoapifyAutocomplete
                value={booking.pickup}
                onChange={handlePickupChange}
                placeholder="Enter pickup location in Mumbai"
                className="bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-500/50 focus:ring-green-500"
                bias={{ lat: 19.0760, lon: 72.8777 }} // Mumbai coordinates
              />
            </div>

            {/* Drop Location */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Drop Location *
              </label>
              <GeoapifyAutocomplete
                value={booking.drop}
                onChange={handleDropChange}
                placeholder="Enter drop location in Mumbai"
                className="bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-500/50 focus:ring-green-500"
                bias={{ lat: 19.0760, lon: 72.8777 }} // Mumbai coordinates
              />
            </div>
          </motion.div>

          {/* Route Map and Details */}
          {(pickupCoords || dropCoords) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Route Map */}
              <RouteMap
                pickup={pickupCoords && booking.pickup ? {
                  lat: pickupCoords.lat,
                  lon: pickupCoords.lng,
                  address: booking.pickup
                } : undefined}
                drop={dropCoords && booking.drop ? {
                  lat: dropCoords.lat,
                  lon: dropCoords.lng,
                  address: booking.drop
                } : undefined}
              />
              
              {/* Fare Breakdown */}
              {distance > 0 && !isCalculating && (
                <FareBreakdown
                  distance={distance}
                  duration={duration}
                  baseFare={getFare()?.baseFare || 0}
                  distanceFare={getFare()?.distanceFare || 0}
                  ratePerKm={getFare()?.ratePerKm || 0}
                  total={getFare()?.total || 0}
                  isAirportTrip={isAirportLocation(booking.pickup) || isAirportLocation(booking.drop)}
                  isMinimumFare={getFare()?.isMinimumFare || false}
                />
              )}
              
              {/* Loading State */}
              {isCalculating && (
                <div className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Calculating route...</p>
                  </div>
                </div>
              )}
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