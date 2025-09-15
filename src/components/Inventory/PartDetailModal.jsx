import React, { useState, useMemo, useCallback } from 'react';
import { 
  X, ShoppingCart, Edit2, Trash2, MinusCircle, PlusCircle, 
  Building2, Calculator, MapPin, Clock, TrendingUp, Activity 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';

const PartDetailModal = ({ 
  isOpen, 
  onClose, 
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
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [useQuantity, setUseQuantity] = useState(1);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  // Enhanced consumption analysis
  const partData = useMemo(() => {
    if (!part) return null;
    
    const totalValue = (part.quantity || 0) * (part.price || 0);
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const yearlyUsage = part.yearly_usage || 0;
    const leadTimeWeeks = part.lead_time_weeks || 2;
    const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
    
    // Smart consumption pattern analysis
    let effectiveWeeklyUsage = weeklyUsage;
    let consumptionFrequency = 'Unknown';
    let nextOrderDate = null;
    
    if (weeklyUsage > 0) {
      consumptionFrequency = 'Weekly';
      const weeksUntilReorder = Math.floor((part.quantity || 0) / weeklyUsage);
      nextOrderDate = new Date(Date.now() + (weeksUntilReorder * 7 * 24 * 60 * 60 * 1000));
    } else if (monthlyUsage > 0) {
      effectiveWeeklyUsage = monthlyUsage / 4.33;
      consumptionFrequency = 'Monthly';
      const monthsUntilReorder = Math.floor((part.quantity || 0) / monthlyUsage);
      nextOrderDate = new Date(Date.now() + (monthsUntilReorder * 30 * 24 * 60 * 60 * 1000));
    } else if (yearlyUsage > 0) {
      effectiveWeeklyUsage = yearlyUsage / 52;
      consumptionFrequency = 'Yearly';
      const yearsUntilReorder = Math.floor((part.quantity || 0) / yearlyUsage);
      nextOrderDate = new Date(Date.now() + (yearsUntilReorder * 365 * 24 * 60 * 60 * 1000));
    }

    const reorderLevel = effectiveWeeklyUsage > 0 
      ? Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock) 
      : 0;

    const quantity = part.quantity || 0;
    const minStock = part.min_stock || 0;
    
    let healthStatus, healthColor, healthIcon;
    if (quantity === 0) {
      healthStatus = 'Out of Stock';
      healthColor = 'text-red-400';
      healthIcon = '❌';
    } else if (quantity <= minStock) {
      healthStatus = 'Critical';
      healthColor = 'text-red-400';
      healthIcon = '⚠️';
    } else if (reorderLevel > 0 && quantity <= reorderLevel) {
      healthStatus = 'Reorder Needed';
      healthColor = 'text-orange-400';
      healthIcon = '📈';
    } else {
      healthStatus = 'Healthy';
      healthColor = 'text-green-400';
      healthIcon = '✅';
    }

    return { 
      totalValue, 
      reorderLevel, 
      healthStatus, 
      healthColor, 
      healthIcon,
      consumptionFrequency,
      effectiveWeeklyUsage,
      nextOrderDate,
      weeklyUsage,
      monthlyUsage,
      yearlyUsage
    };
  }, [part]);

  const partMovements = useMemo(() =>
    (movements || [])
      .filter(m => m.part_id === part?.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10), 
    [movements, part?.id]
  );

  const handleUsePart = useCallback(async () => {
    if (!part || useQuantity <= 0 || useQuantity > part.quantity) {
      toast({ variant: "destructive", title: "Invalid Quantity" });
      return;
    }

    try {
      const success = await recordPartUsage(part.id, useQuantity, selectedMachine || null);
      if (success) {
        toast({ 
          title: "✅ Part Used", 
          description: `${useQuantity} pieces deducted from ${part.name}` 
        });
        setUseQuantity(1);
        setSelectedMachine('');
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "❌ Failed to use part", 
        description: error.message 
      });
    }
  }, [part, useQuantity, selectedMachine, recordPartUsage, toast]);

  const handleRestock = useCallback(async () => {
    if (!part || restockQuantity <= 0) {
      toast({ variant: "destructive", title: "Invalid Quantity" });
      return;
    }

    try {
      await restockPart(part.id, restockQuantity);
      toast({ 
        title: "✅ Restocked", 
        description: `${restockQuantity} pieces added to ${part.name}` 
      });
      setRestockQuantity(1);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "❌ Failed to restock part", 
        description: error.message 
      });
    }
  }, [part, restockQuantity, restockPart, toast]);

  if (!isOpen || !part || !partData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-750">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">{part.name}</h2>
                <p className="text-sm text-slate-400">#{part.part_number}</p>
              </div>
            </div>
            <Badge className={`px-3 py-1 ${partData.healthColor}`}>
              {partData.healthIcon} {partData.healthStatus}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Part Info & Metrics */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-750 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-slate-400">Current Stock</span>
                  </div>
                  <p className="text-lg font-bold text-white mt-1">{part.quantity}</p>
                </div>
                
                <div className="bg-slate-750 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-slate-400">Total Value</span>
                  </div>
                  <p className="text-lg font-bold text-white mt-1">{formatCurrency(partData.totalValue)}</p>
                </div>
                
                <div className="bg-slate-750 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-slate-400">Reorder Level</span>
                  </div>
                  <p className="text-lg font-bold text-white mt-1">{partData.reorderLevel}</p>
                </div>
                
                <div className="bg-slate-750 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-slate-400">Usage Pattern</span>
                  </div>
                  <p className="text-sm font-medium text-white mt-1">{partData.consumptionFrequency}</p>
                </div>
              </div>

              {/* Consumption Analysis */}
              <div className="bg-slate-750 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Consumption Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {partData.weeklyUsage > 0 && (
                    <div>
                      <span className="text-sm text-slate-400">Weekly Usage</span>
                      <p className="text-xl font-bold text-green-400">{partData.weeklyUsage}</p>
                    </div>
                  )}
                  {partData.monthlyUsage > 0 && (
                    <div>
                      <span className="text-sm text-slate-400">Monthly Usage</span>
                      <p className="text-xl font-bold text-blue-400">{partData.monthlyUsage}</p>
                    </div>
                  )}
                  {partData.yearlyUsage > 0 && (
                    <div>
                      <span className="text-sm text-slate-400">Yearly Usage</span>
                      <p className="text-xl font-bold text-purple-400">{partData.yearlyUsage}</p>
                    </div>
                  )}
                </div>
                
                {partData.nextOrderDate && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-blue-400">
                        Estimated reorder date: {format(partData.nextOrderDate, 'PPP')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Movements */}
              <div className="bg-slate-750 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {partMovements.length > 0 ? (
                    partMovements.map((movement, index) => (
                      <div key={movement.id || index} className="flex justify-between items-center py-2 border-b border-slate-600 last:border-0">
                        <div>
                          <span className="text-sm text-white">{movement.type || 'Movement'}</span>
                          <p className="text-xs text-slate-400">
                            {movement.timestamp ? format(new Date(movement.timestamp), 'PPp') : 'Unknown date'}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-slate-300">
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              
              {/* Use Part */}
              <div className="bg-slate-750 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <MinusCircle className="h-5 w-5 mr-2 text-red-400" />
                  Use Part
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-400">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      max={part.quantity}
                      value={useQuantity}
                      onChange={(e) => setUseQuantity(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Machine (Optional)</label>
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select machine" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines?.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleUsePart} 
                    disabled={part.quantity === 0}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <MinusCircle className="h-4 w-4 mr-2" />
                    Use {useQuantity} Part{useQuantity !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>

              {/* Restock */}
              <div className="bg-slate-750 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <PlusCircle className="h-5 w-5 mr-2 text-green-400" />
                  Restock
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-400">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleRestock}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add {restockQuantity} Part{restockQuantity !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-750 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => onAddToCart(part)}
                    disabled={part.quantity === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={() => onEdit(part)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Part
                  </Button>
                  <Button
                    onClick={() => onDelete(part)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Part
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PartDetailModal, (prev, next) => prev.part?.id === next.part?.id);
