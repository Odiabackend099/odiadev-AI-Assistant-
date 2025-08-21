module.exports = async function handler(req, res){
  const now = new Date().toISOString();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    service: 'ODIADEV Voice AI (Vercel)',
    status: 'ok',
    time: now,
    version: '1.1.0',
    tts_url: process.env.TTS_SERVICE_URL || null,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
  }));
};