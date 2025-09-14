// Geoapify API configuration and utilities
const GEOAPIFY_API_KEY = 'YOUR_GEOAPIFY_API_KEY'; // Replace with your actual API key

export interface GeoapifyLocation {
  properties: {
    formatted: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    lat: number;
    lon: number;
    place_id: string;
  };
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface GeoapifyAutocompleteResponse {
  features: GeoapifyLocation[];
}

export interface GeoapifyRouteResponse {
  features: Array<{
    properties: {
      segments: Array<{
        distance: number; // in meters
        duration: number; // in seconds
      }>;
    };
  }>;
}

// Autocomplete API for location search
export const searchLocations = async (query: string, bias?: { lat: number; lon: number }): Promise<GeoapifyLocation[]> => {
  if (!query || query.length < 3) return [];

  try {
    let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_API_KEY}&limit=5&format=json`;
    
    // Add bias for Mumbai area if no specific bias provided
    if (bias) {
      url += `&bias=proximity:${bias.lon},${bias.lat}`;
    } else {
      // Default bias to Mumbai coordinates
      url += `&bias=proximity:72.8777,19.0760`;
    }
    
    // Filter for India
    url += `&filter=countrycode:in`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status}`);
    }

    const data: GeoapifyAutocompleteResponse = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error fetching locations from Geoapify:', error);
    return [];
  }
};

// Routing API for distance and duration calculation
export const calculateRoute = async (
  pickup: { lat: number; lon: number },
  drop: { lat: number; lon: number }
): Promise<{ distance: number; duration: number } | null> => {
  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${pickup.lat},${pickup.lon}|${drop.lat},${drop.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geoapify Routing API error: ${response.status}`);
    }

    const data: GeoapifyRouteResponse = await response.json();
    
    if (data.features && data.features.length > 0) {
      const segment = data.features[0].properties.segments[0];
      return {
        distance: Math.round((segment.distance / 1000) * 100) / 100, // Convert to km with 2 decimal places
        duration: Math.round(segment.duration / 60) // Convert to minutes
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error calculating route:', error);
    return null;
  }
};

// Fare calculation utilities
export const calculateFare = (distance: number, isAirportTrip: boolean = false): number => {
  const baseFare = 50; // Base fare in rupees
  const ratePerKm = isAirportTrip ? 18 : 15; // Rate per km
  const minFare = 100; // Minimum fare
  
  const distanceFare = distance * ratePerKm;
  const totalFare = baseFare + distanceFare;
  
  return Math.max(totalFare, minFare);
};

export const getFareBreakdown = (distance: number, isAirportTrip: boolean = false) => {
  const baseFare = 50;
  const ratePerKm = isAirportTrip ? 18 : 15;
  const distanceFare = distance * ratePerKm;
  const subtotal = baseFare + distanceFare;
  const minFare = 100;
  const total = Math.max(subtotal, minFare);
  
  return {
    baseFare,
    distanceFare: Math.round(distanceFare),
    ratePerKm,
    distance,
    subtotal: Math.round(subtotal),
    total: Math.round(total),
    isMinimumFare: total === minFare
  };
};

// Check if location is airport-related
export const isAirportLocation = (locationText: string): boolean => {
  const airportKeywords = [
    'airport', 'terminal', 'chhatrapati shivaji', 'csia', 'bom', 
    'mumbai airport', 'international airport', 'domestic terminal'
  ];
  
  return airportKeywords.some(keyword => 
    locationText.toLowerCase().includes(keyword.toLowerCase())
  );
};