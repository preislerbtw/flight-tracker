// funções puras de formatação e conversão de unidades
// converte metros por segundo em km/h
function msToKmh(ms) {
  if (ms == null) return null;
  return Math.round(ms * 3.6);
}

// converte metros em pés
function metersToFeet(m) {
  if (m == null) return null;
  return Math.round(m * 3.28084);
}

// formata altitude: mostra em metros e pés
function formatAltitude(meters) {
  if (meters == null || meters <= 0) return 'Solo';
  const feet = metersToFeet(meters);
  return `${Math.round(meters).toLocaleString('pt-BR')} m`;
}

// formata velocidade em km/h
function formatSpeed(ms) {
  if (ms == null) return '—';
  return `${msToKmh(ms)} km/h`;
}

// formata coordenada geográfica com cardinal
function formatCoord(value, type) {
  if (value == null) return '—';
  const abs = Math.abs(value).toFixed(4);
  if (type === 'lat') return `${abs}° ${value >= 0 ? 'N' : 'S'}`;
  if (type === 'lon') return `${abs}° ${value >= 0 ? 'L' : 'O'}`;
  return abs;
}

// converte graus de direção em ponto cardeal
function degreesToCardinal(deg) {
  if (deg == null) return '—';
  const dirs = ['N','NNE','NE','ENE','L','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

// calcula distância entre dois pontos em km (fórmula de Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// estima tempo restante de voo (distância em km, velocidade em m/s)
function estimateRemainingTime(distanceKm, velocityMs) {
  if (!distanceKm || !velocityMs || velocityMs <= 0) return null;
  const speedKmh = msToKmh(velocityMs);
  const hours = distanceKm / speedKmh;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

// formata timestamp Unix em hora local
function formatTimestamp(unix) {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// gera status com base em dados do voo
function getFlightStatus(flight) {
  if (!flight) return { label: 'Desconhecido', cls: 'unknown' };
  if (flight.onGround) return { label: 'Em solo', cls: 'landed' };
  if (flight.velocity && flight.velocity > 0 && flight.baroAltitude > 100) {
    return { label: 'Em voo', cls: 'active' };
  }
  return { label: 'Taxiando', cls: 'warning' };
}

// calcula porcentagem de progresso entre origem e destino
function flightProgress(flightLat, flightLon, originLat, originLon, destLat, destLon) {
  if (!originLat || !destLat || !flightLat) return null;
  const total = haversineDistance(originLat, originLon, destLat, destLon);
  const remaining = haversineDistance(flightLat, flightLon, destLat, destLon);
  const pct = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
  return pct;
}

export const Formatters = {
  msToKmh,
  metersToFeet,
  formatAltitude,
  formatSpeed,
  formatCoord,
  degreesToCardinal,
  haversineDistance,
  estimateRemainingTime,
  formatTimestamp,
  getFlightStatus,
  flightProgress,
};
