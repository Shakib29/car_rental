import React, { useState } from 'react';
import { MapPin, Users, Clock, ArrowRight, User, Phone, Mail, Navigation } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <Navigation className="w-6 h-6 mr-2 text-green-600" />
          Mumbai Local Services
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
            {/* Pickup Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pickup Location *
              </label>
              <LocationAutocomplete
                value={booking.pickup}
                onChange={handlePickupChange}
                placeholder="Enter pickup location in Mumbai"
              />
            </div>

            {/* Drop Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drop Location *
              </label>
              <LocationAutocomplete
                value={booking.drop}
                onChange={handleDropChange}
                placeholder="Enter drop location in Mumbai"
              />
            </div>
          </div>

          {/* Distance Display */}
          {distance > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-medium text-gray-800 dark:text-white">
                    Distance: {distance} km
                  </span>
                </div>
                {isCalculating && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {isAirportLocation(booking.pickup) || isAirportLocation(booking.drop) 
                  ? 'Airport transfer rate applied' 
                  : 'Standard local rate applied'}
              </p>
            </motion.div>
          )}

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
                Travel Date *
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
                Pickup Time *
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
                <div>
                  <span className="text-lg font-medium text-gray-800 dark:text-white">
                    Estimated Price:
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {distance} km × ₹{isAirportLocation(booking.pickup) || isAirportLocation(booking.drop) 
                      ? pricing.mumbaiLocal.airportRate 
                      : pricing.mumbaiLocal.baseRate}/km
                  </p>
                </div>
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
            disabled={distance === 0 || isCalculating}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            {isCalculating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <span>Book via WhatsApp</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default MumbaiLocalBooking;