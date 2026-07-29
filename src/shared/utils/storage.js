const KEYS = {
  FAVORITES:  'ft_favorites',
  HISTORY:    'ft_history',
  SETTINGS:   'ft_settings',
};

const MAX_HISTORY = 20; // maximo de itens no historico

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// favoritos

function getFavorites() {
  return get(KEYS.FAVORITES, []);
}

function addFavorite(flight) {
  const favorites = getFavorites();
  const exists = favorites.some(f => f.icao24 === flight.icao24);
  if (exists) return favorites;

  const entry = {
    icao24:    flight.icao24,
    callsign:  flight.callsign,
    originCountry: flight.originCountry,
    savedAt:   Date.now(),
  };

  const updated = [entry, ...favorites].slice(0, 50);
  set(KEYS.FAVORITES, updated);
  return updated;
}

function removeFavorite(icao24) {
  const updated = getFavorites().filter(f => f.icao24 !== icao24);
  set(KEYS.FAVORITES, updated);
  return updated;
}

function isFavorite(icao24) {
  return getFavorites().some(f => f.icao24 === icao24);
}

// historico de buscas ────────────────────────────

function getHistory() {
  return get(KEYS.HISTORY, []);
}

function addToHistory(searchTerm, result) {
  const history = getHistory();
  const entry = {
    id:         Date.now(),
    query:      searchTerm.toUpperCase().trim(),
    callsign:   result?.callsign || searchTerm,
    icao24:     result?.icao24,
    originCountry: result?.originCountry,
    searchedAt: Date.now(),
  };

  // remove duplicata se existir
  const filtered = history.filter(h => h.query !== entry.query);
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
  set(KEYS.HISTORY, updated);
  return updated;
}

function clearHistory() {
  remove(KEYS.HISTORY);
  return [];
}

//configurações do usuário 

function getSettings() {
  return get(KEYS.SETTINGS, {
    autoRefresh: true,
    refreshInterval: 60, // segundos
    showLabels: false,
    mapStyle: 'dark',
  });
}

function updateSettings(partial) {
  const current = getSettings();
  const updated = { ...current, ...partial };
  set(KEYS.SETTINGS, updated);
  return updated;
}

export const Storage = {
  KEYS,
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  getHistory,
  addToHistory,
  clearHistory,
  getSettings,
  updateSettings,
};
