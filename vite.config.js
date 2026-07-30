import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const OPENSKY_TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
function openSkyAuthPlugin(clientId, clientSecret) {
  let cachedToken = null;
  let expiresAt = 0; // timestamp em que o token atual expira

  async function fetchNewToken() {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(OPENSKY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Falha ao obter token OAuth2 da OpenSky (${res.status}): ${text}`,
      );
    }

    const data = await res.json();
    cachedToken = data.access_token;
    // renova 30s antes de expirar
    const expiresInMs = (data.expires_in ?? 1800) * 1000;
    expiresAt = Date.now() + expiresInMs - 30_000;
    return cachedToken;
  }

  async function getValidToken() {
    if (cachedToken && Date.now() < expiresAt) {
      return cachedToken;
    }
    return fetchNewToken();
  }

  return {
    name: "opensky-auth-plugin",
    configureServer(server) {
      server.middlewares.use("/opensky-token", async (req, res) => {
        try {
          if (!clientId || !clientSecret) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error:
                  "OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET não configurados no .env",
              }),
            );
            return;
          }
          const token = await getValidToken();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ access_token: token }));
        } catch (err) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      openSkyAuthPlugin(env.OPENSKY_CLIENT_ID, env.OPENSKY_CLIENT_SECRET),
    ],
    server: {
      port: 3000,
      open: true,
      proxy: {
        "/opensky": {
          target: "https://opensky-network.org/api",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/opensky/, ""),
        },
        "/aviationstack": {
          target: "https://aviationweather.gov/api/data",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/aviationstack/, ""),
        },
        "/hexdb": {
          target: "https://hexdb.io/api/v1",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hexdb/, ""),
        },
        "/planespotters": {
          target: "https://api.planespotters.net/pub",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/planespotters/, ""),
        },
      },
    },
  };
});
