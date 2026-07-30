import { useState, useEffect } from 'react';
import { AirportInfoAPI } from './airportInfoAPI.js';

export function useAirportWeather(icaoCode) {
  const [metar, setMetar]     = useState(null);
  const [taf, setTaf]         = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!icaoCode) {
      setMetar(null);
      setTaf(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const [m, t] = await Promise.all([
        AirportInfoAPI.getMetar(icaoCode),
        AirportInfoAPI.getTaf(icaoCode),
      ]);
      if (!cancelled) {
        setMetar(m);
        setTaf(t);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [icaoCode]);

  return { metar, taf, loading };
}