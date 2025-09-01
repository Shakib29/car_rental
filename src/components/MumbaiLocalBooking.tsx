import React, { useState, useEffect } from 'react';
import { Navigation, Clock, MapPin, ArrowRight, User, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { APIProvider } from '@vis.gl/react-google-maps';
import LocationAutocomplete from "./LocationAutocomplete";

interface LocalBooking {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickup: string;
  dropoff: string;
  pickupCoords: { lat: number; lng: number } | null;
  dropoffCoords: { lat: number; lng: number } | null;
  serviceType: 'airport-pickup' | 'airport-drop' | 'local-ride';
  date: string;
  time: string;
}

const MumbaiLocalBooking: React.FC = () => {
  const [booking, setBooking] = useState<LocalBooking>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickup: '',
    dropoff: '',
    pickupCoords: null,
    dropoffCoords: null,
    serviceType: 'airport-pickup',
    date: '',
    time: ''
  });

  const { pricing } = useAdmin();
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);

  const calculateDistance = async () => {
    if (!booking.pickupCoords || !booking.dropoffCoords) {
      setDistance(0);
      setPrice(0);
      return;
    }

    try {
      const origin = `${booking.pickupCoords.lat},${booking.pickupCoords.lng}`;
      const destination = `${booking.dropoffCoords.lat},${booking.dropoffCoords.lng}`;
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const calculatedDistance = Math.round(distanceInMeters / 1000);
        setDistance(calculatedDistance);

        let rate = pricing.mumbaiLocal.baseRate;
        if (booking.serviceType.includes('airport')) {
          rate = pricing.mumbaiLocal.airportRate;
        }
        
        const calculatedPrice = Math.round(calculatedDistance * rate);
        setPrice(calculatedPrice);
      } else {
        setDistance(0);
        setPrice(0);
        console.error('Distance Matrix API Error:', data.error_message || data.status);
      }
    } catch (error) {
      console.error('Error fetching distance from API:', error);
      setDistance(0);
      setPrice(0);
    }
  };

  useEffect(() => {
    calculateDistance();
  }, [booking.pickupCoords, booking.dropoffCoords, booking.serviceType, pricing]);

  const handlePlaceSelect = (field: 'pickup' | 'dropoff') => (place: google.maps.places.PlaceResult | null) => {
    if (place?.formatted_address) {
      setBooking(prev => ({
        ...prev,
        [field]: place.formatted_address,
        [`${field}Coords`]: {
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
        },
      }));
    } else {
      setBooking(prev => ({ ...prev, [field]: '', [`${field}Coords`]: null }));
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
          service_type: booking.serviceType,
          from_location: booking.pickup,
          to_location: booking.dropoff,
          car_type: 'Not specified',
          travel_date: booking.date,
          travel_time: booking.time,
          estimated_price: price,
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
    if (!booking.customerName || !booking.customerPhone || !booking.pickup || !booking.dropoff || !booking.date || !booking.time) {
      toast.error('Please fill all fields');
      return;
    }

    saveBookingToDatabase().then(saved => {
      if (!saved) {
        toast.error('Failed to save booking. Please try again.');
        return;
      }
    });

    const serviceTypeText = {
      'airport-pickup': 'Airport Pickup',
      'airport-drop': 'Airport Drop',
      'local-ride': 'Local Ride'
    };
    
    const message = encodeURIComponent(
      `Mumbai Local Booking Request:\n\nCustomer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail || 'Not provided'}\n\nService: ${serviceTypeText[booking.serviceType]}\nPickup: ${booking.pickup}\nDrop-off: ${booking.dropoff}\nDate: ${booking.date}\nTime: ${booking.time}\nDistance: ${distance} km\nEstimated Price: ₹${price}\n\nPlease confirm my booking.`
    );
    
    window.open(`https://wa.me/919860146819?text=${message}`, '_blank');
    toast.success('Redirecting to WhatsApp for booking confirmation');
  };

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <Navigation className="w-6 h-6 mr-2 text-green-600" />
            Mumbai Local Services
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
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
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Type
                </label>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { value: 'airport-pickup', label: 'Airport Pickup', icon: '✈️' },
                    { value: 'airport-drop', label: 'Airport Drop', icon: '🚖' },
                    { value: 'local-ride', label: 'Local Ride', icon: '🏙️' }
                  ].map(service => (
                    <motion.div
                      key={service.value}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        booking.serviceType === service.value
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                      }`}
                      onClick={() => setBooking({ ...booking, serviceType: service.value as any })}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{service.icon}</div>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {service.label}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pickup Location
                </label>
                <LocationAutocomplete
                  onPlaceSelect={handlePlaceSelect('pickup')}
                  placeholder="Enter pickup location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Drop-off Location
                </label>
                <LocationAutocomplete
                  onPlaceSelect={handlePlaceSelect('dropoff')}
                  placeholder="Enter drop-off location"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={booking.date}
                  onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pickup Time
                </label>
                <input
                  type="time"
                  value={booking.time}
                  onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {distance > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Distance:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{distance} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-800 dark:text-white">Estimated Price:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{price.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  *Rate: ₹{booking.serviceType.includes('airport') ? pricing.mumbaiLocal.airportRate : pricing.mumbaiLocal.baseRate}/km | Final price may vary based on traffic conditions
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
            >
              <span>Book via WhatsApp</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>
        </div>
      </div>
    </APIProvider>
  );
};

export default MumbaiLocalBooking;