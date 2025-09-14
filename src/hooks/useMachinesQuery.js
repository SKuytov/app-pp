import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

export function useMachinesQuery() {
  return useQuery(
    ['machines'],
    async () => {
      const { data, error } = await supabase.from('machines').select('*');
      if (error) throw error;
      return data;
    },
    {
      staleTime: 300_000,
      cacheTime: 600_000,
      refetchOnWindowFocus: false
    }
  );
}
