import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('planned_task_observation').select('*').gte('tanggal', '2026-03-01').order('tanggal', {ascending: false});
  console.log('Error:', error);
  console.log('Rows:', data?.length);
  if(data && data.length > 0) {
    console.log(data.slice(0, 3).map(r => ({ id: r.id, tanggal: r.tanggal, user_id: r.user_id, observer_id: r.observer_id, created_by: r.created_by, nrp: r.nrp_pelapor })));
  }
}
run();
