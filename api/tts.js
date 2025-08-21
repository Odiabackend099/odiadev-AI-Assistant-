const { validKey, getKey, cors } = require('./_lib/auth');

async function tryEndpoints(base, userKey, text, voice){
  const urlBase = (base||'').replace(/\/$/, '');
  const candidates = [
    { url: `${urlBase}/speak?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`, method:'GET' },
    { url: `${urlBase}/speak`, method:'POST', body: JSON.stringify({ text, voice }) },
    { url: `${urlBase}/synthesize`, method:'POST', body: JSON.stringify({ text, voice }) },
    { url: `${urlBase}/api/synthesize`, method:'POST', body: JSON.stringify({ text, voice }) },
  ];
  for (const c of candidates){
    const headers = { 'x-api-key': userKey }; if (c.method==='POST') headers['content-type']='application/json';
    const r = await fetch(c.url, { method:c.method, headers, body:c.body });
    if (r.ok){ const buf = Buffer.from(await r.arrayBuffer()); return { ok:true, buf, type: r.headers.get('content-type') || 'audio/mpeg', used:c.url }; }
    try{ console.error('TTS candidate failed:', c.url, await r.text()); }catch{}
  }
  return { ok:false };
}

module.exports = async function handler(req, res){
  cors(res); if (req.method === 'OPTIONS') return res.end();
  const userKey = getKey(req);
  const gateOK = validKey(process.env.VALID_API_KEYS, userKey);
  if(!gateOK){ res.statusCode=401; return res.end('Invalid X-API-Key'); }

  let text='', voice='female';
  if(req.method==='GET'){ const url = new URL(req.url,'http://localhost'); text=(url.searchParams.get('text')||'').trim(); voice=(url.searchParams.get('voice')||voice).trim(); }
  else { let body=''; for await (const chunk of req) body+=chunk; try{ const j=JSON.parse(body||'{}'); text=(j.text||'').trim(); voice=(j.voice||voice).trim(); }catch{} }
  if(!text){ res.statusCode=400; return res.end('missing text'); }

  const base = process.env.TTS_SERVICE_URL || '';
  if(!base){ res.statusCode=200; res.setHeader('Content-Type','application/json; charset=utf-8'); return res.end(JSON.stringify({ fallback:true, note:'No TTS service configured' })); }

  try{
    const tried = await tryEndpoints(base, userKey, text, voice);
    if(tried.ok){ res.setHeader('Content-Type', tried.type); res.setHeader('Cache-Control','no-store'); return res.end(tried.buf); }
    res.statusCode=502; res.end('TTS upstream unavailable');
  }catch(e){ res.statusCode=500; res.end('tts proxy failure: ' + (e?.message || 'unknown')); }
};