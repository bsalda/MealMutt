// Vercel serverless function — proxies USDA FoodData Central requests.
// The API key is read from environment variables (never exposed to the browser).
export default async function handler(req, res) {
  const { fdcId } = req.query;

  if (!fdcId || !/^\d+$/.test(fdcId)) {
    return res.status(400).json({ error: 'Invalid or missing fdcId' });
  }

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'USDA_API_KEY environment variable not set' });
  }

  const upstream = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;

  try {
    const upstream_res = await fetch(upstream);
    if (!upstream_res.ok) {
      return res.status(upstream_res.status).json({ error: `USDA returned ${upstream_res.status}` });
    }
    const data = await upstream_res.json();

    // Cache at Vercel's edge for 7 days — same TTL as the client-side localStorage cache.
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach USDA API', detail: err.message });
  }
}
