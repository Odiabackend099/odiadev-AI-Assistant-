function parseList(s){
  return String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
}
function validKey(list, provided){
  if(!provided) return false;
  const items = parseList(list);
  return items.includes(provided);
}
function getKey(req){
  return req.headers['x-api-key'] || req.headers['X-API-Key'] || '';
}
module.exports = { parseList, validKey, getKey };
