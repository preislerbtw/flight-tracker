import { getValidToken } from '../_lib/openskyAuth.js';

const OPENSKY_API_BASE = 'https://opensky-network.org/api';

export default async function handler(req, res) {
  try {
    const { path, ...queryParams } = req.query;
    const segments = Array.isArray(path) ? path.join('/') : path || '';

    const search = new URLSearchParams(queryParams).toString();
    const targetUrl = `${OPENSKY_API_BASE}/${segments}${search ? `?${search}` : ''}`;

    // usa do authorization enviado pelo frontend, se não vier, busca um novo token
    const headers = {};
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    } else {
      const token = await getValidToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const upstream = await fetch(targetUrl, { headers });
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err) {
    console.error('[opensky-proxy]', err.message);
    res.status(502).json({ error: 'Erro ao conectar com a OpenSky Network', details: err.message });
  }
}