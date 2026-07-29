import { useEffect, useCallback } from 'react';

export function useShareableFlight(selectedFlightId, onLoadFlight) {
  // ao montar: se tiver ?voo=XXXXX na URL, carrega esse voo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flightFromUrl = params.get('voo');
    if (flightFromUrl) {
      onLoadFlight(flightFromUrl);
    }
  }, []);

  // sempre que o voo selecionado mudar, atualiza a URL (sem recarregar a página)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedFlightId) {
      url.searchParams.set('voo', selectedFlightId);
    } else {
      url.searchParams.delete('voo');
    }
    window.history.replaceState({}, '', url);
  }, [selectedFlightId]);

  const getShareLink = useCallback(() => {
    return window.location.href;
  }, []);

  return { getShareLink };
}