// Generate ODIADEV API keys
const crypto = require('crypto');
function gen(){
  const raw = crypto.randomBytes(16).toString('hex');
  return 'odiadev_' + raw;
}
const n = Number(process.argv[2]||'5');
for(let i=0;i<n;i++){
  console.log(gen());
}
