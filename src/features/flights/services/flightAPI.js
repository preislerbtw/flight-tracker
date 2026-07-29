// centraliza todas as chamadas à OpenSky Network API

const OPENSKY_BASE = '/opensky';

let tokenCache = null;

async function getAuthHeaders() {
  try {
    const res = await fetch('/opensky-token');
    if (!res.ok) {
      return {};
    }
    const data = await res.json();
    tokenCache = data.access_token;
    return tokenCache ? { Authorization: `Bearer ${tokenCache}` } : {};
  } catch {
    return {};
  }
}
// regiao da america do sul

const DEFAULT_BOUNDS = {
  lamin: -34,   // latitude mínima (sul do RS)
  lamax: 6,     // latitude máxima (norte de RR)
  lomin: -74,   // longitude mínima (oeste do AC)
  lomax: -32,   // longitude máxima (litoral leste)
};

/*
const DEFAULT_BOUNDS = {
  lamin: 34,    // latitude mínima (sul da Grécia/Espanha)
  lamax: 71,    // latitude máxima (norte da Noruega)
  lomin: -25,   // longitude mínima (Islândia/oeste de Portugal)
  lomax: 45,    // longitude máxima (Ural/fronteira com a Turquia)
};
*/

function parseState(raw) {
  return {
    icao24:      raw[0],
    callsign:    raw[1]?.trim() || 'N/A',
    originCountry: raw[2] || 'Desconhecido',
    timePosition: raw[3],
    lastContact:  raw[4],
    longitude:    raw[5],
    latitude:     raw[6],
    baroAltitude: raw[7],      // metros
    onGround:     raw[8],
    velocity:     raw[9],      // m/s
    trueTrack:    raw[10],     // graus (direção)
    verticalRate: raw[11],     // m/s (sobe/desce)
    geoAltitude:  raw[13],     // metros
    squawk:       raw[14],
    spi:          raw[15],
    positionSource: raw[16],
  };
}


// busca todos os voos numa área geográfica

async function getFlightsByArea(bounds = DEFAULT_BOUNDS) {
  const { lamin, lamax, lomin, lomax } = bounds;
  const url = `${OPENSKY_BASE}/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;

  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error(
        `Limite de requisições da OpenSky atingido (HTTP ${response.status}). ` +
        `Usuários anônimos têm cota diária baixa — aguarde alguns minutos ou ` +
        `aumente o intervalo de atualização.`
      );
    }
    throw new Error(`Erro na API OpenSky: ${response.status}`);
  }

  const data = await response.json();
  const states = data.states || [];

  // filtra voos sem posição e converte
  return states
    .filter(s => s[5] !== null && s[6] !== null)
    .map(parseState);
}

// busca um voo específico por callsign (número do voo)

async function getFlightByCallsign(callsign) {
  if (!callsign || callsign.length < 3) {
    throw new Error('Callsign inválido');
  }

  // a opensky retorna todos os voos ativos; filtramos pelo callsign
  const url = `${OPENSKY_BASE}/states/all`;
  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Erro na API OpenSky: ${response.status}`);
  }

  const data = await response.json();
  const states = data.states || [];

  const normalizado = callsign.trim().toUpperCase();

  const encontrado = states.find(s => {
    const cs = s[1]?.trim().toUpperCase();
    return cs === normalizado || cs?.startsWith(normalizado);
  });

  if (!encontrado) {
    return null;
  }

  return parseState(encontrado);
}


// busca rota de um voo (últimas posições)

async function getFlightRoute(icao24) {
  // janela de tempo: ultimas 12 horas
  const now = Math.floor(Date.now() / 1000);
  const begin = now - 43200; // 12h atras

  const url = `${OPENSKY_BASE}/flights/aircraft?icao24=${icao24}&begin=${begin}&end=${now}`;

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

const AIRPORTS_DB = {
  // brasil
  SBGR: { iata: 'GRU', name: 'São Paulo–Guarulhos', city: 'São Paulo', lat: -23.4356, lon: -46.4731 },
  SBBR: { iata: 'BSB', name: 'Brasília Internacional', city: 'Brasília', lat: -15.8711, lon: -47.9186 },
  SBGL: { iata: 'GIG', name: 'Rio de Janeiro–Galeão', city: 'Rio de Janeiro', lat: -22.8099, lon: -43.2505 },
  SBCF: { iata: 'CNF', name: 'Belo Horizonte–Confins', city: 'Belo Horizonte', lat: -19.6244, lon: -43.9719 },
  SBSV: { iata: 'SSA', name: 'Salvador–Deputado Luís Eduardo', city: 'Salvador', lat: -12.9086, lon: -38.3225 },
  SBRF: { iata: 'REC', name: 'Recife–Guararapes', city: 'Recife', lat: -8.1265, lon: -34.9237 },
  SBFZ: { iata: 'FOR', name: 'Fortaleza–Pinto Martins', city: 'Fortaleza', lat: -3.7763, lon: -38.5326 },
  SBPA: { iata: 'POA', name: 'Porto Alegre–Salgado Filho', city: 'Porto Alegre', lat: -29.9944, lon: -51.1714 },
  SBCT: { iata: 'CWB', name: 'Curitiba–Afonso Pena', city: 'Curitiba', lat: -25.5285, lon: -49.1758 },
  SBMN: { iata: 'MAO', name: 'Manaus–Eduardo Gomes', city: 'Manaus', lat: -3.0386, lon: -60.0497 },
  // eua
  KJFK: { iata: 'JFK', name: 'John F. Kennedy Internacional', city: 'Nova York', lat: 40.6413, lon: -73.7781 },
  KLAX: { iata: 'LAX', name: 'Los Angeles Internacional', city: 'Los Angeles', lat: 33.9425, lon: -118.4081 },
  KORD: { iata: 'ORD', name: "O'Hare Internacional", city: 'Chicago', lat: 41.9742, lon: -87.9073 },
  KMIA: { iata: 'MIA', name: 'Miami Internacional', city: 'Miami', lat: 25.7959, lon: -80.2870 },
  KATL: { iata: 'ATL', name: 'Atlanta Hartsfield–Jackson', city: 'Atlanta', lat: 33.6407, lon: -84.4277 },
  // eua
  EGLL: { iata: 'LHR', name: 'Londres Heathrow', city: 'Londres', lat: 51.4775, lon: -0.4614 },
  LFPG: { iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', lat: 49.0097, lon: 2.5479 },
  EDDF: { iata: 'FRA', name: 'Frankfurt Internacional', city: 'Frankfurt', lat: 50.0379, lon: 8.5622 },
  LEMD: { iata: 'MAD', name: 'Madrid Barajas', city: 'Madri', lat: 40.4719, lon: -3.5626 },
  LIRF: { iata: 'FCO', name: 'Roma Fiumicino', city: 'Roma', lat: 41.8003, lon: 12.2389 },
  // america latina
  SEQM: { iata: 'UIO', name: 'Quito Internacional', city: 'Quito', lat: -0.1292, lon: -78.3575 },
  SKBO: { iata: 'BOG', name: 'Bogotá El Dorado', city: 'Bogotá', lat: 4.7016, lon: -74.1469 },
  SAEZ: { iata: 'EZE', name: 'Buenos Aires Ezeiza', city: 'Buenos Aires', lat: -34.8222, lon: -58.5358 },
  SCEL: { iata: 'SCL', name: 'Santiago Arturo Merino Benítez', city: 'Santiago', lat: -33.3930, lon: -70.7858 },
  MMMX: { iata: 'MEX', name: 'Cidade do México Internacional', city: 'Cidade do México', lat: 19.4363, lon: -99.0721 },
};

function getAirportInfo(icaoCode) {
  if (!icaoCode) return null;
  return AIRPORTS_DB[icaoCode.toUpperCase()] || null;
}

export const FlightAPI = {
  getFlightsByArea,
  getFlightByCallsign,
  getFlightRoute,
  getAirportInfo,
  DEFAULT_BOUNDS,
};