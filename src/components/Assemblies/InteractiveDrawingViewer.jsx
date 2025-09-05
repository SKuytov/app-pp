import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Plus, AlertCircle, CheckCircle, ZoomIn, ZoomOut, RefreshCw, Edit, Save, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';

const PartPopover = ({ part, onQuickOrder, user, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const { formatCurrency } = useCurrency();

  const handleOrder = () => {
    onQuickOrder({
      partId: part.id,
      partName: part.name,
      quantity: parseInt(quantity),
      priority: 'Normal',
      plant: user.plant,
    });
    onClose();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute z-20 w-72"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}
    >
      <Card className="bg-slate-800 border-slate-700 text-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium truncate">{part.name}</CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">{part.partNumber}</p>
          <div className="flex justify-between text-sm">
            <span>In Stock:</span>
            <span className={part.quantity > part.minStock ? 'text-green-400' : 'text-red-400'}>
              {part.quantity}
            </span>
          </div>
           <div className="flex justify-between text-sm">
            <span>Price:</span>
            <span>{formatCurrency(part.price)}</span>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Input 
              type="number" 
              className="w-20 bg-slate-700 border-slate-600"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
            <Button size="sm" className="flex-1" onClick={handleOrder} disabled={quantity < 1}>
              <Plus className="h-4 w-4 mr-1"/> Add to Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};


const InteractiveDrawingViewer = ({ assembly, partsList, onClose, user, onQuickOrder, onUpdateAssembly }) => {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAssembly, setCurrentAssembly] = useState(assembly);
  const [selectedPartToPlace, setSelectedPartToPlace] = useState(null);
  const imageRef = useRef(null);
  const { toast } = useToast();

  const assemblyParts = currentAssembly.parts
    .map(asmPart => ({
      ...asmPart,
      details: partsList.find(p => p.partNumber === asmPart.partNumber),
    }))
    .filter(p => p.details);

  const handleHotspotClick = (itemNumber) => {
    if (isEditMode) return;
    setActiveHotspot(activeHotspot === itemNumber ? null : itemNumber);
  };

  const handleImageClick = (e) => {
    if (!isEditMode || !selectedPartToPlace) return;
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const updatedParts = currentAssembly.parts.map(p => 
      p.itemNumber === selectedPartToPlace 
        ? { ...p, position: { x: `${xPercent}%`, y: `${yPercent}%` } }
        : p
    );

    setCurrentAssembly(prev => ({ ...prev, parts: updatedParts }));
    setSelectedPartToPlace(null);
  };

  const handleSave = () => {
    onUpdateAssembly(currentAssembly.id, currentAssembly);
    setIsEditMode(false);
    toast({ title: "✅ Assembly Updated", description: "Hotspot positions have been saved." });
  };

  const unassignedParts = currentAssembly.parts.filter(p => !p.position);
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-white/20 w-full max-w-7xl h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">{assembly.name}</h2>
          <div className="flex items-center gap-2">
            {user.role === 'manager' && (
              isEditMode ? (
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
              ) : (
                <Button onClick={() => setIsEditMode(true)}><Edit className="mr-2 h-4 w-4" /> Edit Hotspots</Button>
              )
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        <div className="flex-grow flex p-4 gap-4 min-h-0">
          <div className="w-3/4 bg-slate-900 rounded-lg p-2 relative overflow-auto">
            <TransformWrapper>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute top-2 left-2 z-10 flex gap-1">
                    <Button size="icon" variant="secondary" onClick={() => zoomIn()}><ZoomIn/></Button>
                    <Button size="icon" variant="secondary" onClick={() => zoomOut()}><ZoomOut/></Button>
                    <Button size="icon" variant="secondary" onClick={() => resetTransform()}><RefreshCw/></Button>
                  </div>
                  <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                    <div className={`relative w-full h-full ${isEditMode ? 'cursor-crosshair' : ''}`} onClick={handleImageClick}>
                      <img ref={imageRef} src={currentAssembly.drawingUrl} alt={currentAssembly.name} className="max-w-full max-h-full object-contain m-auto"/>
                      {assemblyParts.filter(p => p.position).map((part) => (
                        <div 
                          key={part.itemNumber}
                          className="absolute"
                          style={{ top: part.position.y, left: part.position.x, transform: 'translate(-50%, -50%)' }}
                        >
                          <motion.button 
                            whileHover={{ scale: isEditMode ? 1 : 1.5 }}
                            onClick={() => handleHotspotClick(part.itemNumber)}
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                              ${activeHotspot === part.itemNumber ? 'bg-blue-500 border-white text-white scale-150' : 'bg-blue-500/50 border-blue-400 text-blue-200'}
                              ${isEditMode ? 'pointer-events-none' : ''}`}
                          >
                            {part.itemNumber}
                          </motion.button>
                          <AnimatePresence>
                          {activeHotspot === part.itemNumber && (
                            <PartPopover part={part.details} onQuickOrder={onQuickOrder} user={user} onClose={() => setActiveHotspot(null)} />
                          )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
          
          <div className="w-1/4 bg-slate-800/50 rounded-lg overflow-y-auto">
            <h3 className="text-lg font-semibold text-white p-4 sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10">Bill of Materials</h3>
            {isEditMode && (
              <div className="p-3 bg-blue-900/30 text-blue-200 text-sm">
                <p className="font-bold flex items-center"><MousePointerClick className="h-4 w-4 mr-2" /> Edit Mode Active</p>
                {selectedPartToPlace 
                  ? <p>Click on the drawing to place item <Badge>{selectedPartToPlace}</Badge>.</p>
                  : <p>Select an unassigned part below to place its hotspot.</p>
                }
              </div>
            )}
            <ul className="divide-y divide-slate-700">
              {assemblyParts.map(part => (
                <li 
                  key={part.itemNumber}
                  onClick={() => isEditMode ? setSelectedPartToPlace(part.itemNumber) : handleHotspotClick(part.itemNumber)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors 
                    ${activeHotspot === part.itemNumber && !isEditMode ? 'bg-blue-500/20' : ''}
                    ${isEditMode && !part.position ? 'hover:bg-blue-500/20' : ''}
                    ${selectedPartToPlace === part.itemNumber ? 'bg-blue-500/30' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Badge className="text-sm">{part.itemNumber}</Badge>
                    <div>
                      <p className="font-medium text-white">{part.details.name}</p>
                      <p className="text-xs text-slate-400">{part.details.partNumber}</p>
                    </div>
                  </div>
                  {part.position ? <CheckCircle className="h-5 w-5 text-green-500" title="Positioned"/> : <AlertCircle className="h-5 w-5 text-yellow-500" title="Not Positioned"/>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
};

export default InteractiveDrawingViewer;