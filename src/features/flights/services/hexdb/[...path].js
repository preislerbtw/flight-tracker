const HEXDB_BASE = 'https://hexdb.io/api/v1';

export default async function handler(req, res) {
  try {
    const { path, ...queryParams } = req.query;
    const segments = Array.isArray(path) ? path.join('/') : path || '';

    const search = new URLSearchParams(queryParams).toString();
    const targetUrl = `${HEXDB_BASE}/${segments}${search ? `?${search}` : ''}`;

    const upstream = await fetch(targetUrl);
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err) {
    console.error('[hexdb-proxy]', err.message);
    res.status(502).json({ error: 'Erro ao conectar com o hexdb.io', details: err.message });
  }
}