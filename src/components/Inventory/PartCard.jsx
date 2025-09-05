import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import PartDetailModal from '@/components/Inventory/PartDetailModal';

const PartCard = ({ part, onEdit, onDelete, user, movements, recordPartUsage, machines, restockPart, onAddToCart }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isLowStock = part.quantity <= part.min_stock;

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (part.quantity > 0) {
      onAddToCart(part);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300 flex flex-col group"
      >
        <div className="relative h-40 bg-slate-900 cursor-pointer" onClick={() => setIsDetailOpen(true)}>
          {part.image_url ? (
            <img src={part.image_url} alt={part.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <Package className="h-12 w-12" />
            </div>
          )}
          {isLowStock && (
            <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-sm p-1.5 rounded-full">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-bold text-white truncate cursor-pointer" onClick={() => setIsDetailOpen(true)}>{part.name}</h3>
          <p className="text-xs text-slate-400 mb-2">{part.part_number}</p>
          <div className="flex-grow" />
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-xs text-slate-400">Stock</p>
              <p className={`font-bold text-lg ${isLowStock ? 'text-red-400' : 'text-white'}`}>{part.quantity}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddToCartClick} disabled={part.quantity <= 0}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </motion.div>

      <PartDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        part={part}
        onEdit={onEdit}
        onDelete={onDelete}
        user={user}
        movements={movements}
        recordPartUsage={recordPartUsage}
        machines={machines}
        restockPart={restockPart}
        onAddToCart={onAddToCart}
      />
    </>
  );
};

export default PartCard;