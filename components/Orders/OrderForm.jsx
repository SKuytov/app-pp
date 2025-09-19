import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const OrderForm = ({ cart, updateCart, machines, onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [machineId, setMachineId] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [notes, setNotes] = useState('');

  const handleQuantityChange = (partId, newQuantity) => {
    const updatedCart = cart.map(item =>
      item.partId === partId ? { ...item, quantity: Math.max(1, newQuantity) } : item
    );
    updateCart(updatedCart);
  };

  const handleRemoveItem = (partId) => {
    const updatedCart = cart.filter(item => item.partId !== partId);
    updateCart(updatedCart);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    await onSubmit({
      items: cart,
      machine_id: machineId === 'none' ? null : machineId,
      priority,
      notes,
    });
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-white">Create Order from Cart</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {cart.length > 0 ? (
            cart.map(item => (
              <motion.div
                key={item.partId}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg"
              >
                <div>
                  <p className="font-semibold">{item.partName}</p>
                  <p className="text-xs text-slate-400">{item.partNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.partId, item.quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.partId, parseInt(e.target.value, 10))}
                    className="w-16 h-8 bg-slate-700 text-center"
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.partId, item.quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleRemoveItem(item.partId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-8">Your cart is empty. Add parts from the inventory to create an order.</p>
          )}
        </div>

        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Assign to Machine (Optional)</label>
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select a machine" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20 text-white">
                <SelectItem value="none" className="hover:bg-slate-700">None</SelectItem>
                {(machines || []).map(machine => (
                  <SelectItem key={machine.id} value={machine.id} className="hover:bg-slate-700">{machine.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20 text-white">
                <SelectItem value="Normal" className="hover:bg-slate-700">Normal</SelectItem>
                <SelectItem value="High" className="hover:bg-slate-700">High</SelectItem>
                <SelectItem value="Emergency" className="hover:bg-slate-700">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
        </div>

        <DialogFooter className="pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || cart.length === 0}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Order'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default OrderForm;