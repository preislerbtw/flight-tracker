import { getValidToken } from './_lib/openskyAuth.js';

export default async function handler(req, res) {
    try{
        const token = await getValidToken();
        res.status(200).json({ access_token: token });
    }
    catch(error){
        console.error('[opensky-token]', error.message);
        res.status(500).json({ error: error.message });
    }
}