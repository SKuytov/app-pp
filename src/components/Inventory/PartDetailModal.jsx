import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, DraftingCompass, FileText, MinusCircle, PlusCircle, ShoppingCart, Package, Building2, Calculator, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const [isUsePartOpen, setIsUsePartOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [useQuantity, setUseQuantity] = useState(1);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState('');

  // Calculate total inventory value
  const totalValue = useMemo(() => {
    return (part.quantity || 0) * (part.price || 0);
  }, [part.quantity, part.price]);

  // Calculate reorder level for weekly/monthly consumption
  const reorderLevel = useMemo(() => {
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const leadTimeWeeks = part.lead_time_weeks || 2; // Default 2 weeks
    const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
    
    // Use weekly if available, otherwise convert monthly to weekly
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33); // 4.33 weeks per month average
    
    return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
  }, [part.weekly_usage, part.monthly_usage, part.lead_time_weeks, part.safety_stock, part.min_stock]);

  // Determine if we need to reorder
  const needsReorder = part.quantity <= reorderLevel;

  const handleLinkClick = (url, feature) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast({ variant: "destructive", title: "Not Available", description: `This part does not have a ${feature} link.` });
  };
  
  const handleUsePart = async () => {
    if (useQuantity <= 0) {
      toast({ variant: "destructive", title: "Invalid Quantity", description: `Please enter a positive number.` });
      return;
    }
    if (useQuantity > part.quantity) {
      toast({ variant: "destructive", title: "Not enough stock", description: `You only have ${part.quantity} available.` });
      return;
    }
    const success = await recordPartUsage(part.id, useQuantity, selectedMachine || null);
    if(success) {
      toast({ title: "✅ Part Used", description: `${useQuantity} of ${part.name} has been deducted from stock.` });
      setIsUsePartOpen(false);
      setUseQuantity(1);
      setSelectedMachine('');
    } else {
      toast({ variant: "destructive", title: "Error", description: `Could not use part. Check stock levels.` });
    }
  };

  const handleRestockPart = async () => {
    if (restockQuantity <= 0) {
      toast({ variant: "destructive", title: "Invalid Quantity", description: `Please enter a positive number.` });
      return;
    }
    await restockPart(part.id, restockQuantity);
    toast({ title: "✅ Part Restocked", description: `${restockQuantity} of ${part.name} has been added to stock.` });
    setIsRestockOpen(false);
    setRestockQuantity(1);
  };
  
  const handleAddToCart = () => {
    if (part.quantity <= 0) {
      toast({ variant: "destructive", title: "Out of Stock", description: "This part cannot be added to the cart." });
      return;
    }
    onAddToCart(part);
    onClose();
  }

  const attachments = Array.isArray(part.attachments) ? part.attachments.filter(Boolean) : [];
  const partMovements = useMemo(() => (movements || []).filter(m => m.part_id === part.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [movements, part.id]);
  
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-800/95 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div>
            <h2 className="text-2xl font-bold text-white">{part.name}</h2>
            <p className="text-slate-300 mt-1">Part Details</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="movement-history">Movement History ({partMovements.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  {part.image_url ? 
                    <img src={part.image_url} alt={part.name} className="w-full h-64 object-cover rounded-lg" /> 
                    : 
                    <div className="w-full h-64 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Package className="w-16 h-16 text-slate-400" />
                      <span className="ml-2 text-slate-400">No Image</span>
                    </div>
                  }
                </div>

                <div className="lg:col-span-2 space-y-4">
                  {/* Enhanced Information Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Part Number</p>
                      <p className="text-white font-mono text-lg">{part.part_number}</p>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Supplier ID</p>
                      <p className="text-white font-mono text-lg flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        {part.supplier_id || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary">{part.main_group}</Badge>
                    <Badge variant="secondary">{part.sub_group}</Badge>
                    <Badge variant="outline">Crit: {part.criticality}</Badge>
                  </div>

                  {/* Enhanced Pricing Information */}
                  <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-blue-300 text-sm">Unit Price (per 1 pcs)</p>
                        <p className="text-white text-xl font-bold">{formatCurrency(part.price)}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-sm">Total Value ({part.quantity} pcs)</p>
                        <p className="text-green-400 text-xl font-bold flex items-center">
                          <Calculator className="w-5 h-5 mr-2" />
                          {formatCurrency(totalValue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Status */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                      <p className="text-slate-300 text-xs">Current Stock</p>
                      <p className="text-white text-lg font-bold">{part.quantity}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                      <p className="text-slate-300 text-xs">Min Stock</p>
                      <p className="text-white text-lg font-bold">{part.min_stock}</p>
                    </div>
                    <div className="bg-orange-900/30 p-3 rounded-lg text-center border border-orange-500/30">
                      <p className="text-orange-300 text-xs">Reorder Level</p>
                      <p className="text-orange-400 text-lg font-bold flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {reorderLevel}
                      </p>
                    </div>
                  </div>

                  {/* Consumption Pattern Display */}
                  <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
                    <p className="text-purple-300 text-sm mb-2">Consumption Pattern</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-purple-200">Weekly Usage:</span>
                        <span className="text-white font-semibold ml-2">{part.weekly_usage || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-purple-200">Monthly Usage:</span>
                        <span className="text-white font-semibold ml-2">{part.monthly_usage || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-purple-200">Lead Time:</span>
                        <span className="text-white font-semibold ml-2">{part.lead_time_weeks || 2} weeks</span>
                      </div>
                      <div>
                        <span className="text-purple-200">Safety Stock:</span>
                        <span className="text-white font-semibold ml-2">{part.safety_stock || 'Auto'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-slate-300 text-sm">Location</p>
                      <p className="text-white">{part.location}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-slate-300 text-sm">Supplier Name</p>
                      <p className="text-white">{part.supplier}</p>
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="space-y-2">
                    {part.quantity <= part.min_stock && (
                      <div className="bg-red-900/30 border border-red-500/50 p-3 rounded-lg flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                        <span className="text-red-300">Low Stock Alert</span>
                      </div>
                    )}
                    {needsReorder && (
                      <div className="bg-orange-900/30 border border-orange-500/50 p-3 rounded-lg flex items-center">
                        <TrendingUp className="w-5 h-5 text-orange-400 mr-2" />
                        <span className="text-orange-300">Reorder Required - Stock below reorder level</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assets & Files */}
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-3">Assets & Files</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkClick(part.cad_url, 'CAD file')}
                    className="text-slate-300 border-slate-600 hover:border-slate-400"
                  >
                    <DraftingCompass className="w-4 h-4 mr-2" />
                    CAD File
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-slate-300 text-sm font-medium mb-2">Attachments:</p>
                    {attachments.map((file, index) => (
                      <p key={index} className="text-slate-400 text-sm">{file.split('/').pop()}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {user.role === 'admin' && !isUsePartOpen && !isRestockOpen && (
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => setIsUsePartOpen(true)}>
                    <MinusCircle className="w-4 h-4 mr-2" />
                    Use Part
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setIsRestockOpen(true)}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Restock
                  </Button>
                </div>
              )}

              {/* Use Part Form */}
              {isUsePartOpen && (
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                  <h4 className="text-red-300 font-semibold mb-3">Use Part</h4>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={useQuantity}
                      onChange={e => setUseQuantity(parseInt(e.target.value))}
                      min="1"
                      max={part.quantity}
                      className="w-24 bg-slate-700"
                    />
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                      <SelectTrigger className="w-48 bg-slate-700">
                        <SelectValue placeholder="Select machine..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(machines || []).map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleUsePart} size="sm">Confirm Use</Button>
                    <Button variant="ghost" onClick={() => setIsUsePartOpen(false)} size="sm">Cancel</Button>
                  </div>
                </div>
              )}

              {/* Restock Form */}
              {isRestockOpen && (
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                  <h4 className="text-green-300 font-semibold mb-3">Restock Part</h4>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={restockQuantity}
                      onChange={e => setRestockQuantity(parseInt(e.target.value))}
                      min="1"
                      className="w-32 bg-slate-700"
                    />
                    <span className="text-slate-300">items</span>
                    <Button onClick={handleRestockPart} size="sm">Confirm Restock</Button>
                    <Button variant="ghost" onClick={() => setIsRestockOpen(false)} size="sm">Cancel</Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="movement-history" className="mt-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {partMovements.length > 0 ? partMovements.map(m => (
                  <div key={m.id} className="bg-slate-700/30 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${m.type === 'IN' ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                        {m.type === 'IN' ? <PlusCircle className="w-4 h-4 text-green-400" /> : <MinusCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-white">{m.description} <span className={`font-semibold ${m.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>({m.type === 'IN' ? '+' : '-'}{m.quantity})</span></p>
                        <p className="text-slate-400 text-sm">by {m.user_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-300 text-sm">{format(new Date(m.timestamp), "MMM d, yyyy 'at' hh:mm a")}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-400 text-center py-8">No movement history for this part.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-600 bg-slate-800/50">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            {user.role === 'admin' && (
              <Button variant="outline" onClick={() => onEdit(part)}>
                Edit
              </Button>
            )}
            <Button onClick={handleAddToCart} className="bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PartDetailModal;