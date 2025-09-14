import React from 'react';
import ReactDOM from 'react-dom/client';

import AppRouter from '@/router';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <AppRouter />
          <Toaster />
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
