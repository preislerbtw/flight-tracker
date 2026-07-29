import { useState, useEffect } from 'react';
import { WeatherAPI } from '../services/weatherAPI.js';

export function WeatherWidget({ lat, lon, cityName }) {
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!lat || !lon) return;

    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      try {
        const data = await WeatherAPI.getWeatherByCoords(lat, lon, cityName);
        if (!cancelled) setWeather(data);
      } catch (err) {
        console.error('[WeatherWidget]', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="spinner" style={{ width: 16, height: 16 }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Carregando clima…
        </span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="weather-widget">
      <div className="weather-widget__icon">{weather.icon}</div>

      <div className="weather-widget__info">
        <div className="weather-widget__temp">{weather.temperature}°C</div>
        <div className="weather-widget__desc">
          {weather.description} · Sensação {weather.feelsLike}°C
        </div>
      </div>

      <div className="weather-widget__location">
        <div style={{ fontSize: 11, marginBottom: 2 }}>{cityName || 'Destino'}</div>
        <div style={{ color: 'var(--color-text-secondary)' }}>
          💧 {weather.humidity}% · 💨 {weather.windSpeed} km/h
        </div>
      </div>
    </div>
  );
}
