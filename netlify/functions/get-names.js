const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, headers: cors(), body: 'Method Not Allowed' };
    }

    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
    const hasSite = Boolean(siteID);
    const hasToken = Boolean(token);
    console.log('[get-names] env check', { hasSite, hasToken, sitePreview: hasSite ? (siteID || '').slice(0, 8) + '...' : null });
    // Prefer env-based configuration to match SDK expectations
    if (hasSite && hasToken) {
      process.env.NETLIFY_SITE_ID = siteID;
      process.env.NETLIFY_BLOBS_TOKEN = token;
    }
    let store;
    try {
      store = getStore('offday-ticker');
    } catch (e) {
      // fallback to explicit options attempts
      store = await openStore('offday-ticker', hasSite && hasToken ? { siteID, token } : {});
    }
    const raw = await store.get('names', { type: 'json' });
    const payload = raw && Array.isArray(raw.names) ? raw : { names: [], updatedAt: null };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...cors() },
      body: JSON.stringify(payload),
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: cors(), body: 'Server Error' };
  }
};

async function openStore(name, opts) {
  // Try current documented signature first
  try {
    if (opts && opts.siteID && opts.token) {
      return getStore(name, { siteID: opts.siteID, token: opts.token });
    }
    return getStore(name);
  } catch (err) {
    // Fallback to legacy/object signature used by some versions
    console.warn('[get-names] primary getStore failed, retrying with object signature');
    if (opts && opts.siteID && opts.token) {
      return getStore({ name, siteID: opts.siteID, token: opts.token });
    }
    return getStore({ name });
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

