const BASE = '/aviationweather';

async function getMetar(icaoCode) {
  if (!icaoCode) return null;
  try {
    const res = await fetch(`${BASE}/metar?ids=${icaoCode}&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function getTaf(icaoCode) {
  if (!icaoCode) return null;
  try {
    const res = await fetch(`${BASE}/taf?ids=${icaoCode}&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

export const AirportInfoAPI = { getMetar, getTaf };