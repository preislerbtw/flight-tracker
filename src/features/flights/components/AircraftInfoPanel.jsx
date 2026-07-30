import { useAircraftInfo } from '../services/useAircraftInfo.js';

export function AircraftInfoPanel({ icao24 }) {
  const { info, photo, loading } = useAircraftInfo(icao24);

  if (!icao24) return null;

  return (
    <div className="aircraft-info">
      {loading && (
        <div className="aircraft-info__loading">Carregando dados da aeronave…</div>
      )}

      {!loading && !info && (
        <div className="aircraft-info__empty">
          Sem dados de registro disponíveis para essa aeronave.
        </div>
      )}

      {!loading && info && (
        <div className="aircraft-info__content">
          {photo && (
            <a
              href={photo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="aircraft-info__photo-wrap"
            >
              <img
                src={photo.thumbnail_large?.src}
                alt={info.Registration}
                className="aircraft-info__photo"
              />
              <span className="aircraft-info__credit">📷 {photo.photographer}</span>
            </a>
          )}

          <div className="aircraft-info__grid">
            <div>
              <span className="aircraft-info__label">Registro</span>
              <span>{info.Registration || '—'}</span>
            </div>
            <div>
              <span className="aircraft-info__label">Modelo</span>
              <span>{info.Type || '—'}</span>
            </div>
            <div>
              <span className="aircraft-info__label">Fabricante</span>
              <span>{info.Manufacturer || '—'}</span>
            </div>
            <div>
              <span className="aircraft-info__label">Operador</span>
              <span>{info.RegisteredOwners || '—'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="aircraft-info__note">
        * Registro via hexdb.io · foto via Planespotters.net (quando disponível).
      </div>
    </div>
  );
}