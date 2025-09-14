import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Since you likely have a MainLayout that handles all tabs internally,
// just lazy-load that component
const MainLayout = lazy(() => import('@/components/Layout/MainLayout'));

export default function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner size="large" text="Loading..." />}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
