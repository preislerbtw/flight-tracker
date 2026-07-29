import { useState, useMemo } from 'react';
import { calculateDistance } from '../../../shared/utils/distance.js';

export const RADIUS_OPTIONS = [25, 50, 100, 200]; // km

export function useNearbyFlights(flights, userPosition) {
  const [radiusKm, setRadiusKm]       = useState(100);
  const [minAltitude, setMinAltitude] = useState(0);       // metros
  const [maxAltitude, setMaxAltitude] = useState(15000);   // metros
  const [minVelocity, setMinVelocity] = useState(0);       // m/s

  const nearbyFlights = useMemo(() => {
    if (!userPosition) return [];

    return flights
      .filter((f) => f.latitude != null && f.longitude != null)
      .map((f) => ({
        ...f,
        distanceKm: calculateDistance(
          userPosition.lat, userPosition.lon,
          f.latitude, f.longitude
        ),
      }))
      .filter((f) => f.distanceKm <= radiusKm)
      .filter((f) => {
        const alt = f.baroAltitude ?? 0;
        return alt >= minAltitude && alt <= maxAltitude;
      })
      .filter((f) => (f.velocity ?? 0) >= minVelocity)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [flights, userPosition, radiusKm, minAltitude, maxAltitude, minVelocity]);

  // avião "passando agora" = dentro de 5km
  const passingNow = useMemo(
    () => nearbyFlights.filter((f) => f.distanceKm <= 5),
    [nearbyFlights]
  );

  return {
    nearbyFlights,
    passingNow,
    radiusKm, setRadiusKm,
    minAltitude, setMinAltitude,
    maxAltitude, setMaxAltitude,
    minVelocity, setMinVelocity,
  };
}