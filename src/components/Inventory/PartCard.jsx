import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Edit2, Trash2, Building2, TrendingUp } from 'lucide-react';
import PartDetailModal from '@/components/Inventory/PartDetailModal';

const PartCard = ({ part, onEdit, onDelete, user, movements, recordPartUsage, machines, restockPart, onAddToCart }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isLowStock = part.quantity <= part.min_stock;
  const needsReorder = part.quantity <= (part.reorder_level || 0);

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (part.quantity > 0) {
      onAddToCart(part);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(part);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(part);
  };

  return (
    <>
      <motion.div
        className="bg-slate-800/50 rounded-xl border border-slate-600 hover:border-slate-500 transition-all duration-200 cursor-pointer group relative"
        whileHover={{ scale: 1.01 }}
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Status Indicators */}
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {isLowStock && (
            <div className="bg-red-500 rounded-full p-1">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          )}
          {needsReorder && !isLowStock && (
            <div className="bg-orange-500 rounded-full p-1">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Admin Actions */}
        {user.role === 'admin' && (
          <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="bg-slate-700/80 hover:bg-slate-600 rounded p-1 transition-colors"
            >
              <Edit2 className="w-3 h-3 text-slate-300" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-red-700/80 hover:bg-red-600 rounded p-1 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-red-300" />
            </button>
          </div>
        )}

        <div className="p-3">
          {/* Large Image */}
          <div className="relative mb-3 aspect-square bg-slate-700/30 rounded-lg overflow-hidden">
            {part.image_url ? (
              <img
                src={part.image_url}
                alt={part.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
            )}
          </div>

          {/* Part Name */}
          <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
            {part.name}
          </h3>

          {/* Part Info Grid - Better arrangement */}
          <div className="space-y-2 mb-3">
            {/* Row 1: Part Number */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Part #</span>
              <Badge variant="outline" className="text-xs font-mono h-5">
                {part.part_number}
              </Badge>
            </div>

            {/* Row 2: Supplier ID */}
            {part.supplier_id && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Supplier
                </span>
                <span className="text-xs text-white font-mono">{part.supplier_id}</span>
              </div>
            )}

            {/* Row 3: Stock Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Stock</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  isLowStock ? 'text-red-400' : 
                  needsReorder ? 'text-orange-400' : 
                  'text-green-400'
                }`}>
                  {part.quantity}
                </span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs h-5 ${
                    isLowStock ? 'bg-red-900/50 text-red-300' : 
                    needsReorder ? 'bg-orange-900/50 text-orange-300' : 
                    'bg-green-900/50 text-green-300'
                  }`}
                >
                  {isLowStock ? 'Low' : needsReorder ? 'Reorder' : 'OK'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleAddToCartClick}
            disabled={part.quantity <= 0}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            {part.quantity <= 0 ? 'Out of Stock' : 'Add'}
          </Button>
        </div>
      </motion.div>

      {/* Detail Modal */}
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