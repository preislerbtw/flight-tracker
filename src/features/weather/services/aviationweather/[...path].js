const AVIATIONWEATHER_BASE = 'https://aviationweather.gov/api/data';

export default async function handler(req, res) {
  try {
    const { path, ...queryParams } = req.query;
    const segments = Array.isArray(path) ? path.join('/') : path || '';

    const search = new URLSearchParams(queryParams).toString();
    const targetUrl = `${AVIATIONWEATHER_BASE}/${segments}${search ? `?${search}` : ''}`;

    const upstream = await fetch(targetUrl);
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err) {
    console.error('[aviationweather-proxy]', err.message);
    res.status(502).json({ error: 'Erro ao conectar com o Aviation Weather Center', details: err.message });
  }
}