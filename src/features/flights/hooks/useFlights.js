// hook central: gerencia voos, busca e atualização

import { useState, useEffect, useRef, useCallback } from 'react';
import { Storage } from '../../../shared/utils/storage.js';
import { FlightAPI } from '../services/flightAPI.js';

export function useFlights() {
  const [flights, setFlights]               = useState([]);   // todos os voos na área
  const [selectedFlight, setSelectedFlight] = useState(null); // voo clicado
  const [searchResult, setSearchResult]     = useState(null); // resultado da busca
  const [loading, setLoading]               = useState(false);
  const [searching, setSearching]           = useState(false);
  const [error, setError]                   = useState(null);
  const [lastUpdate, setLastUpdate]         = useState(null);
  const [totalCount, setTotalCount]         = useState(0);

  const intervalRef = useRef(null);
  const settings    = Storage.getSettings();

  // ── Carrega voos da área ─────────────────────────
  const loadAreaFlights = useCallback(async () => {
    try {
      setError(null);
      const data = await FlightAPI.getFlightsByArea();
      setFlights(data);
      setTotalCount(data.length);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os voos. Tente novamente.');
      console.error('[useFlights] loadAreaFlights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // inicia carga e intervalo de atualizacao
  useEffect(() => {
    setLoading(true);
    loadAreaFlights();

    if (settings.autoRefresh) {
      intervalRef.current = setInterval(
        loadAreaFlights,
        settings.refreshInterval * 1000
      );
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // busca por callsign especifico
  const searchFlight = useCallback(async (callsign) => {
    if (!callsign?.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const result = await FlightAPI.getFlightByCallsign(callsign);

      if (!result) {
        setError(`Voo "${callsign.toUpperCase()}" não encontrado ou não está no ar.`);
        setSearchResult(null);
        Storage.addToHistory(callsign, null);
        return null;
      }

      setSearchResult(result);
      setSelectedFlight(result);
      Storage.addToHistory(callsign, result);

      // garante que o voo aparece no mapa mesmo fora da área carregada
      setFlights(prev =>
        prev.some(f => f.icao24 === result.icao24)
          ? prev
          : [...prev, result]
      );

      return result;
    } catch (err) {
      setError('Erro ao buscar voo. Verifique o número e tente novamente.');
      console.error('[useFlights] searchFlight:', err);
      return null;
    } finally {
      setSearching(false);
    }
  }, []);

  // seleciona voo (clique no mapa ou na lista)
  const selectFlight = useCallback((flight) => {
    setSelectedFlight(prev =>
      prev?.icao24 === flight?.icao24 ? null : flight
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFlight(null);
    setSearchResult(null);
    setError(null);
  }, []);

  // força atualização manual
  const refresh = useCallback(() => {
    setLoading(true);
    loadAreaFlights();
  }, [loadAreaFlights]);

  return {
    flights,
    selectedFlight,
    searchResult,
    loading,
    searching,
    error,
    lastUpdate,
    totalCount,
    searchFlight,
    selectFlight,
    clearSelection,
    refresh,
    setError,
  };
}