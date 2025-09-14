import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';
import { searchLocations, GeoapifyLocation } from '../lib/geoapify';

interface GeoapifyAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lon: number }) => void;
  placeholder: string;
  className?: string;
  bias?: { lat: number; lon: number };
}

const GeoapifyAutocomplete: React.FC<GeoapifyAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  bias
}) => {
  const [suggestions, setSuggestions] = useState<GeoapifyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchLocations(query, bias);
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: GeoapifyLocation) => {
    onChange(suggestion.properties.formatted, {
      lat: suggestion.properties.lat,
      lon: suggestion.properties.lon
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding using Geoapify
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=YOUR_GEOAPIFY_API_KEY`
          );
          
          if (response.ok) {
            const data = await response.json();
            const location = data.features[0];
            if (location) {
              onChange(location.properties.formatted, { lat: latitude, lon: longitude });
            } else {
              onChange(`${latitude}, ${longitude}`, { lat: latitude, lon: longitude });
            }
          } else {
            onChange(`${latitude}, ${longitude}`, { lat: latitude, lon: longitude });
          }
        } catch (error) {
          console.error('Error getting current location:', error);
          onChange(`${latitude}, ${longitude}`, { lat: latitude, lon: longitude });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location');
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`w-full pl-10 pr-12 p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 ${className}`}
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
          title="Use current location"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.properties.place_id}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {suggestion.properties.address_line1 || suggestion.properties.formatted}
                  </div>
                  {suggestion.properties.address_line2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {suggestion.properties.address_line2}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeoapifyAutocomplete;