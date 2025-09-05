import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import AppHeader from '@/components/Layout/AppHeader';
import NavTabs from '@/components/Layout/NavTabs';
import Dashboard from '@/components/Dashboard/Dashboard';
import InventoryTab from '@/components/Inventory/InventoryTab';
import MachinesTab from '@/components/Machines/MachinesTab';
import OrderManagement from '@/components/Orders/OrderManagement';
import QuotationManagement from '@/components/Quotations/QuotationManagement';
import SupplierManagement from '@/components/Suppliers/SupplierManagement';
import CredentialsViewer from '@/components/Admin/CredentialsViewer';
import SettingsTab from '@/components/Settings/SettingsTab';
import ExecutiveDashboard from '@/components/Analytics/ExecutiveDashboard';
import FinancialAnalytics from '@/components/Analytics/FinancialAnalytics';
import PredictiveMaintenance from '@/components/Analytics/PredictiveMaintenance';
import InventoryAnalytics from '@/components/Analytics/InventoryAnalytics';
import SupplierAnalytics from '@/components/Analytics/SupplierAnalytics';
import { AnimatePresence, motion } from 'framer-motion';

const MainLayout = ({ user, cart, addToCart, updateCart, clearCart, warehouseState, apiHandlers }) => {
  const { parts, lowStockParts, orders, suppliers, machines, quotations, facilities, movements, assemblies, hotspots, loading, refreshData } = warehouseState;
  
  const TABS_CONFIG = {
    ceo: ['executive_dashboard', 'financial_analytics', 'dashboard'],
    admin: ['dashboard', 'inventory', 'machines', 'orders', 'quotations', 'suppliers', 'credentials', 'settings', 'executive_dashboard', 'financial_analytics', 'predictive_maintenance', 'inventory_analytics', 'supplier_analytics'],
    technical_director: ['dashboard', 'machines', 'orders', 'quotations', 'predictive_maintenance'],
    head_technician: ['inventory', 'machines', 'orders', 'predictive_maintenance'],
    facility_tech: ['inventory', 'machines', 'orders'],
    maintenance: ['inventory', 'machines', 'orders'],
  };

  const userTabs = TABS_CONFIG[user.role] || [];
  const [activeTab, setActiveTab] = useState(userTabs[0] || 'dashboard');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainGroup, setSelectedMainGroup] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState('all');

  useEffect(() => {
    if (!userTabs.includes(activeTab)) {
      setActiveTab(userTabs[0] || 'dashboard');
    }
  }, [user.role, activeTab, userTabs]);


  const mainGroups = useMemo(() => ['all', ...new Set((parts || []).map(p => p.main_group).filter(Boolean))], [parts]);
  const subGroups = useMemo(() => {
    if (selectedMainGroup === 'all') return [];
    return ['all', ...new Set((parts || []).filter(p => p.main_group === selectedMainGroup).map(p => p.sub_group).filter(Boolean))];
  }, [parts, selectedMainGroup]);

  const filteredParts = useMemo(() => {
    if (!parts) return [];
    return parts.filter(part => {
      const searchMatch = (part.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (part.part_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      const mainGroupMatch = selectedMainGroup === 'all' || part.main_group === selectedMainGroup;
      const subGroupMatch = selectedSubGroup === 'all' || part.sub_group === selectedSubGroup;
      return searchMatch && mainGroupMatch && subGroupMatch;
    });
  }, [parts, searchTerm, selectedMainGroup, selectedSubGroup]);
  
  if (loading) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl">Loading Warehouse Data...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard user={user} parts={parts} lowStockParts={lowStockParts} orders={orders} suppliers={suppliers} />;
      case 'inventory':
        return <InventoryTab user={user} addToCart={addToCart} parts={parts} filteredParts={filteredParts} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedMainGroup={selectedMainGroup} setSelectedMainGroup={setSelectedMainGroup} selectedSubGroup={selectedSubGroup} setSelectedSubGroup={setSelectedSubGroup} mainGroups={mainGroups} subGroups={subGroups} machines={machines} onPartSubmit={apiHandlers.handlePartSubmit} movements={movements} recordPartUsage={apiHandlers.recordPartUsage} restockPart={apiHandlers.restockPart} />;
      case 'machines':
        return <MachinesTab user={user} warehouseState={warehouseState} apiHandlers={apiHandlers} addToCart={addToCart} />;
      case 'orders':
        return <OrderManagement user={user} orders={orders} parts={parts} suppliers={suppliers} machines={machines} facilities={facilities} cart={cart} updateCart={updateCart} clearCart={clearCart} updateOrder={apiHandlers.handleUpdateOrder} updateOrderStatus={apiHandlers.handleUpdateOrderStatus} createOrder={apiHandlers.handleCreateOrder} />;
      case 'quotations':
        return <QuotationManagement user={user} orders={orders} quotations={quotations} updateOrder={apiHandlers.handleUpdateOrder} />;
      case 'suppliers':
        return <SupplierManagement user={user} suppliers={suppliers} addSupplier={apiHandlers.handleAddSupplier} editSupplier={apiHandlers.handleEditSupplier} />;
      case 'credentials':
        return <CredentialsViewer facilities={facilities} />;
      case 'settings':
        return <SettingsTab />;
      case 'executive_dashboard':
        return <ExecutiveDashboard parts={parts} machines={machines} movements={movements} />;
      case 'financial_analytics':
        return <FinancialAnalytics parts={parts} machines={machines} movements={movements} suppliers={suppliers} />;
      case 'predictive_maintenance':
        return <PredictiveMaintenance machines={machines} movements={movements} parts={parts} />;
      case 'inventory_analytics':
        return <InventoryAnalytics parts={parts} movements={movements} />;
      case 'supplier_analytics':
        return <SupplierAnalytics suppliers={suppliers} parts={parts} movements={movements} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-screen">
        <AppHeader user={user} cart={cart} updateCart={updateCart} clearCart={clearCart} refreshData={refreshData} />
        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
          <div className="max-w-8xl mx-auto">
            <div className="mb-6">
              <NavTabs user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>

          </div>
        </main>
      </Tabs>
    </div>
  );
};

export default MainLayout;