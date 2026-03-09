import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DebugNrp = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Ambil 5 data hazard report terbaru
      const { data: hazards } = await supabase
        .from('hazard_report')
        .select('id, pelapor_nama, pelapor_nrp, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Ambil data user Heru
      const { data: userHeru } = await supabase
        .from('users')
        .select('id, nama, nrp')
        .ilike('nama', '%Heru%')
        .limit(5);

      setData(hazards || []);
      setUsers(userHeru || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading Debug Data...</div>;

  return (
    <div style={{ padding: 20, background: 'white', color: 'black' }}>
      <h3>Debug Data Hazard & Users</h3>
      
      <h4>Data User (Heru)</h4>
      <pre>{JSON.stringify(users, null, 2)}</pre>

      <h4>Data Hazard Report Terbaru</h4>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default DebugNrp;