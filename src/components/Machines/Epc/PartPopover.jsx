import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';

const PartPopover = ({ part, hotspot, onAddToCart, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const { formatCurrency } = useCurrency();

  if (!part) return null;

  const handleOrder = (e) => {
    e.stopPropagation();
    onAddToCart(part, quantity);
    onClose();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute z-20 w-64"
      style={{ top: '150%', left: '50%', transform: 'translateX(-50%)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="bg-slate-800/80 border-slate-700 text-white shadow-2xl backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <CardTitle className="text-sm font-semibold truncate">{part.name}</CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Part No:</span>
            <span className="font-mono">{part.part_number}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Item No:</span>
            <span className="font-mono">{hotspot.item_number}</span>
          </div>
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-700">
            <span>In Stock:</span>
            <span className={`font-bold ${part.quantity > part.min_stock ? 'text-green-400' : 'text-red-400'}`}>
              {part.quantity}
            </span>
          </div>
           <div className="flex justify-between text-sm">
            <span>Price:</span>
            <span className="font-bold">{formatCurrency(part.price)}</span>
          </div>
          <div className="flex items-center space-x-2 pt-3">
            <Input 
              type="number" 
              className="w-20 h-8 bg-slate-700 border-slate-600 text-sm"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
            />
            <Button size="sm" className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-500" onClick={handleOrder} disabled={quantity < 1 || part.quantity <= 0}>
              <ShoppingCart className="h-4 w-4 mr-2"/> Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PartPopover;