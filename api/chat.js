const { validKey, getKey, cors } = require('./_lib/auth');

module.exports = async function handler(req, res){
  cors(res);
  if (req.method === 'OPTIONS') return res.end();

  if(req.method !== 'POST'){ res.statusCode=405; return res.end('Use POST'); }

  const ok = validKey(process.env.VALID_API_KEYS, getKey(req));
  if(!ok){ res.statusCode=401; return res.end('Invalid X-API-Key'); }

  let body='';
  for await (const chunk of req) body += chunk;
  let text='';
  try{ text = JSON.parse(body).text || ''; } catch{}
  text = String(text||'').trim();
  if(!text){ res.statusCode=400; return res.end('missing text'); }

  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
  const system = 'You are the ODIADEV Voice AI assistant for Nigerian businesses. Keep replies concise, clear, Naija-friendly.';

  if(!apiKey){
    const reply = `Echo (no LLM key set): ${text}`;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    return res.end(JSON.stringify({ reply }));
  }

  try{
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        system,
        messages: [{ role: 'user', content: text }]
      })
    });
    if(!r.ok){
      const errText = await r.text();
      res.statusCode = r.status;
      return res.end(`Anthropic error ${r.status}: ${errText}`);
    }
    const data = await r.json();
    let reply = '';
    try {
      if (data && Array.isArray(data.content) && data.content.length) {
        const first = data.content[0];
        reply = (first && (first.text || first.content || '')) || '';
      }
      if(!reply && data?.content?.[0]?.type === 'text'){
        reply = data.content[0].text || '';
      }
    } catch{}
    if(!reply) reply = 'Sorry, I no fit get response right now.';
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({ reply }));
  }catch(e){
    res.statusCode = 500;
    res.end('chat failure: ' + (e && e.message || 'unknown'));
  }
};