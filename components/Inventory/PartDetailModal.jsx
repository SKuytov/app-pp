import React, { useState, useMemo, useCallback } from 'react';
import { X, ShoppingCart, Edit2, Trash2, MinusCircle, PlusCircle, Building2, Calculator, MapPin, Clock, TrendingUp, Activity, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, isValid } from 'date-fns';

// 🏆 WORLD-CLASS PART DETAIL MODAL - Fixed all accessibility and React errors
const WorldClassPartDetailModal = ({
  isOpen,
  onClose,
  part,
  onEdit,
  onDelete,
  user,
  movements = [],
  recordPartUsage,
  machines = [],
  restockPart,
  onAddToCart
}) => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [useQuantity, setUseQuantity] = useState(1);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  // 🔧 FIXED: Safe error handling to prevent React Error #31
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return isValid(value) ? format(value, 'MMM d, yyyy HH:mm') : 'Invalid Date';
      }
      if (value.message) return String(value.message);
      if (value.error) return String(value.error);
      return JSON.stringify(value);
    }
    return String(value);
  };

  // 🔧 FIXED: Safe part data access with proper validation
  const partData = useMemo(() => {
    if (!part || typeof part !== 'object') {
      return {
        totalValue: 0,
        reorderLevel: 0,
        healthStatus: 'Unknown',
        healthColor: 'text-gray-400',
        healthIcon: '❓'
      };
    }

    try {
      const quantity = Number(part.quantity) || 0;
      const price = Number(part.price) || 0;
      const totalValue = quantity * price;
      const weeklyUsage = Number(part.weekly_usage) || 0;
      const monthlyUsage = Number(part.monthly_usage) || 0;
      const leadTimeWeeks = Number(part.lead_time_weeks) || 2;
      const minStock = Number(part.min_stock) || 0;
      const safetyStock = Number(part.safety_stock) || Math.ceil(minStock * 0.2);
      const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
      const reorderLevel = effectiveWeeklyUsage > 0 ? Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock) : 0;
      
      let healthStatus, healthColor, healthIcon;
      if (quantity === 0) {
        healthStatus = 'Out of Stock'; healthColor = 'text-red-400'; healthIcon = '❌';
      } else if (quantity <= minStock) {
        healthStatus = 'Critical'; healthColor = 'text-red-400'; healthIcon = '⚠️';
      } else if (reorderLevel > 0 && quantity <= reorderLevel) {
        healthStatus = 'Reorder Needed'; healthColor = 'text-orange-400'; healthIcon = '📈';
      } else {
        healthStatus = 'Healthy'; healthColor = 'text-green-400'; healthIcon = '✅';
      }

      return { totalValue, reorderLevel, healthStatus, healthColor, healthIcon };
    } catch (error) {
      console.error('Error calculating part data:', safeToString(error));
      return {
        totalValue: 0,
        reorderLevel: 0,
        healthStatus: 'Error',
        healthColor: 'text-red-400',
        healthIcon: '❌'
      };
    }
  }, [part]);

  // 🔧 FIXED: Safe movements filtering with error handling
  const partMovements = useMemo(() => {
    try {
      if (!Array.isArray(movements) || !part?.id) return [];
      
      return movements
        .filter(m => m && m.part_id === part.id)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return isValid(dateB) && isValid(dateA) ? dateB - dateA : 0;
        })
        .slice(0, 10);
    } catch (error) {
      console.error('Error processing movements:', safeToString(error));
      return [];
    }
  }, [movements, part?.id]);

  // 🚀 FIXED: Improved action handlers with proper error handling
  const handleUsePart = useCallback(async () => {
    try {
      if (useQuantity <= 0 || useQuantity > (part?.quantity || 0)) {
        toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter a valid quantity" });
        return;
      }
      
      const success = await recordPartUsage(part.id, useQuantity, selectedMachine || null);
      if (success) {
        toast({ title: "✅ Part Used", description: `${useQuantity} pieces deducted` });
        setUseQuantity(1);
        setSelectedMachine('');
      }
    } catch (error) {
      console.error('Error using part:', safeToString(error));
      toast({ variant: "destructive", title: "Error", description: "Failed to use part" });
    }
  }, [part?.id, useQuantity, selectedMachine, recordPartUsage, toast, part?.quantity]);

  const handleRestock = useCallback(async () => {
    try {
      if (restockQuantity <= 0) {
        toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter a valid quantity" });
        return;
      }
      
      await restockPart(part.id, restockQuantity);
      toast({ title: "✅ Restocked", description: `${restockQuantity} pieces added` });
      setRestockQuantity(1);
    } catch (error) {
      console.error('Error restocking part:', safeToString(error));
      toast({ variant: "destructive", title: "Error", description: "Failed to restock part" });
    }
  }, [part?.id, restockQuantity, restockPart, toast]);

  // 🔧 FIXED: Safe part access with fallbacks
  const partName = safeToString(part?.name) || 'Unknown Part';
  const partNumber = safeToString(part?.part_number) || 'N/A';
  const supplierId = safeToString(part?.supplier_id);
  const supplierName = safeToString(part?.supplier);

  if (!isOpen || !part) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-slate-900 text-white border-slate-700 p-0 overflow-hidden">
        {/* 🔧 FIXED: Proper DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          {partName} - Part Details
        </DialogTitle>
        
        {/* 🔧 FIXED: Proper DialogDescription for accessibility */}
        <VisuallyHidden>
          <DialogDescription>
            View and manage details for {partName} (Part Number: {partNumber})
          </DialogDescription>
        </VisuallyHidden>

        {/* 🎨 PREMIUM: Header with immediate actions */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{partName}</h2>
              <Badge variant="outline" className={`${partData.healthColor} border-current`}>
                <span className="mr-1">{partData.healthIcon}</span>
                {partData.healthStatus}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span className="font-mono bg-slate-800 px-2 py-1 rounded">
                {partNumber}
              </span>
              {supplierId && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {supplierId} - {supplierName}
                </span>
              )}
            </div>
          </div>

          {/* 🚀 FLOATING: Primary action buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onAddToCart && onAddToCart(part)}
              disabled={!part?.quantity || part.quantity <= 0}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            
            {user?.role === 'admin' && (
              <>
                <Button variant="outline" size="sm" onClick={() => onEdit && onEdit(part)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete && onDelete(part)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 🔧 OPTIMIZED: Single scroll container */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            
            {/* 🎨 LEFT: Image and key stats */}
            <div className="space-y-4">
              
              {/* Large product image */}
              <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                {part.image_url ? (
                  <img 
                    src={part.image_url} 
                    alt={partName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Package className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-sm">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 🔧 COMPACT: Essential stats */}
              <div className="space-y-3">
                
                {/* Price & Value */}
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Pricing</p>
                  <p className="text-lg font-semibold">{formatCurrency(part.price || 0)}</p>
                  <p className="text-sm text-slate-400">Total: {formatCurrency(partData.totalValue)}</p>
                </div>

                {/* Stock levels */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/50 p-2 rounded text-center">
                    <p className="text-xs text-slate-400">Current Stock</p>
                    <p className="font-semibold">{safeToString(part.quantity || 0)}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded text-center">
                    <p className="text-xs text-slate-400">Min Stock</p>
                    <p className="font-semibold">{safeToString(part.min_stock || 0)}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded text-center">
                    <p className="text-xs text-slate-400">Reorder Level</p>
                    <p className="font-semibold">{safeToString(partData.reorderLevel)}</p>
                  </div>
                </div>

                {/* Location & Details */}
                <div className="bg-slate-800/50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{safeToString(part.location) || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Lead Time: {safeToString(part.lead_time_weeks || 2)} weeks</span>
                  </div>
                </div>

                {/* 🔧 REPOSITIONED: CAD Files (compact) */}
                {part.cad_url && (
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <a href={part.cad_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download CAD
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* 🚀 RIGHT: Main content area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 🎯 PROMINENT: Quick actions (always visible) */}
              {user?.role === 'admin' && (
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Quick Actions
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Use Part */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MinusCircle className="w-4 h-4 text-red-400" />
                        <h4 className="font-medium">Use Part</h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={useQuantity}
                          onChange={(e) => setUseQuantity(parseInt(e.target.value) || 1)}
                          min="1"
                          max={part.quantity || 0}
                          className="w-20 h-8 bg-slate-700/50 text-white text-sm"
                        />
                        <span className="text-sm text-slate-400">pieces</span>
                      </div>
                      
                      <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                        <SelectTrigger className="bg-slate-700/50 text-white text-sm h-8">
                          <SelectValue placeholder="Select machine" />
                        </SelectTrigger>
                        <SelectContent>
                          {machines.map(m => (
                            <SelectItem key={m.id} value={m.id}>{safeToString(m.name)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button onClick={handleUsePart} size="sm" className="w-full bg-red-600 hover:bg-red-700">
                        Use {useQuantity} pieces
                      </Button>
                    </div>

                    {/* Restock */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-green-400" />
                        <h4 className="font-medium">Restock</h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={restockQuantity}
                          onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-20 h-8 bg-slate-700/50 text-white text-sm"
                        />
                        <span className="text-sm text-slate-400">pieces</span>
                      </div>
                      
                      <Button onClick={handleRestock} size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        Add {restockQuantity} pieces
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 📊 CONTENT: Organized sections */}
              <div className="space-y-6">
                
                {/* Consumption Pattern */}
                {(part.weekly_usage || part.monthly_usage) && (
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Usage Pattern
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Weekly</p>
                        <p className="font-semibold">{safeToString(part.weekly_usage) || 'Not set'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Monthly</p>
                        <p className="font-semibold">{safeToString(part.monthly_usage) || 'Not set'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Lead Time</p>
                        <p className="font-semibold">{safeToString(part.lead_time_weeks || 2)} weeks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Safety Stock</p>
                        <p className="font-semibold">{safeToString(part.safety_stock) || 'Auto'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity ({partMovements.length})
                  </h4>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {partMovements.length > 0 ? partMovements.map((m, index) => (
                      <div key={`${m.id}-${index}`} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {safeToString(m.description)}
                          </p>
                          <p className="text-xs text-slate-400">
                            by {safeToString(m.user_name)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <span className={`font-bold ${m.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                            {m.type === 'IN' ? '+' : '-'}{safeToString(m.quantity)}
                          </span>
                          <p className="text-xs text-slate-400">
                            {safeToString(m.timestamp ? format(new Date(m.timestamp), "MMM d, HH:mm") : 'Unknown time')}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-400 text-center py-4">
                        No activity recorded for this part
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorldClassPartDetailModal;
