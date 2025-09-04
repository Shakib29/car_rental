import React, { useEffect, useRef, useState } from "react";
import { APIProvider, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

function BookingForm() {
  const apiLoaded = useApiIsLoaded();
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const pickupRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!apiLoaded) return; // ✅ only run when API is ready

    if (pickupRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(pickupRef.current, {
        types: ["geocode"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        setPickup(place.formatted_address || "");
      });
    }

    if (dropRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(dropRef.current, {
        types: ["geocode"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        setDrop(place.formatted_address || "");
      });
    }
  }, [apiLoaded]);

  const handleBook = () => {
    alert(`Booking from ${pickup} to ${drop}`);
  };

  return (
    <motion.div
      className="p-6 bg-white rounded-2xl shadow-md mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="flex items-center text-xl font-bold mb-4">
        <MapPin className="mr-2 text-green-600" /> Mumbai Local Services
      </h2>

      {/* Pickup Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Pickup Location</label>
        <input
          ref={pickupRef}
          type="text"
          placeholder="Enter pickup location"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Drop Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Drop Location</label>
        <input
          ref={dropRef}
          type="text"
          placeholder="Enter drop location"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Button */}
      <button
        onClick={handleBook}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Book Ride
      </button>
    </motion.div>
  );
}

export default function MumbaiLocalBooking() {
  return (
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"}
      libraries={["places"]} // ✅ ensure Places API is loaded
    >
      <BookingForm />
    </APIProvider>
  );
}
