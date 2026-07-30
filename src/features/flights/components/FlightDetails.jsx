import { useState } from 'react';
import { Formatters } from '../../../shared/utils/formatters.js';
import { WeatherWidget } from '../../weather/components/WeatherWidget.jsx';
import { AirportWeatherPanel } from './AirportWeatherPanel.jsx';
import { AircraftInfoPanel } from './AircraftInfoPanel.jsx';

export function FlightDetails({ flight, onClose, onFavoriteToggle, isFav, route, loadingRoute }) {
  const [showAirportInfo, setShowAirportInfo] = useState(null);
  const [showAircraftInfo, setShowAircraftInfo] = useState(false);

  if (!flight) return null;

  const status   = Formatters.getFlightStatus(flight);
  const speedKmh = Formatters.msToKmh(flight.velocity);
  const altFt    = Formatters.metersToFeet(flight.baroAltitude);
  const heading  = Formatters.degreesToCardinal(flight.trueTrack);

  function getVerticalIcon() {
    const vr = flight.verticalRate;
    if (!vr || Math.abs(vr) < 0.5) return '→ Cruzeiro';
    return vr > 0 ? '↑ Subindo' : '↓ Descendo';
  }

  // dados de rota do aviao
  const dep = route?.departure;
  const arr = route?.arrival;
  const depInfo = route?.departureInfo;
  const arrInfo = route?.arrivalInfo;

  // calcula progresso se temos coords de origem e destino
  const depLat = dep?.lat ?? depInfo?.lat;
  const depLon = dep?.lon ?? depInfo?.lon;
  const arrLat = arr?.lat ?? arrInfo?.lat;
  const arrLon = arr?.lon ?? arrInfo?.lon;

  const progress = Formatters.flightProgress(
    flight.latitude, flight.longitude,
    depLat, depLon,
    arrLat, arrLon,
  );

  // atraso em minutos 
  const depDelay = dep?.delay;
  const arrDelay = arr?.delay;

  function formatTime(isoStr) {
    if (!isoStr) return null;
    try {
      return new Date(isoStr).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit',
      });
    } catch (error) {
      return null;
    }
  }

  return (
    <div className="flight-details">

      {/* ── cabeçalho ── */}
      <div className="flight-details__header">
        <div className="flight-details__title">
          <span style={{ fontSize: 20 }}>✈️</span>
          <div style={{ minWidth: 0 }}>
            <div className="flight-details__callsign">
              {flight.callsign || flight.icao24?.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              <>
                {route?.airline
                  ? `${route.airline} · `
                  : `${flight.originCountry} · `}
                ICAO: {flight.icao24?.toUpperCase()}
              </>
              <button
                className="aircraft-toggle-btn"
                onClick={() => setShowAircraftInfo((v) => !v)}
              >
                ✈ Ver aeronave
              </button>
            </div>
          </div>
        </div>

        <div className="flight-details__controls">
          <span className={`badge badge--${status.cls}`}>
            {status.cls === 'active' && <span className="live-dot" />}
            {status.label}
          </span>

          <button
            className={`btn btn--icon ${isFav ? 'active' : ''}`}
            onClick={() => onFavoriteToggle(flight)}
            title={isFav ? 'Remover favorito' : 'Salvar favorito'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24"
                 fill={isFav ? 'currentColor' : 'none'}
                 stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>

          <button className="flight-details__close-inline" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
      </div>

      {/* ── grid de estatísticas ── */}
      <div className="flight-details__grid">
        <div className="details-stat">
          <div className="details-stat__label">Velocidade</div>
          <div className="details-stat__value">
            {speedKmh || '—'}
            <span className="details-stat__unit">km/h</span>
          </div>
        </div>

        <div className="details-stat">
          <div className="details-stat__label">Altitude</div>
          <div className="details-stat__value">
            {altFt ? altFt.toLocaleString('pt-BR') : '—'}
            <span className="details-stat__unit">ft</span>
          </div>
        </div>

        <div className="details-stat">
          <div className="details-stat__label">Direção</div>
          <div className="details-stat__value">
            {flight.trueTrack ? `${Math.round(flight.trueTrack)}°` : '—'}
            <span className="details-stat__unit">{heading}</span>
          </div>
        </div>

        <div className="details-stat">
          <div className="details-stat__label">Fase</div>
          <div className="details-stat__value" style={{ fontSize: 13 }}>
            {getVerticalIcon()}
          </div>
        </div>
      </div>

      {/* ── linha de rota ── */}
      <div className="flight-details__route">

        {/* origem do voo */}
        <div className="route-airport">
          {loadingRoute ? (
            <div className="route-airport__iata" style={{ fontSize: 14 }}>
              <div className="spinner" style={{ width: 14, height: 14 }} />
            </div>
          ) : (
            <>
              <div className="route-airport__iata">
                {dep?.iata || depInfo?.iata
                  || (flight.originCountry?.slice(0, 2).toUpperCase() || '??')}
                {dep?.icao && (
                  <button
                    className="airport-toggle-btn"
                    onClick={() => setShowAirportInfo(showAirportInfo === 'dep' ? null : 'dep')}
                  >
                    ℹ
                  </button>
                )}
              </div>
              <div className="route-airport__name">
                {dep?.city || depInfo?.city || flight.originCountry || '—'}
              </div>
              <div className="route-airport__name" style={{ fontSize: 10 }}>
                {dep?.airport || depInfo?.name || ''}
              </div>
              {formatTime(dep?.scheduled) && (
                <div className="route-airport__time">
                  🕐 {formatTime(dep?.actual || dep?.scheduled)}
                  {depDelay > 0 && (
                    <span style={{ color: 'var(--color-warning)', marginLeft: 4 }}>
                      +{depDelay}min
                    </span>
                  )}
                </div>
              )}
            </>
          )}
          <div className="route-airport__time" style={{ marginTop: 4 }}>Partida</div>
        </div>

        {/* barra de progresso central */}
        <div className="route-middle">
          <span className="route-middle__plane">✈</span>
          <div className="route-middle__bar">
            <div
              className="route-middle__progress"
              style={{ width: `${progress ?? 45}%` }}
            />
          </div>
          <span className="route-middle__pct">
            {progress != null ? `${progress}% percorrido` : 'Em trânsito'}
          </span>
        </div>

        {/* destino */}
        <div className="route-airport" style={{ textAlign: 'right' }}>
          {loadingRoute ? (
            <div className="route-airport__iata" style={{ fontSize: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <div className="spinner" style={{ width: 14, height: 14 }} />
            </div>
          ) : (
            <>
              <div className="route-airport__iata">
                {arr?.iata || arrInfo?.iata || heading}
                {arr?.icao && (
                  <button
                    className="airport-toggle-btn"
                    onClick={() => setShowAirportInfo(showAirportInfo === 'arr' ? null : 'arr')}
                  >
                    ℹ
                  </button>
                )}
              </div>
              <div className="route-airport__name">
                {arr?.city || arrInfo?.city || `Rota ${heading}`}
              </div>
              <div className="route-airport__name" style={{ fontSize: 10 }}>
                {arr?.airport || arrInfo?.name || ''}
              </div>
              {formatTime(arr?.scheduled) && (
                <div className="route-airport__time">
                  🕐 {formatTime(arr?.actual || arr?.scheduled)}
                  {arrDelay > 0 && (
                    <span style={{ color: 'var(--color-warning)', marginLeft: 4 }}>
                      +{arrDelay}min
                    </span>
                  )}
                </div>
              )}
            </>
          )}
          <div className="route-airport__time" style={{ marginTop: 4 }}>Destino</div>
        </div>
      </div>

      {/* ── painel meteorológico do aeroporto (METAR/TAF) ── */}
      {showAirportInfo === 'dep' && dep?.icao && (
        <AirportWeatherPanel icaoCode={dep.icao} label="Partida" />
      )}
      {showAirportInfo === 'arr' && arr?.icao && (
        <AirportWeatherPanel icaoCode={arr.icao} label="Destino" />
      )}

      {/* ── painel de informações da aeronave ── */}
      {showAircraftInfo && (
        <AircraftInfoPanel icao24={flight.icao24} />
      )}

      {/* ── clima na posição atual do voo ── */}
      {flight.latitude && flight.longitude && (
        <WeatherWidget
          lat={flight.latitude}
          lon={flight.longitude}
          cityName={dep?.city || depInfo?.city || flight.originCountry || 'Posição do voo'}
        />
      )}

      {/* ── coordenadas, squawk, ultimo contato ── */}
      <div style={{
        marginTop: 12,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-muted)',
      }}>
        <span>
          📍 {Formatters.formatCoord(flight.latitude, 'lat')} /{' '}
          {Formatters.formatCoord(flight.longitude, 'lon')}
        </span>
        {flight.squawk && <span>🔊 Squawk: {flight.squawk}</span>}
        {flight.lastContact && (
          <span>🕐 {Formatters.formatTimestamp(flight.lastContact)}</span>
        )}
        {route?.status && (
          <span style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>
            Status: {route.status}
          </span>
        )}
      </div>
    </div>
  );
}