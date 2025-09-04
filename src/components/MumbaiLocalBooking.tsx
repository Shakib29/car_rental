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
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

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
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <Navigation className="w-6 h-6 mr-2 text-green-600" />
            Mumbai Local Services
          </h2>

          {/* --- form continues here --- */}
          {/* I didn’t change other logic, only replaced process.env with import.meta.env */}
          {/* Keep your existing form JSX unchanged */}
          
        </div>
      </div>
    </APIProvider>
  );
};

export default MumbaiLocalBooking;
