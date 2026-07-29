// card de resumo de voo na sidebar

import { Formatters } from '../../../shared/utils/formatters.js';
import { RouteAPI } from '../services/routeAPI.js';

export function FlightCard({ flight, isActive, onSelect, onFavoriteToggle, isFav }) {
  const status   = Formatters.getFlightStatus(flight);
  const speed    = Formatters.formatSpeed(flight.velocity);
  const altitude = Formatters.formatAltitude(flight.baroAltitude);
  const heading  = Formatters.degreesToCardinal(flight.trueTrack);
  
  const cachedRoute = RouteAPI.getCachedRoute(flight.callsign);
  const dep = cachedRoute?.departure;
  const arr = cachedRoute?.arrival;
  const depInfo = cachedRoute?.departureInfo;
  const arrInfo = cachedRoute?.arrivalInfo;

  function handleFavClick(e) {
    e.stopPropagation();
    onFavoriteToggle(flight);
  }

  return (
    <div
      className={`flight-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(flight)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(flight)}
    >
      {/* header: callsign + ações */}
      <div className="flight-card__header">
        <span className="flight-card__callsign">
          {flight.callsign || flight.icao24}
        </span>

        <div className="flight-card__actions">
          {/* badge de status */}
          <span className={`badge badge--${status.cls}`}>
            {status.cls === 'active' && <span className="live-dot" />}
            {status.label}
          </span>

          {/* botão favorito */}
          <button
            className={`btn btn--icon ${isFav ? 'active' : ''}`}
            onClick={handleFavClick}
            title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            style={{ marginLeft: 4 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24"
                 fill={isFav ? 'currentColor' : 'none'}
                 stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* rota origem → destino */}
      <div className="flight-card__route">
        <div className="flight-card__airport">
          <div className="flight-card__iata">
            {dep?.iata || depInfo?.iata
              || (flight.originCountry ? flight.originCountry.slice(0, 2).toUpperCase() : '??')}
          </div>
          <div className="flight-card__city text-mono">
            {dep?.city || depInfo?.city || flight.originCountry || 'Desconhecido'}
          </div>
        </div>

        <div className="flight-card__arrow">
          <span className="flight-card__plane">✈</span>
          <div className="flight-card__line" />
        </div>

        <div className="flight-card__airport" style={{ textAlign: 'right' }}>
          <div className="flight-card__iata">
            {flight.onGround ? 'GND' : (arr?.iata || arrInfo?.iata || heading)}
          </div>
          <div className="flight-card__city text-mono">
            {flight.onGround
              ? 'Em solo'
              : (arr?.city || arrInfo?.city || `Direção ${heading}`)}
          </div>
        </div>
      </div>

      {/* status: velocidade, altitude, ICAO */}
      <div className="flight-card__footer">
        <div className="flight-card__stat">
          <span className="flight-card__stat-label">Vel.</span>
          <span className="flight-card__stat-value">{speed}</span>
        </div>
        <div className="flight-card__stat">
          <span className="flight-card__stat-label">Alt.</span>
          <span className="flight-card__stat-value">{altitude}</span>
        </div>
        <div className="flight-card__stat">
          <span className="flight-card__stat-label">ICAO</span>
          <span className="flight-card__stat-value">{flight.icao24?.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}