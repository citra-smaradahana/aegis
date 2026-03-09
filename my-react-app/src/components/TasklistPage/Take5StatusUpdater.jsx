import { useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Take5StatusUpdater = () => {
  useEffect(() => {
    // Subscribe to changes in hazard_report table
    const channel = supabase
      .channel('hazard_report_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hazard_report',
          // Tangkap status done maupun closed
          filter: 'status=in.(done,closed)',
        },
        async payload => {
          const hazardReport = payload.new;

          // Jika ada take_5_id, update status Take 5 menjadi 'completed'
          if (hazardReport.take_5_id) {
            try {
              const { error } = await supabase
                .from('take_5')
                .update({ status: 'completed' })
                .eq('id', hazardReport.take_5_id);

              if (error) {
                console.error('Error updating Take 5 status:', error);
              } else {
                console.log(
                  `Take 5 ID ${hazardReport.take_5_id} status updated to completed`
                );
              }
            } catch (err) {
              console.error('Error in Take5StatusUpdater:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // Component ini tidak render apapun
};

export default Take5StatusUpdater;
