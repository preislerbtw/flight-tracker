import { useState, useEffect } from 'react';
import { AircraftInfoAPI } from './aircraftInfoAPI.js';

export function useAircraftInfo(icao24) {
  const [info, setInfo]       = useState(null);
  const [photo, setPhoto]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!icao24) {
      setInfo(null);
      setPhoto(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);

      const aircraftInfo = await AircraftInfoAPI.getAircraftInfo(icao24);
      if (cancelled) return;
      setInfo(aircraftInfo);

      if (aircraftInfo?.Registration) {
        const p = await AircraftInfoAPI.getAircraftPhoto(aircraftInfo.Registration);
        if (!cancelled) setPhoto(p);
      } else {
        setPhoto(null);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [icao24]);

  return { info, photo, loading };
}