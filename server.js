import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// LocationIQ proxy endpoint
app.get('/api/directions', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        error: 'Missing required parameters: start and end coordinates' 
      });
    }

    // Validate coordinate format (lat,lng)
    const startCoords = start.split(',');
    const endCoords = end.split(',');
    
    if (startCoords.length !== 2 || endCoords.length !== 2) {
      return res.status(400).json({ 
        error: 'Invalid coordinate format. Use: lat,lng' 
      });
    }

    const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
    if (!LOCATIONIQ_API_KEY) {
      return res.status(500).json({ 
        error: 'LocationIQ API key not configured' 
      });
    }

    // Convert lat,lng to lng,lat format for LocationIQ
    const startLngLat = `${startCoords[1]},${startCoords[0]}`;
    const endLngLat = `${endCoords[1]},${endCoords[0]}`;

    // Build the LocationIQ URL
    const locationiqUrl = `https://us1.locationiq.com/v1/directions/driving/${startLngLat};${endLngLat}?key=${LOCATIONIQ_API_KEY}&overview=false&geometries=geojson`;
    
    // Make request to LocationIQ
    const response = await fetch(locationiqUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LocationIQ API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract relevant information
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // LocationIQ returns distance in meters and duration in seconds
      const distanceInKm = Math.round((route.distance / 1000) * 100) / 100; // Convert to km with 2 decimal places
      const durationInMinutes = Math.round(route.duration / 60); // Convert to minutes
      
      // Return simplified response
      res.json({
        distance: distanceInKm,
        duration: durationInMinutes,
        geometry: route.geometry // Include geometry for potential map display
      });
    } else {
      res.status(404).json({ 
        error: 'No route found between the specified coordinates' 
      });
    }
    
  } catch (error) {
    console.error('LocationIQ proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch route information',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});