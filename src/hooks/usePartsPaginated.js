import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

export function usePartsPaginated(page, filters) {
  return useQuery(
    ['parts', page, filters],
    async () => {
      const { data, error } = await supabase
        .rpc('get_parts_paginated', {
          page_size: 50,
          page_offset: (page - 1) * 50,
          search_term: filters.searchTerm || '',
          main_group_filter: filters.mainGroup || ''
        });
      if (error) throw error;
      return data;
    },
    {
      keepPreviousData: true
    }
  );
}
