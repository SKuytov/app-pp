import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Dashboard = lazy(() => import('@/components/Dashboard/Dashboard'));
const Inventory = lazy(() => import('@/components/Inventory/InventoryTab'));
const Machines = lazy(() => import('@/components/Machines/MachinesTab'));
const Orders = lazy(() => import('@/components/Orders/OrdersTab'));
const Quotations = lazy(() => import('@/components/Quotations/QuotationsTab'));
const Contacts = lazy(() => import('@/components/Contacts/ContactsTab'));
const Analytics = lazy(() => import('@/components/Analytics/AnalyticsTab'));
const Admin = lazy(() => import('@/components/Admin/AdminTab'));
const NotFound = lazy(() => import('@/components/Layout/MainLayout')); // fallback to layout if no 404 page

export default function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner size="large" text="Loading page..." />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
