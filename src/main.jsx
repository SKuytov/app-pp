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

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  console.log('Performance:', { id, phase, actualDuration });
};

// Wrap your InventoryTab
<Profiler id="InventoryTab" onRender={onRenderCallback}>
  <InventoryTab {...props} />
</Profiler>