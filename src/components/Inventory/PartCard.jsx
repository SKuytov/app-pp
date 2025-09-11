import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, Building2, DollarSign, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';

const PartCard = ({ 
  part, 
  onClick, 
  onAddToCart, 
  showReorderStatus = true 
}) => {
  const { formatCurrency } = useCurrency();
  
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
  
  const getStockStatusColor = (quantity, minStock, reorderLevel) => {
    if (quantity <= minStock) return 'text-red-400 bg-red-900/30 border-red-500/50';
    if (quantity <= reorderLevel) return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
    return 'text-green-400 bg-green-900/30 border-green-500/50';
  };

  const getStockStatusText = (quantity, minStock, reorderLevel) => {
    if (quantity <= minStock) return 'Critical';
    if (quantity <= reorderLevel) return 'Reorder';
    return 'OK';
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'A': return 'bg-red-100 text-red-800 border-red-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const totalValue = (part.quantity || 0) * (part.price || 0);
  const needsReorder = reorderLevel > 0 && part.quantity <= reorderLevel;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card 
        className="bg-slate-800/50 border-slate-600 hover:border-slate-500 cursor-pointer transition-all duration-200 h-full flex flex-col"
        onClick={onClick}
      >
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Header with Image/Icon */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              {part.image_url ? (
                <img 
                  src={part.image_url} 
                  alt={part.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate mb-1">
                {part.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs font-mono"
                >
                  {part.part_number}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getCriticalityColor(part.criticality)}`}
                >
                  {part.criticality}
                </Badge>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          {(part.supplier_id || part.supplier) && (
            <div className="mb-3 p-2 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-slate-300 mb-1">
                <Building2 className="w-3 h-3" />
                <span>Supplier</span>
              </div>
              <div className="text-xs text-white">
                {part.supplier_id && (
                  <div className="font-mono">ID: {part.supplier_id}</div>
                )}
                {part.supplier && (
                  <div className="truncate">{part.supplier}</div>
                )}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-xs">Stock Status</span>
              {showReorderStatus && needsReorder && (
                <Badge variant="outline" className="text-orange-400 border-orange-500 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Reorder
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-slate-400">Current</div>
                <div className={`font-bold ${
                  part.quantity <= part.min_stock ? 'text-red-400' : 
                  needsReorder ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {part.quantity || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Min</div>
                <div className="font-bold text-slate-200">{part.min_stock || 0}</div>
              </div>
              {showReorderStatus && reorderLevel > 0 && (
                <div className="text-center">
                  <div className="text-slate-400">Reorder</div>
                  <div className="font-bold text-orange-300">{reorderLevel}</div>
                </div>
              )}
            </div>

            {/* Stock Status Indicator */}
            <div className={`mt-2 px-2 py-1 rounded text-xs text-center border ${
              getStockStatusColor(part.quantity, part.min_stock, reorderLevel)
            }`}>
              {part.quantity <= part.min_stock && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              {getStockStatusText(part.quantity, part.min_stock, reorderLevel)}
            </div>
          </div>

          {/* Pricing Information */}
          <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-blue-300 mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Pricing</span>
            </div>
            <div className="text-xs">
              <div className="text-white">
                <span className="text-blue-200">Per 1 pcs:</span> {formatCurrency(part.price || 0)}
              </div>
              {totalValue > 0 && (
                <div className="text-green-300 font-semibold">
                  <span className="text-blue-200">Total value:</span> {formatCurrency(totalValue)}
                </div>
              )}
            </div>
          </div>

          {/* Consumption Pattern */}
          {(part.weekly_usage || part.monthly_usage) && (
            <div className="mb-3 text-xs">
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Usage Pattern</span>
              </div>
              <div className="text-white">
                {part.weekly_usage && <div>Weekly: {part.weekly_usage}</div>}
                {part.monthly_usage && <div>Monthly: {part.monthly_usage}</div>}
              </div>
            </div>
          )}

          {/* Location */}
          {part.location && (
            <div className="mb-3 text-xs">
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <MapPin className="w-3 h-3" />
                <span>Location</span>
              </div>
              <div className="text-white truncate">{part.location}</div>
            </div>
          )}

          {/* Category Tags */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {part.main_group && (
              <Badge variant="secondary" className="text-xs">
                {part.main_group}
              </Badge>
            )}
            {part.sub_group && (
              <Badge variant="outline" className="text-xs">
                {part.sub_group}
              </Badge>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(part);
              }}
              disabled={!part.quantity || part.quantity <= 0}
            >
              {!part.quantity || part.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PartCard;