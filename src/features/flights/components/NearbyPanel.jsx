import { useEffect, useRef } from 'react';
import { useGeolocation }    from '../../../shared/hooks/useGeolocation.js';
import { useNearbyFlights, RADIUS_OPTIONS } from '../hooks/useNearbyFlights.js';

export function NearbyPanel({ flights, onSelectFlight, onClose, onPassingNow }) {
  const { position, error, loading, requestLocation } = useGeolocation();

  const {
    nearbyFlights, passingNow,
    radiusKm, setRadiusKm,
    maxAltitude, setMaxAltitude,
    minVelocity, setMinVelocity,
  } = useNearbyFlights(flights, position);

  // pede localização assim que o painel abre
  useEffect(() => {
    requestLocation();
  }, []);

  // dispara alerta de "passando agora" pro toast do App
  const notifiedRef = useRef(new Set());
  useEffect(() => {
    passingNow.forEach((f) => {
      if (!notifiedRef.current.has(f.icao24)) {
        notifiedRef.current.add(f.icao24);
        onPassingNow?.(f);
      }
    });
  }, [passingNow, onPassingNow]);

  return (
    <div className="nearby-panel">
      <div className="nearby-panel__header">
        <h3>📍 Voos perto de mim</h3>
        <button className="flight-details__close-inline" onClick={onClose}>✕</button>
      </div>

      {loading && (
        <div className="sidebar__empty">
          <div className="spinner" style={{ width: 24, height: 24 }} />
          <p>Obtendo sua localização…</p>
        </div>
      )}

      {error && (
        <div className="sidebar__empty">
          <p>{error}</p>
          <button className="btn btn--ghost" onClick={requestLocation}>Tentar novamente</button>
        </div>
      )}

      {position && (
        <>
          <div className="nearby-panel__filters">
            <label>
              Raio
              <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
                {RADIUS_OPTIONS.map((km) => (
                  <option key={km} value={km}>{km} km</option>
                ))}
              </select>
            </label>

            <label>
              Altitude máx.
              <select value={maxAltitude} onChange={(e) => setMaxAltitude(Number(e.target.value))}>
                <option value={2000}>2.000 m</option>
                <option value={5000}>5.000 m</option>
                <option value={10000}>10.000 m</option>
                <option value={15000}>Sem limite</option>
              </select>
            </label>

            <label>
              Vel. mín.
              <select value={minVelocity} onChange={(e) => setMinVelocity(Number(e.target.value))}>
                <option value={0}>Qualquer</option>
                <option value={50}>{'>'} 180 km/h</option>
                <option value={150}>{'>'} 540 km/h</option>
              </select>
            </label>
          </div>

          {passingNow.length > 0 && (
            <div className="nearby-panel__alert">
              ✈ {passingNow.length} avião(ões) passando agora perto de você!
            </div>
          )}

          <div className="nearby-panel__list">
            {nearbyFlights.length === 0 ? (
              <div className="sidebar__empty">
                <p>Nenhum voo encontrado nesse raio.</p>
              </div>
            ) : (
              nearbyFlights.slice(0, 30).map((f) => (
                <div
                  key={f.icao24}
                  className="flight-card"
                  onClick={() => onSelectFlight(f)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flight-card__header">
                    <span className="flight-card__callsign">{f.callsign}</span>
                    <span className="badge">{f.distanceKm.toFixed(1)} km</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {f.originCountry} · {Math.round((f.baroAltitude ?? 0))} m ·{' '}
                    {Math.round((f.velocity ?? 0) * 3.6)} km/h
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}