import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Edit2, Trash2, Building2, TrendingUp, Eye, Zap } from 'lucide-react';
import PartDetailModal from '@/components/Inventory/PartDetailModal';

// 🚀 PERFORMANCE: Memoized PartCard to prevent unnecessary re-renders
const PartCard = memo(({ part, onEdit, onDelete, user, movements, recordPartUsage, machines, restockPart, onAddToCart }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 🔧 OPTIMIZED: Pre-calculate all status flags
  const isLowStock = part.quantity <= (part.min_stock || 0);
  const isOutOfStock = part.quantity <= 0;
  
  // 🐛 BUG FIX: Consistent reorder level calculation
  const reorderLevel = React.useMemo(() => {
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const leadTimeWeeks = part.lead_time_weeks || 2;
    const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
    
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
    
    if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
      return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
    }
    return part.reorder_level || 0;
  }, [part.weekly_usage, part.monthly_usage, part.lead_time_weeks, part.safety_stock, part.min_stock, part.reorder_level]);

  const needsReorder = part.quantity <= reorderLevel && reorderLevel > 0;
  const isHealthy = !isLowStock && !needsReorder && !isOutOfStock;

  // 🚀 PERFORMANCE: Memoized status calculation
  const stockStatus = React.useMemo(() => {
    if (isOutOfStock) return { label: 'Out', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50' };
    if (isLowStock) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50' };
    if (needsReorder) return { label: 'Reorder', color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/50' };
    return { label: 'Healthy', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/50' };
  }, [isOutOfStock, isLowStock, needsReorder]);

  // 🚀 PERFORMANCE: Memoized event handlers
  const handleAddToCartClick = React.useCallback((e) => {
    e.stopPropagation();
    if (part.quantity > 0) {
      onAddToCart(part);
    }
  }, [part, onAddToCart]);

  const handleEditClick = React.useCallback((e) => {
    e.stopPropagation();
    onEdit(part);
  }, [part, onEdit]);

  const handleDeleteClick = React.useCallback((e) => {
    e.stopPropagation();
    onDelete(part);
  }, [part, onDelete]);

  const handleViewDetails = React.useCallback((e) => {
    e.stopPropagation();
    setIsDetailOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  // 🚀 PERFORMANCE: Reduced animation complexity for better performance
  return (
    <>
      <motion.div
        className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-600/50 hover:border-slate-400/70 transition-all duration-300 cursor-pointer overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)"
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setIsDetailOpen(true)}
      >
        {/* 🎨 OPTIMIZED: Simplified background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* 🔧 IMPROVED: Top status bar with better performance */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-600/50">
          <motion.div 
            className={`h-full ${
              isOutOfStock ? 'bg-red-500' :
              isLowStock ? 'bg-red-400' :
              needsReorder ? 'bg-orange-400' :
              'bg-green-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
        </div>

        {/* 🔧 FIXED: Status indicators with better logic */}
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          {(isLowStock || needsReorder) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`p-1.5 rounded-full backdrop-blur-sm shadow-lg ${
                isLowStock ? 'bg-red-500/90' : 'bg-orange-500/90'
              }`}
            >
              {isLowStock ? (
                <AlertTriangle className="w-3 h-3 text-white" />
              ) : (
                <TrendingUp className="w-3 h-3 text-white" />
              )}
            </motion.div>
          )}
          {isHealthy && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-1.5 rounded-full bg-green-500/90 backdrop-blur-sm shadow-lg"
            >
              <Zap className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* 🚀 OPTIMIZED: Admin actions with better performance */}
        {user?.role === 'admin' && (
          <div className="absolute top-3 left-3 z-20 flex gap-1">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              onClick={handleEditClick}
              className="p-1.5 rounded-full bg-slate-700/90 hover:bg-blue-600/90 backdrop-blur-sm shadow-lg transition-colors duration-200"
            >
              <Edit2 className="w-3 h-3 text-slate-300 hover:text-white" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              transition={{ delay: 0.05 }}
              onClick={handleDeleteClick}
              className="p-1.5 rounded-full bg-slate-700/90 hover:bg-red-600/90 backdrop-blur-sm shadow-lg transition-colors duration-200"
            >
              <Trash2 className="w-3 h-3 text-slate-300 hover:text-white" />
            </motion.button>
          </div>
        )}

        <div className="p-4 relative z-10">
          {/* 🚀 OPTIMIZED: Image container with better performance */}
          <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/50 shadow-inner">
            {part.image_url ? (
              <>
                <img
                  src={part.image_url}
                  alt={part.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* 🔧 OPTIMIZED: Simplified overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Quick View Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                  onClick={handleViewDetails}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </motion.button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="p-3 rounded-full bg-slate-600/30">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* 🔧 OPTIMIZED: Content section */}
          <div className="space-y-3">
            {/* Product Name */}
            <div className="relative">
              <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                {part.name}
              </h3>
            </div>

            {/* 🚀 OPTIMIZED: Info grid with better spacing */}
            <div className="space-y-2">
              {/* Part Number Row */}
              <div className="flex items-center justify-between group/row hover:bg-slate-700/30 -mx-2 px-2 py-1 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover/row:bg-blue-400 transition-colors" />
                  <span className="text-xs text-slate-400 font-medium">Part #</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono bg-slate-700/50 border-slate-500/50 hover:border-blue-400/50 transition-colors">
                  {part.part_number}
                </Badge>
              </div>

              {/* Supplier Row */}
              {part.supplier_id && (
                <div className="flex items-center justify-between group/row hover:bg-slate-700/30 -mx-2 px-2 py-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-slate-400 group-hover/row:text-purple-400 transition-colors" />
                    <span className="text-xs text-slate-400 font-medium">Supplier</span>
                  </div>
                  <span className="text-xs text-white font-mono bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600/50">
                    {part.supplier_id}
                  </span>
                </div>
              )}

              {/* 🔧 FIXED: Stock Status Row with better design */}
              <div className={`flex items-center justify-between p-2 rounded-xl border ${stockStatus.bg} ${stockStatus.border} backdrop-blur-sm`}>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stockStatus.color.replace('text-', 'bg-')} animate-pulse`} />
                  <span className="text-xs text-slate-300 font-medium">Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span 
                    className={`text-lg font-bold ${stockStatus.color}`}
                    key={part.quantity}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {part.quantity}
                  </motion.span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-medium ${stockStatus.bg} ${stockStatus.color} border-0`}
                  >
                    {stockStatus.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 🚀 OPTIMIZED: Action button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                size="sm"
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className={`w-full h-8 text-sm font-medium transition-all duration-300 ${
                  isOutOfStock
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* 🚀 OPTIMIZED: Modal with better performance */}
      {isDetailOpen && (
        <PartDetailModal
          isOpen={isDetailOpen}
          onClose={handleCloseModal}
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
      )}
    </>
  );
});

PartCard.displayName = 'PartCard';

export default PartCard;