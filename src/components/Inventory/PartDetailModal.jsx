import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, DraftingCompass, FileText, MinusCircle, PlusCircle, ShoppingCart, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';

const PartDetailModal = ({ isOpen, onClose, part, onEdit, onDelete, user, movements, recordPartUsage, machines, restockPart, onAddToCart }) => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isUsePartOpen, setIsUsePartOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [useQuantity, setUseQuantity] = useState(1);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState('');

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">{part.name}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></Button>
        </div>
        <div className="flex-grow overflow-y-auto p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">Movement History <Badge className="ml-2">{partMovements.length}</Badge></TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
                    {part.image_url ? 
                        <img src={part.image_url} alt={part.name} className="w-full h-full object-cover" /> 
                      : 
                        <div className="w-full h-full flex items-center justify-center text-slate-500 flex-col">
                            <Package className="h-16 w-16"/>
                            <p>No Image</p>
                        </div>
                    }
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-2">{part.part_number}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-gray-700 text-gray-200">{part.main_group}</Badge>
                      <Badge className="bg-blue-900/50 text-blue-300">{part.sub_group}</Badge>
                      <Badge className="bg-purple-500/20 text-purple-300">Crit: {part.criticality}</Badge>
                      <Badge className="bg-green-500/20 text-green-300">{formatCurrency(part.price)}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Quantity:</span> <span className={`font-bold ${part.quantity <= part.min_stock ? 'text-red-400' : 'text-white'}`}>{part.quantity}</span></div>
                      <div className="flex justify-between"><span>Min Stock:</span> <span className="text-white">{part.min_stock}</span></div>
                      <div className="flex justify-between"><span>Location:</span> <span className="text-white">{part.location}</span></div>
                      <div className="flex justify-between"><span>Supplier:</span> <span className="text-white">{part.supplier}</span></div>
                    </div>
                    {part.quantity <= part.min_stock && <div className="flex items-center space-x-2 mt-4 p-2 bg-red-500/20 rounded-lg border border-red-500/30"><AlertTriangle className="h-4 w-4 text-red-400" /><span className="text-red-300 text-sm font-medium">Low Stock Alert</span></div>}
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-3">Assets & Files</h4>
                    <div className="flex space-x-2">
                        <Button className="flex-1" variant="outline" onClick={() => handleLinkClick(part.cad_url, 'CAD file')}><DraftingCompass className="mr-2 h-4 w-4"/> CAD File</Button>
                    </div>
                    {attachments.length > 0 && <div className="mt-3"><h5 className="text-sm font-semibold text-slate-300 mb-2">Attachments:</h5><div className="flex flex-col space-y-2">{attachments.map((file, index) => <a key={index} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm flex items-center"><FileText className="mr-2 h-4 w-4" />{file.split('/').pop()}</a>)}</div></div>}
                  </div>
                   {user.role === 'admin' && !isUsePartOpen && !isRestockOpen && (
                    <div className="flex gap-2">
                      <Button className="w-full" onClick={() => setIsUsePartOpen(true)}><MinusCircle className="mr-2 h-4 w-4" /> Use Part</Button>
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setIsRestockOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Restock</Button>
                    </div>
                   )}
                   {isUsePartOpen && (
                     <div className="p-4 bg-blue-900/20 rounded-lg space-y-3">
                       <h4 className="font-semibold text-white">Use Part</h4>
                       <div className="flex gap-2">
                         <Input type="number" value={useQuantity} onChange={(e) => setUseQuantity(parseInt(e.target.value))} min="1" max={part.quantity} className="w-24 bg-slate-700"/>
                         <Select onValueChange={setSelectedMachine} value={selectedMachine}><SelectTrigger><SelectValue placeholder="Assign to Machine (Optional)"/></SelectTrigger><SelectContent>{(machines || []).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
                       </div>
                       <div className="flex gap-2"><Button size="sm" onClick={handleUsePart}>Confirm Use</Button><Button size="sm" variant="ghost" onClick={() => setIsUsePartOpen(false)}>Cancel</Button></div>
                     </div>
                   )}
                   {isRestockOpen && (
                     <div className="p-4 bg-green-900/20 rounded-lg space-y-3">
                       <h4 className="font-semibold text-white">Restock Part</h4>
                       <div className="flex gap-2 items-center">
                         <Input type="number" value={restockQuantity} onChange={(e) => setRestockQuantity(parseInt(e.target.value))} min="1" className="w-32 bg-slate-700"/>
                         <span className="text-white">items</span>
                       </div>
                       <div className="flex gap-2"><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleRestockPart}>Confirm Restock</Button><Button size="sm" variant="ghost" onClick={() => setIsRestockOpen(false)}>Cancel</Button></div>
                     </div>
                   )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <div className="text-white space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {partMovements.length > 0 ? partMovements.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {m.type === 'IN' ? <PlusCircle className="h-5 w-5 text-green-400" /> : <MinusCircle className="h-5 w-5 text-red-400" />}
                      <div>
                        <p className="font-semibold">
                          {m.description}{' '}
                          <span className={`font-bold ${m.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                            ({m.type === 'IN' ? '+' : '-'}{m.quantity})
                          </span>
                        </p>
                        <p className="text-sm text-slate-400">by {m.user_name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{format(new Date(m.timestamp), "MMM d, yyyy 'at' hh:mm a")}</p>
                  </div>
                )) : <p className="text-center text-slate-400 py-8">No movement history for this part.</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-between items-center">
          <div>
            {user.role === 'admin' && (<div className="flex space-x-2"><Button variant="destructive" onClick={() => {onDelete(part.id); onClose();}}>Delete</Button><Button variant="secondary" onClick={() => {onEdit(part); onClose();}}>Edit</Button></div>)}
          </div>
          <Button onClick={handleAddToCart} disabled={part.quantity <= 0} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:from-gray-500 disabled:to-gray-600">
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PartDetailModal;