const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: cors(), body: '' };
    }
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: cors(), body: 'Method Not Allowed' };
    }

    const pinHeader = event.headers['x-admin-pin'] || event.headers['X-Admin-Pin'];
    const requiredPin = process.env.TICKER_ADMIN_PIN || process.env.ADMIN_PIN;
    if (!requiredPin) {
      return { statusCode: 500, headers: cors(), body: 'Admin PIN not configured' };
    }
    if (!pinHeader || String(pinHeader) !== String(requiredPin)) {
      return { statusCode: 401, headers: cors(), body: 'Unauthorized' };
    }

    const body = safeJson(event.body);
    if (!body || !Array.isArray(body.names)) {
      return { statusCode: 400, headers: cors(), body: 'Invalid payload' };
    }

    const names = body.names
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 500); // sanity limit

    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
    const hasSite = Boolean(siteID);
    const hasToken = Boolean(token);
    console.log('[set-names] env check', { hasSite, hasToken, sitePreview: hasSite ? (siteID || '').slice(0, 8) + '...' : null });
    const store = await openStore('offday-ticker', hasSite && hasToken ? { siteID, token } : {});
    const payload = { names, updatedAt: new Date().toISOString() };
    await store.setJSON('names', payload, {});

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

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
  };
}

function safeJson(s) {
  try { return JSON.parse(s || '{}'); } catch { return null; }
}

async function openStore(name, opts) {
  try {
    if (opts && opts.siteID && opts.token) {
      return getStore(name, { siteID: opts.siteID, token: opts.token });
    }
    return getStore(name);
  } catch (err) {
    console.warn('[set-names] primary getStore failed, retrying with object signature');
    if (opts && opts.siteID && opts.token) {
      return getStore({ name, siteID: opts.siteID, token: opts.token });
    }
    return getStore({ name });
  }
}

