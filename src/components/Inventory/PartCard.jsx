import React, { useState, memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Edit2, Trash2, Building2, TrendingUp } from 'lucide-react';
import PartDetailModal from '@/components/Inventory/PartDetailModal';

// 🚀 ULTRA-OPTIMIZED: Pre-calculate reorder level outside component
const calculateReorderLevel = (part) => {
  const weeklyUsage = part.weekly_usage || 0;
  const monthlyUsage = part.monthly_usage || 0;
  const leadTimeWeeks = part.lead_time_weeks || 2;
  const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
  
  const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
  
  if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
    return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
  }
  return part.reorder_level || 0;
};

// 🎨 CSS-ONLY animations for better performance
const cardStyles = `
  .part-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    will-change: transform;
    contain: layout style paint;
  }
  
  .part-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.25);
    border-color: rgb(148 163 184 / 0.7);
  }
  
  .part-card:active {
    transform: translateY(-1px);
  }
  
  .admin-actions {
    opacity: 0;
    transform: translateX(-10px);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  
  .part-card:hover .admin-actions {
    opacity: 1;
    transform: translateX(0);
  }
  
  .status-indicator {
    animation: pulse-subtle 2s ease-in-out infinite;
  }
  
  @keyframes pulse-subtle {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  
  .image-hover {
    transition: transform 0.3s ease;
  }
  
  .part-card:hover .image-hover {
    transform: scale(1.05);
  }
`;

// 🚀 PERFORMANCE: Memoized PartCard with aggressive optimizations
const OptimizedPartCard = memo(({ 
  part, 
  onEdit, 
  onDelete, 
  user, 
  movements, 
  recordPartUsage, 
  machines, 
  restockPart, 
  onAddToCart 
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 🔧 ULTRA-OPTIMIZED: Pre-calculate all values once
  const cardData = useMemo(() => {
    const isLowStock = part.quantity <= (part.min_stock || 0);
    const isOutOfStock = part.quantity <= 0;
    const reorderLevel = calculateReorderLevel(part);
    const needsReorder = part.quantity <= reorderLevel && reorderLevel > 0;
    const isHealthy = !isLowStock && !needsReorder && !isOutOfStock;

    // Status calculation
    let statusConfig;
    if (isOutOfStock) {
      statusConfig = { label: 'Out', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' };
    } else if (isLowStock) {
      statusConfig = { label: 'Critical', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' };
    } else if (needsReorder) {
      statusConfig = { label: 'Reorder', color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' };
    } else {
      statusConfig = { label: 'Healthy', color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-500/30' };
    }

    return {
      isLowStock,
      isOutOfStock,
      needsReorder,
      isHealthy,
      reorderLevel,
      statusConfig
    };
  }, [part.quantity, part.min_stock, part.weekly_usage, part.monthly_usage, part.lead_time_weeks, part.safety_stock, part.reorder_level]);

  // 🚀 PERFORMANCE: Stable event handlers
  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (part.quantity > 0) onAddToCart(part);
  }, [part, onAddToCart]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit(part);
  }, [part, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(part);
  }, [part, onDelete]);

  const handleOpenModal = useCallback(() => {
    setIsDetailOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  return (
    <>
      <style>{cardStyles}</style>
      
      {/* 🎨 OPTIMIZED: Single container with CSS animations */}
      <div
        className="part-card bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-slate-600/50 cursor-pointer overflow-hidden relative"
        onClick={handleOpenModal}
      >
        {/* 🔧 SIMPLIFIED: Status bar without motion */}
        <div className="absolute top-0 left-0 right-0 h-1">
          <div 
            className={`h-full transition-all duration-500 ${
              cardData.isOutOfStock ? 'bg-red-500' :
              cardData.isLowStock ? 'bg-red-400' :
              cardData.needsReorder ? 'bg-orange-400' :
              'bg-green-400'
            }`}
            style={{ width: '100%' }}
          />
        </div>

        {/* 🔧 OPTIMIZED: Status indicators - only show when needed */}
        {(cardData.isLowStock || cardData.needsReorder) && (
          <div className="absolute top-3 right-3 z-20">
            <div className={`p-1.5 rounded-full shadow-lg ${
              cardData.isLowStock ? 'bg-red-500/90' : 'bg-orange-500/90'
            }`}>
              {cardData.isLowStock ? (
                <AlertTriangle className="w-3 h-3 text-white" />
              ) : (
                <TrendingUp className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
        )}

        {/* 🚀 OPTIMIZED: Admin actions with CSS animation */}
        {user?.role === 'admin' && (
          <div className="admin-actions absolute top-3 left-3 z-20 flex gap-1">
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-full bg-slate-700/90 hover:bg-blue-600/90 transition-colors duration-200"
            >
              <Edit2 className="w-3 h-3 text-slate-300" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full bg-slate-700/90 hover:bg-red-600/90 transition-colors duration-200"
            >
              <Trash2 className="w-3 h-3 text-slate-300" />
            </button>
          </div>
        )}

        <div className="p-4">
          {/* 🚀 OPTIMIZED: Simplified image container */}
          <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-slate-700/30">
            {part.image_url ? (
              <img
                src={part.image_url}
                alt={part.name}
                className="image-hover w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
            )}
          </div>

          {/* 🔧 SIMPLIFIED: Content without complex animations */}
          <div className="space-y-3">
            {/* Title */}
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
              {part.name}
            </h3>

            {/* Info rows - simplified structure */}
            <div className="space-y-2 text-xs">
              {/* Part Number */}
              <div className="flex items-center justify-between p-1 rounded hover:bg-slate-700/20 transition-colors">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-500" />
                  Part #
                </span>
                <Badge variant="outline" className="text-xs font-mono h-5">
                  {part.part_number}
                </Badge>
              </div>

              {/* Supplier */}
              {part.supplier_id && (
                <div className="flex items-center justify-between p-1 rounded hover:bg-slate-700/20 transition-colors">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Supplier
                  </span>
                  <span className="text-white font-mono text-xs bg-slate-700/50 px-2 py-0.5 rounded">
                    {part.supplier_id}
                  </span>
                </div>
              )}

              {/* Stock Status - optimized design */}
              <div className={`flex items-center justify-between p-2 rounded-lg border ${cardData.statusConfig.bg} ${cardData.statusConfig.border}`}>
                <span className="text-slate-300 flex items-center gap-1">
                  <span className={`status-indicator w-1 h-1 rounded-full ${cardData.statusConfig.color.replace('text-', 'bg-')}`} />
                  Stock
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${cardData.statusConfig.color}`}>
                    {part.quantity}
                  </span>
                  <Badge variant="secondary" className={`text-xs ${cardData.statusConfig.bg} ${cardData.statusConfig.color} border-0`}>
                    {cardData.statusConfig.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 🚀 OPTIMIZED: Simple action button */}
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={cardData.isOutOfStock}
              className={`w-full h-8 text-sm transition-all duration-200 ${
                cardData.isOutOfStock
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              {cardData.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>

      {/* 🚀 OPTIMIZED: Conditional modal rendering */}
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
}, (prevProps, nextProps) => {
  // 🚀 PERFORMANCE: Custom comparison for deeper optimization
  return (
    prevProps.part.id === nextProps.part.id &&
    prevProps.part.quantity === nextProps.part.quantity &&
    prevProps.part.name === nextProps.part.name &&
    prevProps.part.price === nextProps.part.price &&
    prevProps.user?.role === nextProps.user?.role
  );
});

OptimizedPartCard.displayName = 'OptimizedPartCard';

export default OptimizedPartCard;