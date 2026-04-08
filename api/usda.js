// /api/usda.js — Vercel Serverless Function
// Proxies USDA FoodData Central requests so the API key stays server-side.
// The client calls: /api/usda?fdcId=171477
// This function calls: https://api.nal.usda.gov/fdc/v1/food/171477?api_key=SECRET

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fdcId } = req.query;

  // Validate fdcId — must be a number to prevent injection
  if (!fdcId || !/^\d+$/.test(fdcId)) {
    return res.status(400).json({ error: 'Missing or invalid fdcId parameter' });
  }

  // Read API key from Vercel Environment Variable (never in code)
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.error('USDA_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `USDA API returned ${response.status}`,
      });
    }

    const data = await response.json();

    // Cache the response for 7 days at the CDN edge (free performance boost)
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).json(data);

  } catch (err) {
    console.error('USDA proxy error:', err.message);
    return res.status(502).json({ error: 'Failed to reach USDA API' });
  }
}
