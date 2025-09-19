import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginScreen from '@/components/Auth/LoginScreen';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ui/use-toast';
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { useApiHandlers } from '@/hooks/useApiHandlers';

function App() {
  const { session, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState([]);

  const warehouseState = useWarehouseData();
  const apiHandlers = useApiHandlers(warehouseState.refreshData, profile);
  
  const loading = authLoading || warehouseState.loading;

  const addToCart = (part, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.partId === part.id);
      if (existingItem) {
        toast({ title: "🛒 Item already in cart", description: `${part.name} is already in your order cart.` });
        return prevCart;
      }
      const newQuantity = Math.max(1, quantity);
      toast({ title: "✅ Added to cart", description: `${part.name} has been added to your order.` });
      return [...prevCart, { partId: part.id, partName: part.name, partNumber: part.part_number, quantity: newQuantity }];
    });
  };

  const updateCart = (newCart) => {
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl animate-pulse">Loading PartPulse...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginScreen />;
  }

  return (
    <>
      <Helmet>
        <title>PartPulse - CMMS</title>
        <meta name="description" content="Comprehensive CMMS combining real-time analytics with warehouse and maintenance management." />
        <meta property="og:title" content="PartPulse - CMMS" />
        <meta property="og:description" content="Comprehensive CMMS combining real-time analytics with warehouse and maintenance management." />
      </Helmet>
      
      <MainLayout 
        user={profile} 
        cart={cart}
        addToCart={addToCart}
        updateCart={updateCart}
        clearCart={clearCart}
        warehouseState={warehouseState}
        apiHandlers={apiHandlers}
      />
    </>
  );
}

export default App;