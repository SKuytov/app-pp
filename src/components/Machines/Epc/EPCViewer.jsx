import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, DraftingCompass, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PartDetailModal from '@/components/Inventory/PartDetailModal';
import AssemblyTreeView from '@/components/Machines/Epc/AssemblyTreeView';
import DrawingViewer from '@/components/Machines/Epc/DrawingViewer';
import BomPanel from '@/components/Machines/Epc/BomPanel';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const AddPartToBomModal = ({ allParts, currentBomPartIds, onAdd }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const availableParts = useMemo(() => {
        return allParts
            .filter(p => !currentBomPartIds.includes(p.id))
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.part_number && p.part_number.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [allParts, currentBomPartIds, searchTerm]);

    return (
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
                <DialogTitle>Add Part to Bill of Materials</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <Input 
                    placeholder="Search parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                />
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {availableParts.map(part => (
                        <div key={part.id} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md">
                            <div>
                                <p className="font-semibold">{part.name}</p>
                                <p className="text-sm text-slate-400">{part.part_number}</p>
                            </div>
                            <Button size="sm" onClick={() => onAdd(part.id)}>Add</Button>
                        </div>
                    ))}
                </div>
            </div>
        </DialogContent>
    );
};

const EPCViewer = ({ machine, parts, assemblies, hotspots, onBomUpdate, addToCart, user, movements, recordPartUsage, restockPart, initialPartSelection }) => {
    const [currentAssemblyId, setCurrentAssemblyId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItemToPlace, setSelectedItemToPlace] = useState(null);
    const [hoveredHotspotId, setHoveredHotspotId] = useState(null);
    const [selectedHotspotId, setSelectedHotspotId] = useState(null);
    const [activePopoverId, setActivePopoverId] = useState(null);
    const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
    const [viewingPartDetail, setViewingPartDetail] = useState(null);
    const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
    const [zoomToHotspot, setZoomToHotspot] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        if (initialPartSelection) {
            setCurrentAssemblyId(initialPartSelection.assemblyId);
            setSelectedHotspotId(initialPartSelection.hotspotId);
            setTimeout(() => setZoomToHotspot(initialPartSelection.hotspotId), 100);
        } else if (!currentAssemblyId) {
            const rootAssembly = assemblies.find(a => a.machine_id === machine.id && !a.parent_assembly_id);
            if (rootAssembly) {
                setCurrentAssemblyId(rootAssembly.id);
            }
        }
    }, [machine.id, assemblies, initialPartSelection, currentAssemblyId]);

    const currentAssembly = useMemo(() => assemblies.find(a => a.id === currentAssemblyId), [currentAssemblyId, assemblies]);

    const assemblyHotspots = useMemo(() => hotspots.filter(h => h.drawing_id === currentAssemblyId), [currentAssemblyId, hotspots]);

    const bom = useMemo(() => {
        if (!currentAssemblyId) return [];
        return assemblyHotspots.map(h => {
            if (h.part_id) {
                const details = parts.find(p => p.id === h.part_id);
                return details ? { ...h, type: 'part', details } : null;
            }
            if (h.sub_assembly_id) {
                const details = assemblies.find(a => a.id === h.sub_assembly_id);
                return details ? { ...h, type: 'sub-assembly', details } : null;
            }
            return null;
        }).filter(Boolean).sort((a, b) => (a.item_number || '').localeCompare(b.item_number || ''));
    }, [currentAssemblyId, assemblyHotspots, parts, assemblies]);

    const handleHotspotClick = (e, hotspot) => {
        e.stopPropagation();
        if (isEditMode) {
             if (hotspot.part_id) {
                setSelectedItemToPlace({ type: 'part', id: hotspot.part_id, hotspotId: hotspot.id, item_number: hotspot.item_number });
            } else if (hotspot.sub_assembly_id) {
                setSelectedItemToPlace({ type: 'sub-assembly', id: hotspot.sub_assembly_id, hotspotId: hotspot.id, item_number: hotspot.item_number });
            }
            return;
        }
        if (hotspot.sub_assembly_id) {
            setCurrentAssemblyId(hotspot.sub_assembly_id);
            setSelectedHotspotId(null);
        } else {
            setSelectedHotspotId(hotspot.id);
            setActivePopoverId(activePopoverId === hotspot.id ? null : hotspot.id);
        }
    };
    
    const handleAssemblySelect = (assemblyId) => {
        setCurrentAssemblyId(assemblyId);
        setSelectedHotspotId(null);
        setActivePopoverId(null);
    }

    const handleSaveHotspot = async (hotspotData) => {
        await onBomUpdate(hotspotData);
        setSelectedItemToPlace(null);
    };
    
    const handleImageClick = (x_position, y_position) => {
        if (!isEditMode || !selectedItemToPlace) return;
    
        const hotspotData = {
            id: selectedItemToPlace.hotspotId,
            drawing_id: currentAssemblyId,
            part_id: selectedItemToPlace.type === 'part' ? selectedItemToPlace.id : null,
            sub_assembly_id: selectedItemToPlace.type === 'sub-assembly' ? selectedItemToPlace.id : null,
            x_position,
            y_position,
            item_number: selectedItemToPlace.item_number,
        };
        handleSaveHotspot(hotspotData);
    };

    const handleRemoveHotspot = async (hotspotId) => {
        const { error } = await onBomUpdate({ id: hotspotId, _delete: true });
        if (!error) {
            toast({ title: "Item Removed", description: "The item has been removed from the BOM." });
        } else {
            toast({ variant: "destructive", title: "Error", description: `Failed to remove item: ${error.message}` });
        }
    };

    const handleAddPartToBom = async (partId) => {
        const itemNumber = prompt("Enter item number for this part:");
        if (itemNumber) {
            const hotspotData = {
                drawing_id: currentAssemblyId,
                part_id: partId,
                item_number: itemNumber,
                x_position: -1, 
                y_position: -1,
            };
            const result = await onBomUpdate(hotspotData);
            if (result && result.data) {
                const newHotspot = result.data[0];
                setSelectedItemToPlace({
                    type: 'part',
                    id: newHotspot.part_id,
                    hotspotId: newHotspot.id,
                    item_number: newHotspot.item_number
                });
                setIsEditMode(true);
                toast({ title: "Part Added, Place it now", description: "Click on the drawing to place the new part." });
            } else {
                 toast({ variant: "destructive", title: "Error", description: `Failed to add item.` });
            }
        }
    };

    const handleItemClick = (item) => {
        setZoomToHotspot(null);
        if (isEditMode) {
            setSelectedItemToPlace({ type: item.type, id: item.details.id, hotspotId: item.id, item_number: item.item_number });
        } else if (item.type === 'sub-assembly') {
            setCurrentAssemblyId(item.details.id);
            setSelectedHotspotId(null);
        } else {
            setSelectedHotspotId(item.id);
            if (item.x_position >= 0) {
              setTimeout(() => setZoomToHotspot(item.id), 50);
            }
        }
    }

    const handleHotspotHover = (hotspotId) => {
        if (!isEditMode) {
            setHoveredHotspotId(hotspotId);
        }
    };
    
    if (!assemblies || assemblies.length === 0) {
        return <div className="text-center text-slate-400 p-8">No assemblies found for this machine. Please add one in the machine settings.</div>;
    }

    if (!currentAssembly) {
        return <div className="text-center text-slate-400 p-8">Loading assembly...</div>;
    }

    return (
        <Dialog open={isAddPartModalOpen} onOpenChange={setIsAddPartModalOpen}>
            <Card className="bg-white/5 border-white/10 h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl text-white"><DraftingCompass /> Electronic Parts Catalogue</CardTitle>
                            <p className="text-sm text-slate-400">Machine: {machine.name}</p>
                        </div>
                         {user.role === 'admin' && (
                            <Button size="sm" onClick={() => setIsEditMode(!isEditMode)} variant={isEditMode ? "destructive" : "default"}>
                                {isEditMode ? <><X className="h-4 w-4 mr-2"/> Exit Edit</> : <><Edit className="h-4 w-4 mr-2" /> Edit Hotspots</>}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex gap-2 overflow-hidden">
                    <AnimatePresence>
                    {!isTreeCollapsed && (
                        <motion.div
                            initial={{ width: 0, opacity: 0, marginRight: 0 }}
                            animate={{ width: 288, opacity: 1, marginRight: 8 }}
                            exit={{ width: 0, opacity: 0, marginRight: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0 bg-slate-900/50 rounded-lg p-3 flex flex-col"
                        >
                            <h3 className="text-lg font-semibold text-white mb-2">Assemblies</h3>
                            <AssemblyTreeView 
                                assemblies={assemblies}
                                onAssemblySelect={handleAssemblySelect}
                                currentAssemblyId={currentAssemblyId}
                            />
                        </motion.div>
                    )}
                    </AnimatePresence>
                    
                    <div className="flex-grow flex items-stretch gap-4 overflow-hidden">
                         <div className="flex-shrink-0 flex items-center justify-center bg-slate-900/30 rounded-lg">
                            <Button variant="ghost" size="sm" onClick={() => setIsTreeCollapsed(!isTreeCollapsed)} className="h-full">
                                {isTreeCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                            </Button>
                        </div>
                        <DrawingViewer
                            currentAssembly={currentAssembly}
                            assemblyHotspots={assemblyHotspots}
                            isEditMode={isEditMode}
                            selectedItemToPlace={selectedItemToPlace}
                            onImageClick={handleImageClick}
                            onHotspotClick={handleHotspotClick}
                            onHotspotHover={handleHotspotHover}
                            hoveredHotspotId={hoveredHotspotId}
                            selectedHotspotId={selectedHotspotId}
                            parts={parts}
                            onAddToCart={addToCart}
                            onClosePopover={() => setActivePopoverId(null)}
                            activePopoverId={activePopoverId}
                            zoomToHotspot={zoomToHotspot}
                        />
                        <BomPanel
                            currentAssembly={currentAssembly}
                            bom={bom}
                            isEditMode={isEditMode}
                            onItemClick={handleItemClick}
                            onItemInfoClick={(part) => setViewingPartDetail(part)}
                            onRemoveHotspot={handleRemoveHotspot}
                            onAddPartClick={() => setIsAddPartModalOpen(true)}
                            selectedHotspotId={selectedHotspotId}
                            selectedItemToPlace={selectedItemToPlace}
                            onItemHover={handleHotspotHover}
                        />
                    </div>
                </CardContent>
            </Card>
            {isAddPartModalOpen && (
                <AddPartToBomModal 
                    allParts={parts}
                    currentBomPartIds={bom.filter(item => item.type === 'part').map(item => item.details.id)}
                    onAdd={(partId) => {
                        handleAddPartToBom(partId);
                        setIsAddPartModalOpen(false);
                    }}
                />
            )}
            {viewingPartDetail && (
                <PartDetailModal
                    isOpen={!!viewingPartDetail}
                    onClose={() => setViewingPartDetail(null)}
                    part={viewingPartDetail}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    user={user}
                    movements={movements.filter(m => m.part_id === viewingPartDetail.id)}
                    recordPartUsage={(partId, qty, machineId) => recordPartUsage(partId, qty, machineId, user, [machine])}
                    machines={[machine]}
                    restockPart={(partId, qty) => restockPart(partId, qty, user)}
                    onAddToCart={addToCart}
                />
            )}
        </Dialog>
    );
};

export default EPCViewer;