import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Edit2, Trash2, Building2, DollarSign, TrendingUp } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import PartDetailModal from '@/components/Inventory/PartDetailModal';

const PartCard = ({ part, onEdit, onDelete, user, movements, recordPartUsage, machines, restockPart, onAddToCart }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { formatCurrency } = useCurrency();

  const isLowStock = part.quantity <= part.min_stock;
  
  // Calculate reorder level for weekly/monthly consumption
  const reorderLevel = React.useMemo(() => {
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const leadTimeWeeks = part.lead_time_weeks || 2;
    const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
    
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
    
    if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
      return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
    }
    return 0;
  }, [part.weekly_usage, part.monthly_usage, part.lead_time_weeks, part.safety_stock, part.min_stock]);

  const needsReorder = reorderLevel > 0 && part.quantity <= reorderLevel;
  const totalValue = (part.quantity || 0) * (part.price || 0);

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
        className="bg-slate-800/50 rounded-2xl p-4 border border-slate-600 hover:border-slate-500 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Alert Icons */}
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {isLowStock && (
            <div className="bg-red-500 rounded-full p-1">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          )}
          {needsReorder && !isLowStock && (
            <div className="bg-orange-500 rounded-full p-1">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Main Image - Keeping your original large image focus */}
        <div className="relative mb-4 aspect-square bg-slate-700/50 rounded-xl overflow-hidden">
          {part.image_url ? (
            <img
              src={part.image_url}
              alt={part.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Title */}
          <h3 
            className="text-white font-semibold text-sm leading-tight cursor-pointer hover:text-blue-300 transition-colors line-clamp-2"
            onClick={() => setIsDetailOpen(true)}
          >
            {part.name}
          </h3>

          {/* Part Number and Supplier Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono bg-slate-700/50">
                {part.part_number}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {part.criticality}
              </Badge>
            </div>
            
            {/* Enhanced Supplier Information */}
            {(part.supplier_id || part.supplier) && (
              <div className="bg-slate-700/30 rounded-lg p-2">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <Building2 className="w-3 h-3" />
                  <span>Supplier</span>
                </div>
                {part.supplier_id && (
                  <div className="text-xs text-white font-mono">ID: {part.supplier_id}</div>
                )}
                {part.supplier && (
                  <div className="text-xs text-slate-200 truncate">{part.supplier}</div>
                )}
              </div>
            )}
          </div>

          {/* Stock Information */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs">Stock</span>
              <span className={`text-lg font-bold ${isLowStock ? 'text-red-400' : needsReorder ? 'text-orange-400' : 'text-green-400'}`}>
                {part.quantity}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Min:</span>
                <span className="text-white ml-1">{part.min_stock || 0}</span>
              </div>
              {reorderLevel > 0 && (
                <div>
                  <span className="text-slate-400">Reorder:</span>
                  <span className="text-orange-300 ml-1">{reorderLevel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Pricing Information */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-xs text-blue-300 mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Pricing</span>
            </div>
            <div className="text-xs">
              <div className="text-white">
                <span className="text-blue-200">Per 1 pcs:</span> 
                <span className="font-semibold ml-1">{formatCurrency(part.price || 0)}</span>
              </div>
              {totalValue > 0 && (
                <div className="text-green-300">
                  <span className="text-blue-200">Total value:</span>
                  <span className="font-semibold ml-1">{formatCurrency(totalValue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleAddToCartClick}
              disabled={part.quantity <= 0}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add
            </Button>
            
            {user.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="text-slate-400 hover:text-white"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            
            {user.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Stock Status Indicator */}
          <div className={`text-xs text-center py-1 px-2 rounded-full ${
            isLowStock ? 'bg-red-900/50 text-red-300' :
            needsReorder ? 'bg-orange-900/50 text-orange-300' :
            'bg-green-900/50 text-green-300'
          }`}>
            {isLowStock ? 'Critical Stock' : needsReorder ? 'Reorder Required' : 'Stock OK'}
          </div>
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