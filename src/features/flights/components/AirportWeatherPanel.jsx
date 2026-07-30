import { useAirportWeather } from '../services/useAirportWeather.js';

export function AirportWeatherPanel({ icaoCode, label }) {
  const { metar, taf, loading } = useAirportWeather(icaoCode);

  if (!icaoCode) return null;

  return (
    <div className="airport-weather">
      <div className="airport-weather__header">
        <span>{label} · {icaoCode}</span>
        {metar?.fltCat && (
          <span className={`badge badge--${metar.fltCat === 'VFR' ? 'active' : 'warning'}`}>
            {metar.fltCat}
          </span>
        )}
      </div>

      {loading && (
        <div className="airport-weather__loading">Carregando METAR…</div>
      )}

      {!loading && !metar && (
        <div className="airport-weather__empty">
          Sem dados meteorológicos disponíveis para {icaoCode}.
        </div>
      )}

      {!loading && metar && (
        <>
          <div className="airport-weather__grid">
            <div>
              <span className="airport-weather__label">Vento</span>
              <span>{metar.wdir ?? '—'}° · {metar.wspd ?? '—'} kt</span>
            </div>
            <div>
              <span className="airport-weather__label">Visibilidade</span>
              <span>{metar.visib ?? '—'} sm</span>
            </div>
            <div>
              <span className="airport-weather__label">Temp.</span>
              <span>{metar.temp != null ? `${metar.temp}°C` : '—'}</span>
            </div>
            <div>
              <span className="airport-weather__label">QNH</span>
              <span>{metar.altim ?? '—'} hPa</span>
            </div>
          </div>

          <div className="airport-weather__raw">{metar.rawOb}</div>

          {taf?.rawTAF && (
            <div className="airport-weather__taf">
              <strong>TAF:</strong> {taf.rawTAF}
            </div>
          )}
        </>
      )}

      <div className="airport-weather__note">
        * Portões, pistas e horários locais não têm API gratuita confiável — disponível apenas METAR/TAF.
      </div>
    </div>
  );
}