import { useState, useEffect } from 'react';
import { useFlights }          from '../features/flights/hooks/useFlights.js';
import { useFlightTrail }      from '../features/flights/hooks/useFlightTrail.js';
import { useFlightRoute }      from '../features/flights/hooks/useFlightRoute.js';
import { useLocalStorage }     from '../shared/hooks/useLocalStorage.js';
import { useTheme }            from '../shared/hooks/useTheme.js';
import { useShareableFlight }  from '../features/flights/hooks/useShareableFlight.js';
import { Storage }             from '../shared/utils/storage.js';
import { SearchBar }           from '../features/flights/components/SearchBar.jsx';
import { Sidebar }             from '../features/flights/components/Sidebar.jsx';
import { FlightMap }           from '../features/flights/components/FlightMap.jsx';
import { FlightDetails }       from '../features/flights/components/FlightDetails.jsx';
import { ShareButton }         from '../features/flights/components/ShareButton.jsx';
import { NearbyPanel }         from '../features/flights/components/NearbyPanel.jsx';

export default function App() {
  const {
    flights,
    selectedFlight,
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
  } = useFlights();

  // rastro de trajetória do voo selecionado
  const { trail, clearTrail } = useFlightTrail(selectedFlight, flights);

  // dados de rota real - avitation track
  const { route, loadingRoute } = useFlightRoute(selectedFlight);

  const [toast, setToast] = useState(null);
  const [favs, setFavs]   = useLocalStorage(Storage.KEYS.FAVORITES, []);
  const { theme, toggle } = useTheme();

  // guarda o icao24 de um voo compartilhado até ele aparecer na lista de voos
  const [pendingShareId, setPendingShareId] = useState(null);

  const { getShareLink } = useShareableFlight(selectedFlight?.icao24 ?? null, (icao24) => {
    setPendingShareId(icao24);
  });

  // modo "perto de mim"
  const [showNearby, setShowNearby] = useState(false);

  // quando os voos carregarem/atualizarem, tenta selecionar o voo compartilhado
  useEffect(() => {
    if (!pendingShareId || flights.length === 0) return;
    const match = flights.find((f) => f.icao24 === pendingShareId);
    if (match) {
      selectFlight(match);
      setPendingShareId(null);
    }
  }, [pendingShareId, flights]);

  function showToast(msg, duration = 2500) {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }

  async function handleSearch(callsign) {
    const result = await searchFlight(callsign);
    if (result) showToast(`✈ Voo ${result.callsign} encontrado!`);
  }

  function handleFavoriteToggle(flight) {
    if (Storage.isFavorite(flight.icao24)) {
      const updated = Storage.removeFavorite(flight.icao24);
      setFavs(updated);
      showToast('Removido dos favoritos');
    } else {
      const updated = Storage.addFavorite(flight);
      setFavs(updated);
      showToast(`♥ ${flight.callsign} salvo!`);
    }
  }

  function handleClearSelection() {
    clearSelection();
    clearTrail();
  }

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const lastUpdateStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : '—';

  return (
    <div className="app-layout">

      {/*header*/}
      <header className="app-header">
        <div className="header__logo">
          <span className="header__logo-icon">✈</span>
          <span className="header__logo-text">FLIGHT<span>TRACK</span></span>
        </div>

        <div className="header__search">
          <SearchBar onSearch={handleSearch} loading={searching} />
        </div>

        <div className="header__meta">
          <span className="live-dot" />
          <span>{totalCount} voos</span>
          <span style={{ color: 'var(--color-border-2)' }}>|</span>
          <span>{lastUpdateStr}</span>

          <button
            className="btn btn--icon"
            onClick={refresh}
            title="Atualizar agora"
            disabled={loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                 style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>

          <label className="switch" title="Alternar Tema">
            <input
            type="checkbox"
            checked={theme === 'light'}
            onChange={toggle}
            />
            <span className="slider"/>
          </label>
        </div>
      </header>

      {/*sidebar*/}
      <Sidebar
        flights={flights}
        selectedFlight={selectedFlight}
        onSelectFlight={selectFlight}
        loading={loading}
      />

      {/*mapa*/}
      <main className="app-map">
        <FlightMap
          flights={flights}
          selectedFlight={selectedFlight}
          onSelectFlight={selectFlight}
          loading={loading && flights.length === 0}
          theme={theme}
          trail={trail}
          route={route}
        />

        {/*contador*/}
        <div className="map-counter">
          <span className="live-dot" />
          <span className="map-counter__num">{totalCount}</span>
          <span>voos na área</span>
        </div>

        {/*botões flutuantes: compartilhar + perto de mim*/}
        <div className="share-button-wrapper" style={{ top: 64, display: 'flex', gap: 8 }}>
          {selectedFlight && <ShareButton getShareLink={getShareLink} />}
          <button className="nearby-btn" onClick={() => setShowNearby((v) => !v)}>
            📍 Perto de mim
          </button>
        </div>

        {/*painel "perto de mim"*/}
        {showNearby && (
          <NearbyPanel
            flights={flights}
            onSelectFlight={selectFlight}
            onClose={() => setShowNearby(false)}
            onPassingNow={(f) => showToast(`✈ ${f.callsign} passando perto de você!`)}
          />
        )}

        {/*painel de detalhes*/}
        {selectedFlight && (
          <FlightDetails
            flight={selectedFlight}
            onClose={handleClearSelection}
            onFavoriteToggle={handleFavoriteToggle}
            isFav={Storage.isFavorite(selectedFlight.icao24)}
            route={route}
            loadingRoute={loadingRoute}
          />
        )}

        {/* erro */}
        {error && (
          <div className="toast" style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}>
            ⚠ {error}
          </div>
        )}

        {/*toast*/}
        {toast && !error && (
          <div className="toast">{toast}</div>
        )}
      </main>
    </div>
  );
}