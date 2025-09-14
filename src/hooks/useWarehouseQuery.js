import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

export function useWarehouseQuery() {
  return useQuery(
    ['warehouse'],
    async () => {
      const { data, error } = await supabase.from('warehouse').select('*');
      if (error) throw error;
      return data;
    },
    {
      staleTime: 300_000,         // 5 minutes
      cacheTime: 600_000,         // 10 minutes
      refetchOnWindowFocus: false
    }
  );
}
