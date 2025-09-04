import React, { useState } from "react";
import { APIProvider, Autocomplete } from "@vis.gl/react-google-maps";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const MumbaiLocalBooking = () => {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const handleBook = () => {
    alert(`Booking from ${pickup} to ${drop}`);
  };

  return (
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"}
      solutionChannel="react-google-maps-demo"
    >
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
          <Autocomplete
            onPlaceChanged={(place) => setPickup(place.formatted_address || "")}
          >
            <input
              type="text"
              placeholder="Enter pickup location"
              className="w-full border rounded-lg px-3 py-2"
            />
          </Autocomplete>
        </div>

        {/* Drop Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Drop Location</label>
          <Autocomplete
            onPlaceChanged={(place) => setDrop(place.formatted_address || "")}
          >
            <input
              type="text"
              placeholder="Enter drop location"
              className="w-full border rounded-lg px-3 py-2"
            />
          </Autocomplete>
        </div>

        {/* Button */}
        <button
          onClick={handleBook}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Book Ride
        </button>
      </motion.div>
    </APIProvider>
  );
};

export default MumbaiLocalBooking;
