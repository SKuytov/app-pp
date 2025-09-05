import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginScreen from '@/components/Auth/LoginScreen';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ui/use-toast';

function App() {
  const { session, profile, loading } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState([]);

  const addToCart = (part, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.partId === part.id);
      if (existingItem) {
        toast({ title: "🛒 Item already in cart", description: `${part.name} is already in your order cart.` });
        return prevCart;
      }
      toast({ title: "✅ Added to cart", description: `${part.name} has been added to your order.` });
      return [...prevCart, { partId: part.id, partName: part.name, partNumber: part.part_number, quantity }];
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
        <p className="text-xl animate-pulse">Loading PartPulse...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginScreen />;
  }

  return (
    <>
      <Helmet>
        <title>PartPulse - Inventory Management</title>
        <meta name="description" content="Interactive warehouse management system with real-time tracking, order management, and analytics." />
      </Helmet>
      
      <MainLayout 
        user={profile} 
        cart={cart}
        addToCart={addToCart}
        updateCart={updateCart}
        clearCart={clearCart}
      />
    </>
  );
}

export default App;