const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenRouteService proxy endpoint
app.get('/api/directions', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        error: 'Missing required parameters: start and end coordinates' 
      });
    }

    // Validate coordinate format (lng,lat)
    const startCoords = start.split(',');
    const endCoords = end.split(',');
    
    if (startCoords.length !== 2 || endCoords.length !== 2) {
      return res.status(400).json({ 
        error: 'Invalid coordinate format. Use: lng,lat' 
      });
    }

    const ORS_API_KEY = process.env.ORS_API_KEY;
    if (!ORS_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenRouteService API key not configured' 
      });
    }

    // Build the OpenRouteService URL
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start}&end=${end}`;
    
    // Make request to OpenRouteService
    const response = await fetch(orsUrl);
    
    if (!response.ok) {
      throw new Error(`OpenRouteService API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract relevant information
    if (data.features && data.features.length > 0) {
      const route = data.features[0];
      const properties = route.properties;
      const segments = properties.segments || [];
      
      // Calculate total distance and duration
      const totalDistance = segments.reduce((sum, segment) => sum + (segment.distance || 0), 0);
      const totalDuration = segments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
      
      // Return simplified response
      res.json({
        distance: Math.round((totalDistance / 1000) * 100) / 100, // Convert to km with 2 decimal places
        duration: Math.round(totalDuration / 60), // Convert to minutes
        geometry: route.geometry // Include geometry for potential map display
      });
    } else {
      res.status(404).json({ 
        error: 'No route found between the specified coordinates' 
      });
    }
    
  } catch (error) {
    console.error('OpenRouteService proxy error:', error);
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