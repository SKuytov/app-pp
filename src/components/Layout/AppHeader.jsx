import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, LogOut, Package, Trash2, Send, Bot, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AppHeader = ({ user, cart, updateCart, clearCart, refreshData }) => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Logged Out', description: 'You have been successfully signed out.' });
  };

  const updateItemQuantity = (partId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      updateCart(cart.filter(item => item.partId !== partId));
    } else {
      updateCart(cart.map(item => item.partId === partId ? { ...item, quantity: quantity } : item));
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    const newOrder = {
      requested_by_id: user.id,
      requested_by_name: user.username,
      status: 'Pending Approval',
      items: cart.map(item => ({
        part_id: item.partId,
        part_name: item.partName,
        part_number: item.partNumber,
        quantity: item.quantity,
      })),
      facility_id: user.facility_id,
    };
    
    const { error } = await supabase.from('orders').insert([newOrder]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error placing order', description: error.message });
    } else {
      toast({ title: '🚀 Order Placed!', description: 'Your request has been submitted for approval.' });
      clearCart();
      setIsCartOpen(false);
      if (refreshData) {
        refreshData(['orders']);
      }
    }
  };

  return (
    <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 p-4 sticky top-0 z-40">
      <div className="max-w-8xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">PartPulse</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user.role === 'admin' && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-slate-300" />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[100px] bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BGN">BGN</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(!isCartOpen)}>
              <ShoppingCart className="h-6 w-6 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/50 p-2 rounded-lg">
            <User className="h-5 w-5 text-slate-300" />
            <span className="text-white font-semibold">{user.username}</span>
            <span className="text-xs text-slate-400 bg-purple-500/20 px-2 py-0.5 rounded-full">{user.role}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="h-6 w-6 text-slate-300 hover:text-white" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full right-4 mt-2 w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl z-50"
          >
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Your Order Request</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.partId} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{item.partName}</p>
                        <p className="text-sm text-slate-400">{item.partNumber}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.partId, e.target.value)}
                          className="w-16 bg-slate-700 text-white text-center rounded-md border border-slate-600"
                          min="1"
                        />
                         <Button variant="ghost" size="icon" onClick={() => updateItemQuantity(item.partId, 0)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-700 flex justify-end">
                <Button onClick={handlePlaceOrder} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppHeader;