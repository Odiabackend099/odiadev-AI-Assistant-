function parseList(s){ return String(s||'').split(',').map(x=>x.trim()).filter(Boolean); }
function validKey(list, provided){ if(!provided) return false; const items = parseList(list); return items.includes(provided); }
function getKey(req){ return req.headers['x-api-key'] || req.headers['X-API-Key'] || ''; }
function cors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
}
module.exports = { parseList, validKey, getKey, cors };