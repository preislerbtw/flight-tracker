# FlightTrack ✈

Rastreador de voos em tempo real com mapa interativo, clima e favoritos.

## Stack

- React 18 + Vite
- Leaflet (mapa)
- OpenSky Network API (posições de voos, via proxy serverless)
- AviationStack API (rotas/horários)
- Open-Meteo API (clima)
- Vercel Functions (`api/`) para autenticação OAuth2 e proxy de API

## Estrutura do projeto

```
flight-tracker/
├── api/                      # Vercel Serverless Functions (backend)
│   ├── _lib/openskyAuth.js   # lógica de autenticação OAuth2 com a OpenSky (compartilhada)
│   ├── opensky-token.js      # endpoint: emite/renova o token OpenSky
│   └── opensky/[...path].js  # endpoint: proxy autenticado para a API da OpenSky
│
├── src/
│   ├── app/                  # Composição da aplicação
│   │   └── App.jsx           # componente raiz — conecta features, layout geral
│   │
│   ├── features/             # Regras de negócio, organizadas por domínio
│   │   ├── flights/          # tudo relacionado a voos
│   │   │   ├── components/   # FlightCard, FlightMap, Sidebar, SearchBar...
│   │   │   ├── hooks/        # useFlights, useFlightTrail, useNearbyFlights...
│   │   │   ├── services/     # flightAPI.js, routeAPI.js
│   │   │   └── styles/       # map.css (estilo específico do mapa)
│   │   │
│   │   └── weather/          # tudo relacionado a clima
│   │       ├── components/   # WeatherWidget
│   │       └── services/     # weatherAPI.js
│   │
│   ├── shared/                # Peças reutilizáveis, sem regra de negócio
│   │   ├── hooks/             # useLocalStorage, useTheme, useGeolocation
│   │   ├── utils/             # formatters.js, storage.js, distance.js
│   │   └── styles/            # global.css, components.css
│   │
│   └── main.jsx               # ponto de entrada (monta <App /> no DOM)
│
├── index.html
├── vite.config.js
├── vercel.json
├── .env.example                # modelo das variáveis de ambiente (copie para .env)
└── package.json
```

### Por que essa organização

- **`features/` por domínio, não por tipo de arquivo.** Um componente, seu hook e seu service que mudam juntos ficam na mesma pasta. Se você mexe em algo de voos, tudo que precisa está em `features/flights/`.
- **`shared/` não conhece regras de negócio.** Nada ali sabe o que é um "voo" ou uma "rota" — só utilitários genéricos (formatação, storage, geolocalização, tema).
- **`app/` é a camada de orquestração.** É onde as features se conectam. `features/flights` não importa nada de `features/weather` diretamente — quem faz essa ponte é o `App.jsx` (via `FlightDetails`, que consome `WeatherWidget`).
- **`api/`** fica fora de `src/` porque não é frontend — são funções serverless da Vercel, com seu próprio ciclo de vida e deploy.

### Convenções

| Tipo                | Convenção            | Exemplo              |
|---------------------|----------------------|----------------------|
| Componentes         | PascalCase           | `FlightCard.jsx`     |
| Hooks               | camelCase + `use`    | `useFlights.js`      |
| Services / utils    | camelCase            | `formatters.js`      |

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com suas credenciais
npm run dev
```

## Correções feitas durante a reorganização

Duas inconsistências de nome de arquivo foram corrigidas (funcionavam por acaso em sistemas de arquivo case-insensitive, mas quebrariam em produção na Vercel, que é case-sensitive):

- `src/hooks/useGeoLocation.js` → renomeado para `useGeolocation.js`, batendo com o nome da função exportada (`useGeolocation`) e com o import usado em `NearbyPanel.jsx`.
- `api/lib/` → renomeado para `api/_lib/`, batendo com os imports (`'./_lib/openskyAuth.js'`) já existentes em `opensky-token.js` e `opensky/[...path].js`.
