import { useEffect, useRef, useState } from 'react';

const MAX_TRAIL_POINTS = 120;

/**
 * @param {object|null} selectedFlight  - voo atualmente selecionado
 * @param {Array}       flights         - lista completa de voos (atualizada a cada poll)
 * @returns {Array<[lat, lon]>}         - array de coordenadas para L.polyline
 */
export function useFlightTrail(selectedFlight, flights) {

  const trailsRef = useRef({});
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    if (!flights.length) return;

    const trails = trailsRef.current;

    flights.forEach(flight => {
      const { icao24, latitude, longitude } = flight;
      if (!latitude || !longitude) return;

      if (!trails[icao24]) trails[icao24] = [];

      const last = trails[icao24].at(-1);
      if (last && last[0] === latitude && last[1] === longitude) return;

      trails[icao24] = [
        ...trails[icao24].slice(-(MAX_TRAIL_POINTS - 1)),
        [latitude, longitude],
      ];
    });

    if (selectedFlight?.icao24 && trails[selectedFlight.icao24]) {
      setTrail([...trails[selectedFlight.icao24]]);
    }
  }, [flights]);

  useEffect(() => {
    if (!selectedFlight) {
      setTrail([]);
      return;
    }

    const { icao24, latitude, longitude } = selectedFlight;
    const trails = trailsRef.current;

    if (!trails[icao24]) {
      trails[icao24] = latitude && longitude ? [[latitude, longitude]] : [];
    }

    setTrail([...trails[icao24]]);
  }, [selectedFlight?.icao24]);

  function clearTrail(icao24) {
    if (icao24) {
      delete trailsRef.current[icao24];
    } else {
      trailsRef.current = {};
    }
    setTrail([]);
  }

  return { trail, clearTrail };
}