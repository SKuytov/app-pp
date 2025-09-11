import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CurrencyProvider>
        <App />
        <Toaster />
      </CurrencyProvider>
    </AuthProvider>
  </React.StrictMode>
);