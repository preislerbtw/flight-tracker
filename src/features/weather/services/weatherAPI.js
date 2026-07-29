
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';

// mapeamento dos códigos WMO de clima para emoji + descrição
const WMO_CODES = {
  0:  { icon: '☀️',  desc: 'Céu limpo' },
  1:  { icon: '🌤️', desc: 'Principalmente limpo' },
  2:  { icon: '⛅',  desc: 'Parcialmente nublado' },
  3:  { icon: '☁️',  desc: 'Nublado' },
  45: { icon: '🌫️', desc: 'Névoa' },
  48: { icon: '🌫️', desc: 'Névoa com gelo' },
  51: { icon: '🌦️', desc: 'Garoa leve' },
  53: { icon: '🌦️', desc: 'Garoa moderada' },
  55: { icon: '🌧️', desc: 'Garoa intensa' },
  61: { icon: '🌧️', desc: 'Chuva leve' },
  63: { icon: '🌧️', desc: 'Chuva moderada' },
  65: { icon: '🌧️', desc: 'Chuva forte' },
  71: { icon: '❄️',  desc: 'Neve leve' },
  73: { icon: '❄️',  desc: 'Neve moderada' },
  75: { icon: '❄️',  desc: 'Neve forte' },
  80: { icon: '⛈️', desc: 'Pancadas de chuva' },
  81: { icon: '⛈️', desc: 'Pancadas fortes' },
  95: { icon: '⛈️', desc: 'Tempestade' },
  99: { icon: '⛈️', desc: 'Tempestade com granizo' },
};

// busca condições atuais de clima por coordenadas

async function getWeatherByCoords(lat, lon, cityName = '') {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current:   [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'weather_code',
    ].join(','),
    wind_speed_unit: 'kmh',
    timezone: 'auto',
  });

  const response = await fetch(`${WEATHER_BASE}?${params}`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar clima: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current;
  const code = current.weather_code;
  const weatherInfo = WMO_CODES[code] || { icon: '🌡️', desc: 'Clima variável' };

  return {
    temperature:    Math.round(current.temperature_2m),
    feelsLike:      Math.round(current.apparent_temperature),
    humidity:       current.relative_humidity_2m,
    windSpeed:      Math.round(current.wind_speed_10m),
    weatherCode:    code,
    icon:           weatherInfo.icon,
    description:    weatherInfo.desc,
    city:           cityName,
    lat,
    lon,
  };
}

export const WeatherAPI = {
  getWeatherByCoords,
  WMO_CODES,
};
