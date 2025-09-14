import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginScreen from '@/components/Auth/LoginScreen';
import MainLayout from '@/components/Layout/MainLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/components/ui/use-toast';
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { useApiHandlers } from '@/hooks/useApiHandlers';
import { config, checkSupabaseConnection } from '@/lib/customSupabaseClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function App() {
  const { session, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({ connected: true });

  const warehouseState = useWarehouseData();
  const apiHandlers = useApiHandlers(warehouseState.refreshData, profile);
  
  const loading = authLoading || warehouseState.loading;

  // Check Supabase connection on app load
  React.useEffect(() => {
    const checkConnection = async () => {
      const status = await checkSupabaseConnection();
      setConnectionStatus(status);
      
      if (!status.connected) {
        toast({
          variant: "destructive",
          title: "⚠️ Connection Issue",
          description: "Unable to connect to the database. Please check your internet connection."
        });
      }
    };

    checkConnection();
  }, [toast]);

  // Enhanced cart management with validation
  const addToCart = React.useCallback((part, quantity = 1) => {
    if (!part || !part.id) {
      toast({ 
        variant: "destructive",
        title: "❌ Invalid Part", 
        description: "Cannot add invalid part to cart." 
      });
      return;
    }

    if (quantity <= 0) {
      toast({ 
        variant: "destructive",
        title: "❌ Invalid Quantity", 
        description: "Quantity must be greater than 0." 
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.partId === part.id);
      
      if (existingItem) {
        toast({ 
          title: "🛒 Item already in cart", 
          description: `${part.name} is already in your order cart.` 
        });
        return prevCart;
      }

      const newQuantity = Math.max(1, quantity);
      toast({ 
        title: "✅ Added to cart", 
        description: `${part.name} has been added to your order.` 
      });
      
      return [...prevCart, { 
        partId: part.id, 
        partName: part.name, 
        partNumber: part.part_number, 
        quantity: newQuantity 
      }];
    });
  }, [toast]);

  const updateCart = React.useCallback((newCart) => {
    if (!Array.isArray(newCart)) {
      console.error('updateCart: newCart must be an array');
      return;
    }
    setCart(newCart);
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
    toast({ 
      title: "🧹 Cart cleared", 
      description: "All items have been removed from your cart." 
    });
  }, [toast]);

  // Loading screen with better UX
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-white mb-2">Loading PartPulse...</h2>
              <p className="text-slate-400">
                Initializing your CMMS workspace
              </p>
              {!connectionStatus.connected && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">
                    ⚠️ Connection issues detected. Please check your network.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Authentication check
  if (!session || !profile) {
    return (
      <ErrorBoundary>
        <Helmet>
          <title>Login - PartPulse CMMS</title>
          <meta name="description" content="Login to PartPulse CMMS - Professional Maintenance Management System" />
        </Helmet>
        <LoginScreen />
      </ErrorBoundary>
    );
  }

  // Main application
  return (
    <ErrorBoundary userId={profile.id}>
      <Helmet>
        <title>PartPulse - CMMS</title>
        <meta name="description" content="Professional CMMS for maintenance management" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1e293b" />
        
        {/* Performance hints */}
        <link rel="preconnect" href={config.supabaseUrl} />
        <link rel="dns-prefetch" href={config.supabaseUrl} />
        
        {/* App metadata */}
        <meta name="app-version" content={config.appVersion} />
        <meta name="app-environment" content={config.environment} />
      </Helmet>

      {/* Connection status indicator */}
      {!connectionStatus.connected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
          ⚠️ Connection issues detected. Some features may not work properly.
          <button 
            onClick={() => window.location.reload()} 
            className="ml-2 underline hover:no-underline"
          >
            Reload
          </button>
        </div>
      )}

      <MainLayout
        user={profile}
        cart={cart}
        addToCart={addToCart}
        updateCart={updateCart}
        clearCart={clearCart}
        warehouseState={warehouseState}
        apiHandlers={apiHandlers}
      />

      {/* Development info */}
      {config.enableDebug && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-slate-400 z-40">
          <div>App: {config.appName} v{config.appVersion}</div>
          <div>Env: {config.environment}</div>
          <div>User: {profile.role}</div>
          <div>Cart: {cart.length} items</div>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default App;