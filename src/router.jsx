import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Parts = lazy(() => import('@/pages/Parts'));
const Machines = lazy(() => import('@/pages/Machines'));
const Orders = lazy(() => import('@/pages/Orders'));
const Quotations = lazy(() => import('@/pages/Quotations'));
const Contacts = lazy(() => import('@/pages/Contacts'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Admin = lazy(() => import('@/pages/Admin'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner size="large" text="Loading…" />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parts" element={<Parts />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/analytics/*" element={<Analytics />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
