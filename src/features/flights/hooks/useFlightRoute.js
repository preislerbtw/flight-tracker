import { useState, useEffect } from 'react';
import { RouteAPI }  from '../services/routeAPI.js';
import { FlightAPI } from '../services/flightAPI.js';

/**
 * @param {object|null} selectedFlight
 * @returns {{ route, loadingRoute }}
 *
 * route = {
 *   departure: { iata, airport, city, scheduled, actual, delay, lat, lon },
 *   arrival:   { iata, airport, city, scheduled, actual, delay, lat, lon },
 *   airline, status,
 *   // campos extras enriquecidos pelo DB local:
 *   departureInfo: { name, city, lat, lon } | null,
 *   arrivalInfo:   { name, city, lat, lon } | null,
 * }
 */
export function useFlightRoute(selectedFlight) {
  const [route, setRoute]             = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (!selectedFlight) {
      setRoute(null);
      return;
    }

    const { callsign, icao24 } = selectedFlight;
    if (!callsign || callsign === 'N/A') {
      setRoute(null);
      return;
    }

    let cancelled = false;

    async function fetchRoute() {
      setLoadingRoute(true);
      try {
        // 1. tenta aviationStack
        const apiRoute = await RouteAPI.getRouteByCallsign(callsign);

        if (cancelled) return;

        if (apiRoute) {
          // enriquece com DB local de aeroportos (coordenadas, cidade)
          const depInfo = FlightAPI.getAirportInfo(apiRoute.departure?.icao);
          const arrInfo = FlightAPI.getAirportInfo(apiRoute.arrival?.icao);

          // se o DB local tiver coords, adiciona ao objeto
          if (depInfo) {
            apiRoute.departure.city = depInfo.city;
            apiRoute.departure.lat  = depInfo.lat;
            apiRoute.departure.lon  = depInfo.lon;
          }
          if (arrInfo) {
            apiRoute.arrival.city = arrInfo.city;
            apiRoute.arrival.lat  = arrInfo.lat;
            apiRoute.arrival.lon  = arrInfo.lon;
          }

          apiRoute.departureInfo = depInfo;
          apiRoute.arrivalInfo   = arrInfo;
          setRoute(apiRoute);
        } else {
          // 2. fallback: tenta inferir pelo DB local usando o callsign
          //    (prefixo da companhia → aeroporto base, heurística simples)
          setRoute(null);
        }
      } catch (err) {
        console.warn('[useFlightRoute]', err);
        if (!cancelled) setRoute(null);
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    }

    fetchRoute();
    return () => { cancelled = true; };
  }, [selectedFlight?.icao24]);

  return { route, loadingRoute };
}