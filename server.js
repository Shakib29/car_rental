import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

// ================= AUTOCOMPLETE =================
app.get('/api/autocomplete', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&limit=5&normalizecity=1`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LocationIQ Autocomplete error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const suggestions = data.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    res.json(suggestions);
  } catch (error) {
    console.error('Autocomplete Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch autocomplete suggestions', details: error.message });
  }
});

// ================= DIRECTIONS =================
app.get('/api/directions', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing required parameters: start and end coordinates' });
    }

    const startCoords = start.split(',');
    const endCoords = end.split(',');
    
    if (startCoords.length !== 2 || endCoords.length !== 2) {
      return res.status(400).json({ error: 'Invalid coordinate format. Use: lat,lng' });
    }

    const startLngLat = `${startCoords[1]},${startCoords[0]}`;
    const endLngLat = `${endCoords[1]},${endCoords[0]}`;

    const url = `https://us1.locationiq.com/v1/directions/driving/${startLngLat};${endLngLat}?key=${LOCATIONIQ_API_KEY}&overview=false&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LocationIQ API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceInKm = Math.round((route.distance / 1000) * 100) / 100;
      const durationInMinutes = Math.round(route.duration / 60);

      res.json({
        distance: distanceInKm,
        duration: durationInMinutes,
        geometry: route.geometry
      });
    } else {
      res.status(404).json({ error: 'No route found between the specified coordinates' });
    }
    
  } catch (error) {
    console.error('LocationIQ proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch route information', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
