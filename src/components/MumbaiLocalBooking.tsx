import React, { useState } from 'react';
import { MapPin, Users, Clock, ArrowRight, User, Phone, Mail, Calendar, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LocationIQAutocomplete from './LocationIQAutocomplete';
import RouteMap from './RouteMap';
import FareBreakdown from './FareBreakdown';
import { getFareBreakdown, isAirportLocation } from '../lib/geoapify';

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

  // Straight line fallback
  const calculateStraightLineDistance = (pickup: LocationCoordinates, drop: LocationCoordinates) => {
    const R = 6371;
    const dLat = (drop.lat - pickup.lat) * Math.PI / 180;
    const dLng = (drop.lng - pickup.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pickup.lat * Math.PI / 180) * Math.cos(drop.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 100) / 100;
  };

  // Calculate route using backend proxy (server.js)
  const calculateRouteDetails = async (pickup: LocationCoordinates, drop: LocationCoordinates) => {
    setIsCalculating(true);
    try {
      const response = await fetch(
        `/api/directions?start=${pickup.lat},${pickup.lng}&end=${drop.lat},${drop.lng}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setDistance(result.distance);
        setDuration(result.duration);
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error calculating route with LocationIQ:', error);
      const straightDistance = calculateStraightLineDistance(pickup, drop);
      setDistance(straightDistance);
      setDuration(Math.round(straightDistance * 3));
    } finally {
      setIsCalculating(false);
    }
  };

  const getFare = () => {
    if (distance === 0) return null;
    const isAirportTrip = isAirportLocation(booking.pickup) || isAirportLocation(booking.drop);
    return getFareBreakdown(distance, isAirportTrip);
  };

  const handlePickupChange = (value: string, coordinates?: LocationCoordinates) => {
    setBooking({ ...booking, pickup: value });
    if (coordinates) {
      setPickupCoords({ lat: coordinates.lat, lng: coordinates.lng });
      if (dropCoords) {
        calculateRouteDetails({ lat: coordinates.lat, lng: coordinates.lng }, dropCoords);
      }
    }
  };

  const handleDropChange = (value: string, coordinates?: LocationCoordinates) => {
    setBooking({ ...booking, drop: value });
    if (coordinates) {
      setDropCoords({ lat: coordinates.lat, lng: coordinates.lng });
      if (pickupCoords) {
        calculateRouteDetails(pickupCoords, { lat: coordinates.lat, lng: coordinates.lng });
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

      {/* Booking Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 md:p-12 shadow-glass"
      >
        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
          
          {/* Pickup & Drop with LocationIQ */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Pickup Location *</label>
              <LocationIQAutocomplete
                value={booking.pickup}
                onChange={handlePickupChange}
                placeholder="Enter pickup location in Mumbai"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Drop Location *</label>
              <LocationIQAutocomplete
                value={booking.drop}
                onChange={handleDropChange}
                placeholder="Enter drop location in Mumbai"
              />
            </div>
          </div>

          {/* Route Map + Fare */}
          {(pickupCoords || dropCoords) && (
            <div className="grid lg:grid-cols-2 gap-6">
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
            </div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={distance === 0 || isCalculating}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-2xl font-bold"
          >
            {isCalculating ? 'Calculating...' : 'Book via WhatsApp'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default MumbaiLocalBooking;
