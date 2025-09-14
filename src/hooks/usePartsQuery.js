import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

export function usePartsQuery() {
  return useQuery(
    ['parts'],
    async () => {
      const { data, error } = await supabase.from('parts').select('*');
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
