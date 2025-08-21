const { validKey, getKey } = require('./_lib/auth');
module.exports = async function handler(req, res){
  const ok = validKey(process.env.VALID_API_KEYS, getKey(req));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok }));
};