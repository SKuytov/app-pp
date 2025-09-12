import React, { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Building2, TrendingUp } from 'lucide-react';

// 🚀 WORLD-CLASS PERFORMANCE: Ultra-lightweight PartCard for 10,000+ parts
const WorldClassPartCard = memo(({ 
  part, 
  onEdit, 
  onDelete, 
  user, 
  onAddToCart,
  onViewDetails 
}) => {
  // 🔧 ULTRA-OPTIMIZED: Single calculation for all status
  const cardData = useMemo(() => {
    const quantity = part.quantity || 0;
    const minStock = part.min_stock || 0;
    const isOutOfStock = quantity <= 0;
    const isLowStock = quantity <= minStock;
    
    // Simple reorder calculation
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
    const reorderLevel = effectiveWeeklyUsage > 0 ? 
      Math.ceil((effectiveWeeklyUsage * (part.lead_time_weeks || 2)) + (part.safety_stock || Math.ceil(minStock * 0.2))) : 0;
    const needsReorder = reorderLevel > 0 && quantity <= reorderLevel;

    // Status determination
    let status, statusColor, statusBg;
    if (isOutOfStock) {
      status = 'OUT'; statusColor = 'text-red-400'; statusBg = 'bg-red-500/20';
    } else if (isLowStock) {
      status = 'LOW'; statusColor = 'text-red-400'; statusBg = 'bg-red-500/20';
    } else if (needsReorder) {
      status = 'REORDER'; statusColor = 'text-orange-400'; statusBg = 'bg-orange-500/20';
    } else {
      status = 'OK'; statusColor = 'text-green-400'; statusBg = 'bg-green-500/20';
    }

    return { isOutOfStock, isLowStock, needsReorder, status, statusColor, statusBg };
  }, [part.quantity, part.min_stock, part.weekly_usage, part.monthly_usage, part.lead_time_weeks, part.safety_stock]);

  // 🚀 PERFORMANCE: Stable event handlers
  const handleCardClick = useCallback(() => {
    onViewDetails(part);
  }, [part, onViewDetails]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (!cardData.isOutOfStock) onAddToCart(part);
  }, [part, onAddToCart, cardData.isOutOfStock]);

  const handleQuickEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit(part);
  }, [part, onEdit]);

  return (
    <div 
      className="group relative bg-slate-800/80 border border-slate-600/40 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:bg-slate-700/80 hover:border-slate-500/60 hover:shadow-lg"
      onClick={handleCardClick}
    >
      {/* 🎨 MINIMAL: Status indicator strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${cardData.statusBg}`} />

      {/* 🔧 OPTIMIZED: Compact image */}
      <div className="relative aspect-square w-full bg-slate-700/40 rounded-lg mb-3 overflow-hidden">
        {part.image_url ? (
          <img 
            src={part.image_url} 
            alt={part.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
        )}
        
        {/* Status badge overlay */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${cardData.statusBg} ${cardData.statusColor} border border-current/20`}>
          {cardData.status}
        </div>
      </div>

      {/* 🔧 STREAMLINED: Essential info only */}
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors">
          {part.name}
        </h3>

        {/* Key details - horizontal layout */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">{part.part_number}</span>
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span className="text-slate-300">{part.supplier_id || 'N/A'}</span>
          </div>
        </div>

        {/* Stock info */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">Stock:</span>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${cardData.statusColor}`}>
              {part.quantity}
            </span>
            {(cardData.isLowStock || cardData.needsReorder) && (
              <AlertTriangle className="w-3 h-3 text-orange-400" />
            )}
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={handleAddToCart}
          disabled={cardData.isOutOfStock}
          size="sm"
          className={`w-full h-7 text-xs transition-colors ${
            cardData.isOutOfStock 
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <ShoppingCart className="w-3 h-3 mr-1" />
          {cardData.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>

      {/* 🚀 ADMIN: Quick edit on hover */}
      {user?.role === 'admin' && (
        <button
          onClick={handleQuickEdit}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700/90 hover:bg-blue-600/90 p-1.5 rounded-full"
        >
          <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // 🚀 PERFORMANCE: Custom comparison for minimal re-renders
  return (
    prevProps.part.id === nextProps.part.id &&
    prevProps.part.quantity === nextProps.part.quantity &&
    prevProps.part.name === nextProps.part.name &&
    prevProps.user?.role === nextProps.user?.role
  );
});

WorldClassPartCard.displayName = 'WorldClassPartCard';
export default WorldClassPartCard;