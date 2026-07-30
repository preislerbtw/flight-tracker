// registro/modelo via hexdb.io, foto via Planespotters — ambos grátis, sem key
const HEXDB_BASE = '/hexdb';
const PLANESPOTTERS_BASE = '/planespotters';

async function getAircraftInfo(icao24) {
  if (!icao24) return null;
  try {
    const res = await fetch(`${HEXDB_BASE}/aircraft/${icao24.toLowerCase()}`);
    if (!res.ok) return null;
    const data = await res.json();
    // hexdb às vezes retorna objeto vazio/erro em texto quando não acha
    if (!data || typeof data !== 'object' || !data.Registration) return null;
    return data;
  } catch {
    return null;
  }
}

async function getAircraftPhoto(registration) {
  if (!registration) return null;
  try {
    const res = await fetch(`${PLANESPOTTERS_BASE}/photos/reg/${registration}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.photos?.[0] || null;
  } catch {
    return null;
  }
}

export const AircraftInfoAPI = { getAircraftInfo, getAircraftPhoto };