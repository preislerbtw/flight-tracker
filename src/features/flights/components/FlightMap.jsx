import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';
import { Formatters } from '../../../shared/utils/formatters.js';

const TILES = {
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

export function FlightMap({
  flights,
  selectedFlight,
  onSelectFlight,
  loading,
  theme,
  trail = [],        // array de [lat, lon] — rastro do voo selecionado
  route = null,      // objeto de rota com departureInfo / arrivalInfo
}) {
  const mapContainerRef  = useRef(null);
  const mapInstanceRef   = useRef(null);
  const tileLayerRef     = useRef(null);
  const markersRef       = useRef({});
  const selectedRef      = useRef(null);
  const trailPolyRef     = useRef(null);   // L.Polyline do rastro
  const airportLayerRef  = useRef(null);   // L.LayerGroup dos aeroportos

  // icone SVG de avião rotacionado
  function createPlaneIcon(trueTrack = 0, isSelected = false) {
    const size  = isSelected ? 26 : 20;
    const color = isSelected ? '#00ff8c' : '#00ff8c';
    const glow  = isSelected
      ? 'filter: drop-shadow(0 0 6px rgba(18, 238, 128, 0.8));'
      : '';

    return L.divIcon({
      html: `
        <div style="
          width:${size}px; height:${size}px;
          display:flex; align-items:center; justify-content:center;
          transform:rotate(${trueTrack}deg);
          ${glow}
        ">
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>`,
      className: '',
      iconSize:   [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // icone de aeroporto
  function createAirportIcon(iata, type) {
    const color = type === 'departure' ? '#4ade80' : '#f87171';
    return L.divIcon({
      html: `
        <div style="
          background:var(--color-surface,#111);
          border:2px solid ${color};
          border-radius:6px;
          padding:2px 6px;
          font-family:monospace;
          font-size:11px;
          font-weight:700;
          color:${color};
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ">${iata}</div>`,
      className: '',
      iconAnchor: [0, 0],
    });
  }

  // inicializa o mapa
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // regiao da america do sul
    mapInstanceRef.current = L.map(mapContainerRef.current, {
      center:             [10, -40],
      zoom:               4,
      zoomControl:        true,
      attributionControl: true,
    });
    
    /*
    mapInstanceRef.current = L.map(mapContainerRef.current, {
      center:             [50, -12],
      zoom:               4,
      zoomControl:        true,
      attributionControl: true,
    });
    */

    

    tileLayerRef.current = L.tileLayer(TILES.light, {
      attribution: '© <a href="https://carto.com">CARTO</a> | Dados: OpenSky Network',
      subdomains:  'abcd',
      maxZoom:     19,
    }).addTo(mapInstanceRef.current);

    airportLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current   = null;
      tileLayerRef.current     = null;
      airportLayerRef.current  = null;
    };
  }, []);

  // toca tile ao mudar tema
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(theme === 'dark' ? TILES.dark : TILES.light);
  }, [theme]);

  // atualiza marcadores de voos
  useEffect(() => {
    if (!mapInstanceRef.current || !flights.length) return;

    const map       = mapInstanceRef.current;
    const markers   = markersRef.current;
    const activeIds = new Set(flights.map(f => f.icao24));
    const curSelId  = selectedRef.current;

    flights.forEach(flight => {
      const { icao24, latitude, longitude, trueTrack, callsign, velocity, baroAltitude } = flight;
      if (!latitude || !longitude) return;

      const isSelected = icao24 === curSelId;
      const icon       = createPlaneIcon(trueTrack || 0, isSelected);

      if (markers[icao24]) {
        markers[icao24].setLatLng([latitude, longitude]);
        markers[icao24].setIcon(icon);
      } else {
        const popup = `
          <div class="map-popup">
            <div class="map-popup__callsign">${callsign || icao24.toUpperCase()}</div>
            <div class="map-popup__row"><span>Vel.</span><span>${Formatters.formatSpeed(velocity)}</span></div>
            <div class="map-popup__row"><span>Alt.</span><span>${Formatters.formatAltitude(baroAltitude)}</span></div>
            <button class="map-popup__btn" id="popup-btn-${icao24}">Ver detalhes</button>
          </div>`;

        const marker = L.marker([latitude, longitude], { icon })
          .addTo(map)
          .bindPopup(popup, { closeButton: false, maxWidth: 240 });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`popup-btn-${icao24}`);
          btn?.addEventListener('click', () => {
            onSelectFlight(flight);
            marker.closePopup();
          });
        });

        marker.on('click', () => onSelectFlight(flight));
        markers[icao24] = marker;
      }
    });

    // Remove marcadores de voos que saíram da área
    Object.keys(markers).forEach(id => {
      if (!activeIds.has(id)) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }
    });
  }, [flights]);

  // destaca voo selecionado e centraliza mapa 
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map     = mapInstanceRef.current;
    const markers = markersRef.current;
    const prevId  = selectedRef.current;

    // restaura ícone do voo anteriormente selecionado
    if (prevId && markers[prevId]) {
      const prev = flights.find(f => f.icao24 === prevId);
      if (prev) markers[prevId].setIcon(createPlaneIcon(prev.trueTrack || 0, false));
    }

    if (!selectedFlight) {
      selectedRef.current = null;
      return;
    }

    const { icao24, latitude, longitude, trueTrack } = selectedFlight;
    selectedRef.current = icao24;

    if (markers[icao24]) {
      markers[icao24].setIcon(createPlaneIcon(trueTrack || 0, true));
    }

    if (latitude && longitude) {
      map.flyTo([latitude, longitude], 7, { duration: 1.2 });
    }
  }, [selectedFlight]);

  // desenha rastro (polyline) do voo selecionado 
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // remove rastro anterior
    if (trailPolyRef.current) {
      map.removeLayer(trailPolyRef.current);
      trailPolyRef.current = null;
    }

    if (trail.length < 2) return;

    trailPolyRef.current = L.polyline(trail, {
      color:     '#ffffff',
      weight:    2,
      opacity:   0.7,
      dashArray: '6 4',
      lineCap:   'round',
    }).addTo(map);
  }, [trail]);

  // marcadores de aeroporto de origem/destino 
  useEffect(() => {
    const layer = airportLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (!route) return;

    const { departureInfo, arrivalInfo, departure, arrival } = route;

    // aeroporto de partida (verde)
    const dep = departureInfo || (departure?.lat ? departure : null);
    if (dep?.lat && dep?.lon) {
      const iata = departure?.iata || departureInfo?.iata || '???';
      L.marker([dep.lat, dep.lon], {
        icon: createAirportIcon(iata, 'departure'),
      })
        .addTo(layer)
        .bindTooltip(
          `🛫 Partida: ${departure?.airport || dep.name || iata}<br>${dep.city || ''}`,
          { permanent: false, direction: 'top' }
        );

      // linha pontilhada da origem até a posição atual
      if (selectedFlight?.latitude && selectedFlight?.longitude) {
        L.polyline(
          [[dep.lat, dep.lon], [selectedFlight.latitude, selectedFlight.longitude]],
          { color: '#4ade80', weight: 1.5, opacity: 0.4, dashArray: '4 6' }
        ).addTo(layer);
      }
    }

    // aeroporto de destino (vermelho)
    const arr = arrivalInfo || (arrival?.lat ? arrival : null);
    if (arr?.lat && arr?.lon) {
      const iata = arrival?.iata || arrivalInfo?.iata || '???';
      L.marker([arr.lat, arr.lon], {
        icon: createAirportIcon(iata, 'arrival'),
      })
        .addTo(layer)
        .bindTooltip(
          `🛬 Destino: ${arrival?.airport || arr.name || iata}<br>${arr.city || ''}`,
          { permanent: false, direction: 'top' }
        );

      // linha pontilhada da posição atual até o destino
      if (selectedFlight?.latitude && selectedFlight?.longitude) {
        L.polyline(
          [[selectedFlight.latitude, selectedFlight.longitude], [arr.lat, arr.lon]],
          { color: '#f87171', weight: 1.5, opacity: 0.4, dashArray: '4 6' }
        ).addTo(layer);
      }
    }
  }, [route, selectedFlight?.latitude, selectedFlight?.longitude]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} id="flight-map" />

      {loading && (
        <div className="map-loading-overlay">
          <div className="spinner" />
          <span>Atualizando voos…</span>
        </div>
      )}
    </div>
  );
}