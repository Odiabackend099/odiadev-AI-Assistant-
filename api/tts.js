const { validKey, getKey } = require('./_lib/auth');
module.exports = async function handler(req, res){
  const good = validKey(process.env.VALID_API_KEYS, getKey(req));
  if(!good){ res.statusCode=401; return res.end('Invalid X-API-Key'); }

  let text = '';
  let voice = 'nigerian-english';

  if(req.method === 'GET'){
    const url = new URL(req.url, 'http://localhost');
    text = (url.searchParams.get('text') || '').trim();
    voice = (url.searchParams.get('voice') || voice).trim();
  } else {
    let body='';
    for await (const chunk of req) body += chunk;
    try{
      const j = JSON.parse(body||'{}');
      text = (j.text||'').trim();
      voice = (j.voice||voice).trim();
    }catch{}
  }

  if(!text){ res.statusCode=400; return res.end('missing text'); }

  const base = process.env.TTS_SERVICE_URL || '';
  const key = process.env.TTS_SERVICE_KEY || '';
  if(!base || !key){
    res.statusCode=500;
    return res.end('TTS not configured');
  }

  try{
    const r = await fetch(`${base.replace(/\/$/,'')}/api/synthesize`, {
      method: 'POST',
      headers: { 'content-type':'application/json', 'authorization': 'Bearer ' + key },
      body: JSON.stringify({ text, voice })
    });
    if(!r.ok){
      const et = await r.text();
      res.statusCode = 502;
      return res.end('Upstream TTS error: ' + et);
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Cache-Control','no-store');
    res.end(buf);
  }catch(e){
    res.statusCode=500;
    res.end('tts proxy failure: ' + (e && e.message || 'unknown'));
  }
};