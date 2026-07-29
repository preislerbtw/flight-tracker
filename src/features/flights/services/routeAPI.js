const AVIATIONSTACK_BASE = '/aviationstack/v1';

const routeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getRouteByCallsign(callsign) {
  if (!callsign || callsign === 'N/A') return null;

  const key = callsign.trim().toUpperCase();

  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const apiKey = import.meta.env.VITE_AVIATIONSTACK_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const url = `${AVIATIONSTACK_BASE}/flights?access_key=${apiKey}&flight_icao=${key}&limit=1`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn('[routeAPI] AviationStack HTTP', res.status);
      return null;
    }

    const json = await res.json();
    const flight = json.data?.[0];
    if (!flight) {
      routeCache.set(key, { data: null, timestamp: Date.now() });
      return null;
    }

    const route = {
      departure: {
        iata:      flight.departure?.iata     || null,
        icao:      flight.departure?.icao     || null,
        airport:   flight.departure?.airport  || null,
        city:      null, // enriquecido abaixo
        scheduled: flight.departure?.scheduled || null,
        actual:    flight.departure?.actual    || null,
        delay:     flight.departure?.delay     || 0,
        lat:       null,
        lon:       null,
      },
      arrival: {
        iata:      flight.arrival?.iata     || null,
        icao:      flight.arrival?.icao     || null,
        airport:   flight.arrival?.airport  || null,
        city:      null,
        scheduled: flight.arrival?.scheduled || null,
        actual:    flight.arrival?.actual    || null,
        delay:     flight.arrival?.delay     || 0,
        lat:       null,
        lon:       null,
      },
      airline:   flight.airline?.name || null,
      status:    flight.flight_status  || null,
    };

    routeCache.set(key, { data: route, timestamp: Date.now() });
    return route;
  } catch (err) {
    console.warn('[routeAPI] Erro ao buscar rota:', err.message);
    return null;
  }
}

// limpa o cache de rotas 
function clearCache() {
  routeCache.clear();
}

function getCachedRoute(callsing) {
  if(!callsing || callsing == "N/A") return null;
  const key = callsing.trim().toUpperCase();
  const cached = routeCache.get(key);
  if(!cached || Date.now() - cached.timestamp >= CACHE_TTL) return null;
  return cached.data;
}

export const RouteAPI = {
  getCachedRoute,
  getRouteByCallsign,
  clearCache,
};