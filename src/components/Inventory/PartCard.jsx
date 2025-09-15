import React, { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Building2, TrendingUp, Edit2, Trash2, Eye } from 'lucide-react';

const PartCard = memo(({ part, onEdit, onDelete, user, onAddToCart, onViewDetails }) => {
  // Enhanced consumption calculation for weekly/monthly/yearly patterns
  const cardData = useMemo(() => {
    const quantity = part.quantity || 0;
    const minStock = part.min_stock || 0;
    const isOutOfStock = quantity <= 0;
    const isLowStock = quantity <= minStock;

    // Smart consumption pattern detection
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const yearlyUsage = part.yearly_usage || 0;
    
    // Calculate effective usage based on available data
    let effectiveWeeklyUsage = weeklyUsage;
    if (!effectiveWeeklyUsage && monthlyUsage) {
      effectiveWeeklyUsage = monthlyUsage / 4.33;
    } else if (!effectiveWeeklyUsage && yearlyUsage) {
      effectiveWeeklyUsage = yearlyUsage / 52;
    }

    // Enhanced reorder calculation
    const leadTimeWeeks = part.lead_time_weeks || 2;
    const safetyStock = part.safety_stock || Math.ceil(minStock * 0.2);
    const reorderLevel = effectiveWeeklyUsage > 0 
      ? Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock) 
      : 0;
    
    const needsReorder = reorderLevel > 0 && quantity <= reorderLevel;

    // Status determination with consumption awareness
    let status, statusColor, statusBg, statusIcon;
    if (isOutOfStock) {
      status = 'OUT'; statusColor = 'text-red-400'; statusBg = 'bg-red-500/20'; statusIcon = '❌';
    } else if (isLowStock) {
      status = 'LOW'; statusColor = 'text-red-400'; statusBg = 'bg-red-500/20'; statusIcon = '⚠️';
    } else if (needsReorder) {
      status = 'REORDER'; statusColor = 'text-orange-400'; statusBg = 'bg-orange-500/20'; statusIcon = '📈';
    } else {
      status = 'OK'; statusColor = 'text-green-400'; statusBg = 'bg-green-500/20'; statusIcon = '✅';
    }

    // Consumption pattern display
    let consumptionPattern = '';
    if (yearlyUsage && !monthlyUsage && !weeklyUsage) {
      consumptionPattern = `${yearlyUsage}/year`;
    } else if (monthlyUsage && !weeklyUsage) {
      consumptionPattern = `${monthlyUsage}/month`;
    } else if (weeklyUsage) {
      consumptionPattern = `${weeklyUsage}/week`;
    }

    return { 
      isOutOfStock, 
      status, 
      statusColor, 
      statusBg, 
      statusIcon, 
      consumptionPattern, 
      reorderLevel, 
      effectiveWeeklyUsage 
    };
  }, [
    part.quantity,
    part.min_stock,
    part.weekly_usage,
    part.monthly_usage,
    part.yearly_usage,
    part.lead_time_weeks,
    part.safety_stock
  ]);

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

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(part);
  }, [part, onDelete]);

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-slate-800 border border-slate-700 rounded-xl p-4 hover:bg-slate-750 hover:border-slate-600 transition-all duration-200 cursor-pointer"
    >
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-3">
        <Badge className={`px-3 py-1 text-xs font-medium border-0 ${cardData.statusBg} ${cardData.statusColor}`}>
          {cardData.statusIcon} {cardData.status}
        </Badge>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleQuickEdit}
            className="h-6 w-6 p-0 hover:bg-slate-700"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-6 w-6 p-0 hover:bg-slate-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Part Image */}
      <div className="mb-3 aspect-video bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
        {part.image_url ? (
          <img 
            src={part.image_url} 
            alt={part.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`flex flex-col items-center justify-center text-slate-400 ${part.image_url ? 'hidden' : 'flex'}`}>
          <Package className="h-8 w-8 mb-2" />
          <span className="text-xs">No image</span>
        </div>
      </div>

      {/* Part Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-white text-sm truncate">
          {part.name}
        </h3>
        <p className="text-xs text-slate-400 truncate">
          #{part.part_number}
        </p>
      </div>

      {/* Metrics */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Stock:</span>
          <span className={`font-medium ${cardData.isOutOfStock ? 'text-red-400' : cardData.status === 'LOW' ? 'text-orange-400' : 'text-slate-300'}`}>
            {part.quantity}
          </span>
        </div>
        
        {cardData.consumptionPattern && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Usage:</span>
            <span className="text-slate-300">{cardData.consumptionPattern}</span>
          </div>
        )}
        
        {cardData.reorderLevel > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Reorder:</span>
            <span className="text-slate-300">{cardData.reorderLevel}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={cardData.isOutOfStock}
          className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <ShoppingCart className="h-3 w-3 mr-1" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
});

export default PartCard;
