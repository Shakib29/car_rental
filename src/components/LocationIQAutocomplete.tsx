app.get('/api/autocomplete', async (req, res) => {
  const query = req.query.query;
  try {
    const response = await fetch(
      `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&format=json&limit=5`
    );
    const data = await response.json();
    const results = data.map((item) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
    res.json(results);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});
