// components/OptimizedPartCard.jsx
import React, { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Edit2, Trash2, Building2, Eye } from 'lucide-react';
import { calculateReorderLevel, getStockStatus } from '../utils/inventoryUtils';

const OptimizedPartCard = memo(({ 
  part, 
  onEdit, 
  onDelete, 
  onView,
  onAddToCart,
  user,
  style // For react-window
}) => {
  // Pre-calculate values to avoid recalculation on each render
  const reorderLevel = calculateReorderLevel(part);
  const stockStatus = getStockStatus(part, reorderLevel);
  const isOutOfStock = part.quantity === 0;
  const canAddToCart = part.quantity > 0;

  // Memoized event handlers to prevent re-renders
  const handleView = useCallback((e) => {
    e.stopPropagation();
    onView(part);
  }, [part, onView]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit(part);
  }, [part, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(part);
  }, [part, onDelete]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (canAddToCart) {
      onAddToCart(part);
    }
  }, [part, onAddToCart, canAddToCart]);

  return (
    <div 
      style={style}
      className="p-2" // Container for react-window
    >
      <div
        className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/20 cursor-pointer group"
        onClick={handleView}
      >
        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${stockStatus.bg}`} />

        {/* Header with Status Badge */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Badge 
              className={`${stockStatus.color} ${stockStatus.bg} ${stockStatus.border} text-xs font-medium`}
            >
              {stockStatus.label}
            </Badge>
            {(stockStatus.priority >= 3) && (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
          </div>
          
          {/* Admin Actions */}
          {user?.role === 'admin' && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={handleEdit}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-slate-700/50"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                onClick={handleDelete}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-red-900/50 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Image Container */}
        <div className="relative px-4 pb-2">
          {part.image_url ? (
            <div className="relative aspect-square w-full max-w-32 mx-auto">
              <img
                src={part.image_url}
                alt={part.name}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={handleView}
                  size="sm"
                  className="absolute bottom-2 right-2 h-6 w-6 p-0 bg-slate-800/80 hover:bg-slate-700/80"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-square w-full max-w-32 mx-auto bg-slate-700/30 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-500" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 space-y-3">
          {/* Part Name */}
          <h3 className="font-semibold text-slate-200 text-sm leading-tight line-clamp-2">
            {part.name}
          </h3>

          {/* Key Info Grid */}
          <div className="space-y-2 text-xs">
            {/* Part Number */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Part #</span>
              <span className="text-slate-300 font-mono">{part.part_number}</span>
            </div>

            {/* Supplier */}
            {part.supplier_id && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Supplier
                </span>
                <span className="text-slate-300">{part.supplier_id}</span>
              </div>
            )}

            {/* Stock Level */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Stock</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-300 font-semibold">{part.quantity}</span>
                <span className={`text-xs ${stockStatus.color}`}>
                  {stockStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`w-full text-xs h-8 ${
              isOutOfStock 
                ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isOutOfStock ? (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Out of Stock
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 mr-1" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

OptimizedPartCard.displayName = 'OptimizedPartCard';

export default OptimizedPartCard;