const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
fetch(url + '/rest/v1/planned_task_observation?limit=1', {
  headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
}).then(res => res.json()).then(console.log).catch(console.error);
