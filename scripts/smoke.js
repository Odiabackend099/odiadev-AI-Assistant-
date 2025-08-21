// Minimal local smoke (requires `vercel dev` running in another terminal)
(async () => {
  const base = 'http://localhost:3000';
  async function j(p){ const r=await fetch(base+p); return [r.status, await r.text()]; }
  console.log('GET /api/health');
  console.log(await j('/api/health'));
  console.log('Done.');
})();