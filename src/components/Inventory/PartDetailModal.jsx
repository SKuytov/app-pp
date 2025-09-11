import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, DraftingCompass, MinusCircle, PlusCircle, ShoppingCart, Package, Building2, Calculator, TrendingUp, MapPin, Clock, Zap, Activity, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';

const WorldBestPartDetailModal = ({ 
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
  const [isUsePartOpen, setIsUsePartOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [useQuantity, setUseQuantity] = useState(1);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Enhanced calculations
  const totalValue = useMemo(() => {
    return (part.quantity || 0) * (part.price || 0);
  }, [part.quantity, part.price]);

  const reorderLevel = useMemo(() => {
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const leadTimeWeeks = part.lead_time_weeks || 2;
    const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
    
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
    
    return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
  }, [part.weekly_usage, part.monthly_usage, part.lead_time_weeks, part.safety_stock, part.min_stock]);

  const stockHealth = useMemo(() => {
    const quantity = part.quantity || 0;
    const minStock = part.min_stock || 0;
    
    if (quantity === 0) return { status: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-900/20', icon: '❌' };
    if (quantity <= minStock) return { status: 'Critical', color: 'text-red-400', bg: 'bg-red-900/20', icon: '⚠️' };
    if (quantity <= reorderLevel) return { status: 'Reorder Needed', color: 'text-orange-400', bg: 'bg-orange-900/20', icon: '📈' };
    return { status: 'Healthy', color: 'text-green-400', bg: 'bg-green-900/20', icon: '✅' };
  }, [part.quantity, part.min_stock, reorderLevel]);

  const partMovements = useMemo(() => 
    (movements || []).filter(m => m.part_id === part.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  , [movements, part.id]);

  const handleUsePart = async () => {
    if (useQuantity <= 0 || useQuantity > part.quantity) {
      toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter a valid quantity." });
      return;
    }
    const success = await recordPartUsage(part.id, useQuantity, selectedMachine || null);
    if (success) {
      toast({ title: "✅ Part Used Successfully", description: `${useQuantity} pieces deducted from stock.` });
      setIsUsePartOpen(false);
      setUseQuantity(1);
      setSelectedMachine('');
    }
  };

  const handleRestockPart = async () => {
    if (restockQuantity <= 0) {
      toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter a positive number." });
      return;
    }
    await restockPart(part.id, restockQuantity);
    toast({ title: "✅ Part Restocked", description: `${restockQuantity} pieces added to stock.` });
    setIsRestockOpen(false);
    setRestockQuantity(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-slate-600/50"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Premium Header */}
          <div className="relative p-6 border-b border-slate-600/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {part.name}
                </motion.h1>
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Part Details
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {part.part_number}
                  </Badge>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${stockHealth.bg}`}>
                    <span>{stockHealth.icon}</span>
                    <span className={`text-sm font-medium ${stockHealth.color}`}>
                      {stockHealth.status}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full p-2"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Premium Tabs */}
          <div className="px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 rounded-xl p-1">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  History ({partMovements.length})
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Premium Image Section */}
                  <div className="lg:col-span-1">
                    <motion.div 
                      className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700/30 to-slate-800/30 shadow-inner"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {part.image_url ? (
                        <>
                          <img 
                            src={part.image_url} 
                            alt={part.name} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-24 h-24 text-slate-400" />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Premium Information Grid */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Key Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Part Number & Supplier */}
                      <motion.div 
                        className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="space-y-3">
                          <div>
                            <div className="text-blue-300 text-sm font-medium mb-1">Part Number</div>
                            <div className="text-white text-xl font-mono font-bold">{part.part_number}</div>
                          </div>
                          {part.supplier_id && (
                            <div>
                              <div className="flex items-center gap-2 text-blue-300 text-sm font-medium mb-1">
                                <Building2 className="w-4 h-4" />
                                Supplier ID
                              </div>
                              <div className="text-white text-lg font-mono font-semibold">{part.supplier_id}</div>
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Pricing Information */}
                      <motion.div 
                        className="p-4 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-800/20 border border-green-500/30"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="space-y-3">
                          <div>
                            <div className="text-green-300 text-sm font-medium mb-1">Unit Price (per 1 pcs)</div>
                            <div className="text-white text-2xl font-bold">{formatCurrency(part.price)}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-green-300 text-sm font-medium mb-1">
                              <Calculator className="w-4 h-4" />
                              Total Value ({part.quantity} pcs)
                            </div>
                            <div className="text-green-400 text-xl font-bold">{formatCurrency(totalValue)}</div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Stock Information */}
                    <motion.div 
                      className="p-6 rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-600/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Inventory Status
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-slate-600/30">
                          <div className="text-slate-300 text-sm mb-1">Current Stock</div>
                          <div className={`text-3xl font-bold ${stockHealth.color}`}>
                            {part.quantity}
                          </div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-slate-600/30">
                          <div className="text-slate-300 text-sm mb-1">Min Stock</div>
                          <div className="text-white text-2xl font-bold">{part.min_stock}</div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-orange-900/30 border border-orange-500/30">
                          <div className="text-orange-300 text-sm mb-1 flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Reorder Level
                          </div>
                          <div className="text-orange-400 text-2xl font-bold">{reorderLevel}</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Consumption Pattern */}
                    {(part.weekly_usage || part.monthly_usage) && (
                      <motion.div 
                        className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h4 className="text-purple-300 text-lg font-semibold mb-3 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Consumption Pattern
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-purple-200">Weekly Usage</div>
                            <div className="text-white font-semibold">{part.weekly_usage || 'Not set'}</div>
                          </div>
                          <div>
                            <div className="text-purple-200">Monthly Usage</div>
                            <div className="text-white font-semibold">{part.monthly_usage || 'Not set'}</div>
                          </div>
                          <div>
                            <div className="text-purple-200">Lead Time</div>
                            <div className="text-white font-semibold">{part.lead_time_weeks || 2} weeks</div>
                          </div>
                          <div>
                            <div className="text-purple-200">Safety Stock</div>
                            <div className="text-white font-semibold">{part.safety_stock || 'Auto'}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-700/30">
                        <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </div>
                        <div className="text-white font-semibold">{part.location || 'Not specified'}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-700/30">
                        <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                          <Building2 className="w-4 h-4" />
                          Supplier Name
                        </div>
                        <div className="text-white font-semibold">{part.supplier || 'Not specified'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Assets Section */}
                <motion.div 
                  className="p-6 rounded-xl bg-gradient-to-br from-slate-700/20 to-slate-800/20 border border-slate-600/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h4 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Assets & Files
                  </h4>
                  <div className="flex gap-3">
                    {part.cad_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(part.cad_url, '_blank')}
                        className="bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/50"
                      >
                        <DraftingCompass className="w-4 h-4 mr-2" />
                        CAD File
                        <Download className="w-3 h-3 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                {user.role === 'admin' && (
                  <motion.div 
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {!isUsePartOpen && !isRestockOpen && (
                      <>
                        <Button 
                          onClick={() => setIsUsePartOpen(true)}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                        >
                          <MinusCircle className="w-4 h-4 mr-2" />
                          Use Part
                        </Button>
                        <Button 
                          onClick={() => setIsRestockOpen(true)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Restock
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Use Part Form */}
                <AnimatePresence>
                  {isUsePartOpen && (
                    <motion.div 
                      className="p-6 rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h4 className="text-red-300 font-semibold mb-4 flex items-center gap-2">
                        <MinusCircle className="w-5 h-5" />
                        Use Part
                      </h4>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={useQuantity}
                          onChange={e => setUseQuantity(parseInt(e.target.value))}
                          min="1"
                          max={part.quantity}
                          className="w-24 bg-slate-700/50"
                          placeholder="Qty"
                        />
                        <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                          <SelectTrigger className="w-48 bg-slate-700/50">
                            <SelectValue placeholder="Select machine..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(machines || []).map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleUsePart} className="bg-red-600 hover:bg-red-700">
                          Confirm Use
                        </Button>
                        <Button variant="ghost" onClick={() => setIsUsePartOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Restock Form */}
                <AnimatePresence>
                  {isRestockOpen && (
                    <motion.div 
                      className="p-6 rounded-xl bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h4 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" />
                        Restock Part
                      </h4>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={restockQuantity}
                          onChange={e => setRestockQuantity(parseInt(e.target.value))}
                          min="1"
                          className="w-32 bg-slate-700/50"
                          placeholder="Quantity"
                        />
                        <span className="text-slate-300">items</span>
                        <Button onClick={handleRestockPart} className="bg-green-600 hover:bg-green-700">
                          Confirm Restock
                        </Button>
                        <Button variant="ghost" onClick={() => setIsRestockOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-6">
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">Analytics Coming Soon</h3>
                  <p className="text-slate-400">Advanced analytics and insights will be available here.</p>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {partMovements.length > 0 ? partMovements.map(m => (
                    <motion.div 
                      key={m.id} 
                      className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${m.type === 'IN' ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                            {m.type === 'IN' ? <PlusCircle className="w-4 h-4 text-green-400" /> : <MinusCircle className="w-4 h-4 text-red-400" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {m.description} <span className={`font-bold ${m.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                                ({m.type === 'IN' ? '+' : '-'}{m.quantity})
                              </span>
                            </p>
                            <p className="text-slate-400 text-sm">by {m.user_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-300 text-sm">{format(new Date(m.timestamp), "MMM d, yyyy 'at' HH:mm")}</p>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-300 mb-2">No History</h3>
                      <p className="text-slate-400">No movement history available for this part.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Premium Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-600/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50 mt-6">
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                Close
              </Button>
              {user.role === 'admin' && (
                <Button variant="outline" onClick={() => onEdit(part)} className="border-slate-500/50 hover:border-slate-400">
                  Edit Part
                </Button>
              )}
            </div>
            <Button 
              onClick={() => { onAddToCart(part); onClose(); }}
              disabled={part.quantity <= 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorldBestPartDetailModal;