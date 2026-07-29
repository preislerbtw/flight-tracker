import { useState } from 'react';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage.js';
import { Storage } from '../../../shared/utils/storage.js';
import { FlightCard } from './FlightCard.jsx';

export function Sidebar({ flights, selectedFlight, onSelectFlight, loading }) {
  const [activeTab, setActiveTab] = useState('live');

  // estado de favoritos e histórico sincronizado com localstorage
  const [favorites, setFavorites] = useLocalStorage(Storage.KEYS.FAVORITES, []);
  const [history,   setHistory  ] = useLocalStorage(Storage.KEYS.HISTORY,   []);

  function handleFavoriteToggle(flight) {
    if (Storage.isFavorite(flight.icao24)) {
      const updated = Storage.removeFavorite(flight.icao24);
      setFavorites(updated);
    } else {
      const updated = Storage.addFavorite(flight);
      setFavorites(updated);
    }
  }

  function handleClearHistory() {
    const updated = Storage.clearHistory();
    setHistory(updated);
  }

  // ao clicar num item do histórico, tenta selecionar nos voos ativos
  function handleHistoryClick(entry) {
    const found = flights.find(f =>
      f.callsign?.trim().toUpperCase() === entry.query ||
      f.icao24   === entry.icao24
    );
    if (found) onSelectFlight(found);
  }

  return (
    <aside className="app-sidebar">
      {/* abas */}
      <div className="sidebar__tabs">
        <button
          className={`sidebar__tab ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Ao vivo
          <span className="sidebar__count">{flights.length}</span>
        </button>

        <button
          className={`sidebar__tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Favoritos
          {favorites.length > 0 && (
            <span className="sidebar__count">{favorites.length}</span>
          )}
        </button>

        <button
          className={`sidebar__tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Histórico
          {history.length > 0 && (
            <span className="sidebar__count">{history.length}</span>
          )}
        </button>
      </div>

      {/* Conteúdo */}
      <div className="sidebar__body">

        {/* ── Aba: Ao vivo ── */}
        {activeTab === 'live' && (
          <>
            {loading && flights.length === 0 ? (
              <div className="sidebar__empty">
                <div className="spinner" style={{ width: 28, height: 28 }} />
                <p>Carregando voos ao vivo…</p>
              </div>
            ) : flights.length === 0 ? (
              <div className="sidebar__empty">
                <div className="sidebar__empty-icon">✈</div>
                <p>Nenhum voo encontrado na área</p>
              </div>
            ) : (
              flights
                .filter(f => f.latitude && f.longitude)
                .slice(0, 80) // limita para performance na UI
                .map(flight => (
                  <FlightCard
                    key={flight.icao24}
                    flight={flight}
                    isActive={selectedFlight?.icao24 === flight.icao24}
                    onSelect={onSelectFlight}
                    onFavoriteToggle={handleFavoriteToggle}
                    isFav={Storage.isFavorite(flight.icao24)}
                  />
                ))
            )}
          </>
        )}

        {/* ── aba: Favoritos ── */}
        {activeTab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div className="sidebar__empty">
                {/*<div className="sidebar__empty-icon">♥</div>*/}
                <p>Nenhum favorito salvo ainda.</p>
              </div>
            ) : (
              favorites.map(fav => {
                // tenta encontrar nos voos ao vivo
                const live = flights.find(f => f.icao24 === fav.icao24);

                return live ? (
                  <FlightCard
                    key={fav.icao24}
                    flight={live}
                    isActive={selectedFlight?.icao24 === fav.icao24}
                    onSelect={onSelectFlight}
                    onFavoriteToggle={handleFavoriteToggle}
                    isFav={true}
                  />
                ) : (
                  // voo não está mais ao vivo
                  <div
                    key={fav.icao24}
                    className="flight-card"
                    style={{ opacity: 0.5 }}
                  >
                    <div className="flight-card__header">
                      <span className="flight-card__callsign">{fav.callsign}</span>
                      <span className="badge badge--unknown">Offline</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {fav.originCountry} · {fav.icao24?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6 }}>
                      Salvo em {new Date(fav.savedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── aba: Histórico ── */}
        {activeTab === 'history' && (
          <>
            {history.length === 0 ? (
              <div className="sidebar__empty">
                <div className="sidebar__empty-icon"></div>
                <p>Nenhuma busca ainda.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <button
                    className="btn btn--ghost"
                    onClick={handleClearHistory}
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    Limpar histórico
                  </button>
                </div>

                {history.map(entry => (
                  <div
                    key={entry.id}
                    className="flight-card"
                    onClick={() => handleHistoryClick(entry)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flight-card__header">
                      <span className="flight-card__callsign text-mono">
                        {entry.query}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(entry.searchedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {entry.originCountry || 'Resultado não encontrado'}
                      {entry.icao24 && ` · ${entry.icao24.toUpperCase()}`}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

      </div>
    </aside>
  );
}
