import React, { useState, useMemo, useCallback } from 'react';
import { X, ShoppingCart, Edit2, Trash2, MinusCircle, PlusCircle, Building2, Calculator, MapPin, Clock, TrendingUp, Activity, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';

// 🏆 WORLD-CLASS PART DETAIL MODAL - Redesigned for maximum efficiency
const WorldClassPartDetailModal = ({
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

  // 🔧 OPTIMIZED: Pre-calculate all values
  const partData = useMemo(() => {
    const totalValue = (part.quantity || 0) * (part.price || 0);
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const leadTimeWeeks = part.lead_time_weeks || 2;
    const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
    const reorderLevel = effectiveWeeklyUsage > 0 ? Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock) : 0;
    
    const quantity = part.quantity || 0;
    const minStock = part.min_stock || 0;
    
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
  }, [part]);

  const partMovements = useMemo(() => 
    (movements || []).filter(m => m.part_id === part.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
  , [movements, part.id]);

  // 🚀 STREAMLINED: Action handlers
  const handleUsePart = useCallback(async () => {
    if (useQuantity <= 0 || useQuantity > part.quantity) {
      toast({ variant: "destructive", title: "Invalid Quantity" });
      return;
    }
    const success = await recordPartUsage(part.id, useQuantity, selectedMachine || null);
    if (success) {
      toast({ title: "✅ Part Used", description: `${useQuantity} pieces deducted` });
      setUseQuantity(1);
      setSelectedMachine('');
    }
  }, [part.id, useQuantity, selectedMachine, recordPartUsage, toast, part.quantity]);

  const handleRestock = useCallback(async () => {
    if (restockQuantity <= 0) {
      toast({ variant: "destructive", title: "Invalid Quantity" });
      return;
    }
    await restockPart(part.id, restockQuantity);
    toast({ title: "✅ Restocked", description: `${restockQuantity} pieces added` });
    setRestockQuantity(1);
  }, [part.id, restockQuantity, restockPart, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800/95 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-600/50">
        
        {/* 🎨 PREMIUM: Header with immediate actions */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-gradient-to-r from-slate-800/80 to-slate-700/80">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white truncate">{part.name}</h1>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50`}>
                <span className="text-lg">{partData.healthIcon}</span>
                <span className={`text-sm font-medium ${partData.healthColor}`}>
                  {partData.healthStatus}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <span className="font-mono text-blue-400">{part.part_number}</span>
              </span>
              {part.supplier_id && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{part.supplier_id} - {part.supplier}</span>
                </span>
              )}
            </div>
          </div>

          {/* 🚀 FLOATING: Primary action buttons */}
          <div className="flex items-center gap-2">
            <Button onClick={() => { onAddToCart(part); onClose(); }} disabled={part.quantity <= 0} className="bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            {user?.role === 'admin' && (
              <>
                <Button variant="outline" onClick={() => onEdit(part)} className="border-slate-500">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 🔧 OPTIMIZED: Single scroll container */}
        <div className="flex max-h-[calc(95vh-140px)]">
          
          {/* 🎨 LEFT: Image and key stats */}
          <div className="w-80 p-6 border-r border-slate-600/50 bg-slate-800/50">
            
            {/* Large product image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-700/30 mb-4">
              {part.image_url ? (
                <img src={part.image_url} alt={part.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-slate-400 text-center">
                    <div className="w-16 h-16 mx-auto mb-2 opacity-50">📦</div>
                    <p className="text-sm">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* 🔧 COMPACT: Essential stats */}
            <div className="space-y-3">
              
              {/* Price & Value */}
              <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-lg p-3">
                <div className="text-green-300 text-sm mb-1">Pricing</div>
                <div className="text-white text-lg font-bold">{formatCurrency(part.price)}</div>
                <div className="text-green-400 text-sm">Total: {formatCurrency(partData.totalValue)}</div>
              </div>

              {/* Stock levels */}
              <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Current Stock</span>
                  <span className={`font-bold ${partData.healthColor}`}>{part.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Min Stock</span>
                  <span className="text-white">{part.min_stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Reorder Level</span>
                  <span className="text-orange-400">{partData.reorderLevel}</span>
                </div>
              </div>

              {/* Location & Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{part.location || 'Location not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Lead Time: {part.lead_time_weeks || 2} weeks</span>
                </div>
              </div>

              {/* 🔧 REPOSITIONED: CAD Files (compact) */}
              {part.cad_url && (
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(part.cad_url, '_blank')}
                  className="w-full bg-slate-700/30 hover:bg-slate-600/50 border-slate-500/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CAD File
                </Button>
              )}
            </div>
          </div>

          {/* 🚀 RIGHT: Main content area */}
          <div className="flex-1 overflow-y-auto">
            
            {/* 🎯 PROMINENT: Quick actions (always visible) */}
            {user?.role === 'admin' && (
              <div className="p-6 border-b border-slate-600/30 bg-slate-700/20">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Quick Actions
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Use Part */}
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MinusCircle className="w-5 h-5 text-red-400" />
                      <h4 className="text-red-300 font-medium">Use Part</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={useQuantity}
                        onChange={e => setUseQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        max={part.quantity}
                        className="w-20 h-8 bg-slate-700/50 text-white text-sm"
                      />
                      <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                        <SelectTrigger className="flex-1 h-8 bg-slate-700/50 text-sm">
                          <SelectValue placeholder="Machine (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {(machines || []).map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleUsePart} size="sm" className="bg-red-600 hover:bg-red-700 h-8">
                        Use
                      </Button>
                    </div>
                  </div>

                  {/* Restock */}
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <PlusCircle className="w-5 h-5 text-green-400" />
                      <h4 className="text-green-300 font-medium">Restock</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={restockQuantity}
                        onChange={e => setRestockQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-20 h-8 bg-slate-700/50 text-white text-sm"
                      />
                      <span className="text-slate-400 text-sm flex-1">pieces</span>
                      <Button onClick={handleRestock} size="sm" className="bg-green-600 hover:bg-green-700 h-8">
                        Add Stock
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 📊 CONTENT: Organized sections */}
            <div className="p-6 space-y-6">
              
              {/* Consumption Pattern */}
              {(part.weekly_usage || part.monthly_usage) && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-purple-300 font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Usage Pattern
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-purple-200 mb-1">Weekly</div>
                      <div className="text-white font-semibold">{part.weekly_usage || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-purple-200 mb-1">Monthly</div>
                      <div className="text-white font-semibold">{part.monthly_usage || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-purple-200 mb-1">Lead Time</div>
                      <div className="text-white font-semibold">{part.lead_time_weeks || 2} weeks</div>
                    </div>
                    <div>
                      <div className="text-purple-200 mb-1">Safety Stock</div>
                      <div className="text-white font-semibold">{part.safety_stock || 'Auto'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity ({partMovements.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {partMovements.length > 0 ? partMovements.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded bg-slate-600/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${m.type === 'IN' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div>
                          <div className="text-white text-sm font-medium">{m.description}</div>
                          <div className="text-slate-400 text-xs">by {m.user_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${m.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {format(new Date(m.timestamp), "MMM d, HH:mm")}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-400">
                      No activity recorded for this part
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldClassPartDetailModal;