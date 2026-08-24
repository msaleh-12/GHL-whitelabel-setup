/**
 * Vercel Serverless Function: Location Exclusion API Endpoint
 * 
 * Endpoint: GET /api/location-exclusion?locationId=LOCATION_ID
 * 
 * Verifies whether a given HighLevel Location ID exists in either
 * Supabase Project A (HomeFlow) or Supabase Project B (Royal Review).
 * 
 * Environment Variables Required (configured in Vercel):
 * - SUPABASE_Homeflow_URL
 * - SUPABASE_Homeflow_SECRET_KEY
 * - SUPABASE_RoyalReview_URL
 * - SUPABASE_RoyalReview_SECRET_KEY
 */

/**
 * Helper function to query a single Supabase project REST API for a Location ID.
 * Uses native fetch with timeout protection via AbortController.
 * 
 * @param {string} baseUrl - Supabase project URL
 * @param {string} secretKey - Supabase API key / service role key
 * @param {string} locationId - HighLevel Location ID to query
 * @param {number} timeoutMs - Request timeout in milliseconds (default: 5000ms)
 * @returns {Promise<boolean>} True if location exists in database, false otherwise
 */
async function checkSupabaseProject(baseUrl, secretKey, locationId, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const endpointUrl = `${cleanBaseUrl}/rest/v1/ghl_installations?locationId=eq.${encodeURIComponent(locationId)}&select=locationId&limit=1`;

    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Supabase query failed with HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response format from Supabase REST API');
    }

    return data.length > 0;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async function handler(req, res) {
  // Set CORS and caching headers for browser accessibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Enforce HTTP GET method only
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Validate locationId query parameter
  const locationId = req.query ? req.query.locationId : null;
  if (!locationId || typeof locationId !== 'string' || !locationId.trim()) {
    return res.status(400).json({ error: 'Missing or invalid locationId parameter.' });
  }

  const cleanLocationId = locationId.trim();

  // Validate presence of server-side environment variables
  const homeflowUrl = process.env.SUPABASE_Homeflow_URL;
  const homeflowKey = process.env.SUPABASE_Homeflow_SECRET_KEY;
  const royalUrl = process.env.SUPABASE_RoyalReview_URL;
  const royalKey = process.env.SUPABASE_RoyalReview_SECRET_KEY;

  if (!homeflowUrl || !homeflowKey || !royalUrl || !royalKey) {
    return res.status(503).json({ error: 'Unable to verify location exclusion status.' });
  }

  try {
    // Query both Supabase projects concurrently
    const [homeflowExists, royalExists] = await Promise.all([
      checkSupabaseProject(homeflowUrl, homeflowKey, cleanLocationId),
      checkSupabaseProject(royalUrl, royalKey, cleanLocationId)
    ]);

    const isExcluded = homeflowExists || royalExists;

    return res.status(200).json({ excluded: isExcluded });
  } catch (err) {
    // Log server-side error for diagnostics without leaking keys
    console.error('Location exclusion check error:', err.message);

    return res.status(503).json({ error: 'Unable to verify location exclusion status.' });
  }
};
