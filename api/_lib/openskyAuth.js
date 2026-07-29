const OPENSKY_TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

let cachedToken = null;
let expireAt = 0;

export async function getValidToken() {
    const clientId = process.env.OPENSKY_TOKEN_URL;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

    if(!clientId || !clientSecret){
        throw new Error('Missing OpenSky client ID or secret');
    }

    if(cachedToken && Date.now() < expireAt){
        return cachedToken;
    }
    
    const body= new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    })

    const res = await fetch(OPENSKY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    });

    if(!res.ok){
        throw new Error(`Failed to fetch OpenSky token: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;

    const expireInMs = (data.expires_in || 3600) * 1000; // renova 30s antes de expirar 
    expireAt = Date.now() + expireInMs - 30000;

    return cachedToken;

}