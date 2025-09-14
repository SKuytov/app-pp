import { createClient } from '@supabase/supabase-js';

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.VITE_SUPABASE_ANON_KEY');
}

// Enhanced Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': `${import.meta.env.VITE_APP_NAME}@${import.meta.env.VITE_APP_VERSION}`
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Performance monitoring for Supabase queries
if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
  // Log slow queries in development
  const originalFrom = supabase.from;
  supabase.from = function(table) {
    const query = originalFrom.call(this, table);
    const originalSelect = query.select;
    
    query.select = function(...args) {
      const startTime = performance.now();
      const result = originalSelect.call(this, ...args);
      
      // Monitor query performance
      result.then(() => {
        const duration = performance.now() - startTime;
        if (duration > 1000) {
          console.warn(`Slow query detected on ${table}: ${duration.toFixed(2)}ms`);
        }
      });
      
      return result;
    };
    
    return query;
  };
}

// Connection health check
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return { connected: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return { connected: false, error: error.message };
  }
};

// Export environment configuration
export const config = {
  supabaseUrl,
  appName: import.meta.env.VITE_APP_NAME,
  appVersion: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.VITE_APP_ENV,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760,
  cacheTime: parseInt(import.meta.env.VITE_CACHE_TTL) || 300000,
  paginationSize: parseInt(import.meta.env.VITE_PAGINATION_SIZE) || 50
};