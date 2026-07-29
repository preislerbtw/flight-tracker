import { useState } from 'react';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  function requestLocation() {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada nesse navegador');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Permissão de localização negada'
            : 'Não foi possível obter sua localização'
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return { position, error, loading, requestLocation };
}