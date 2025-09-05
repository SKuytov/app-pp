import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Plus, Search, AlertTriangle } from 'lucide-react';
import MachineCard from '@/components/Machines/MachineCard';
import MachineForm from '@/components/Machines/MachineForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FacilityManager from '@/components/Machines/FacilityManager';
import MachineDetailView from '@/components/Machines/MachineDetailView';
import { useToast } from '@/components/ui/use-toast';

const MachinesTab = ({ 
  user, warehouseState, apiHandlers, addToCart
}) => {
  const { machines, facilities, parts, movements, assemblies, hotspots } = warehouseState;
  const { handleMachineSubmit, handleDeleteMachine, handleFacilitySubmit, handleDeleteFacility, handleBomUpdate, recordPartUsage, restockPart } = apiHandlers;

  const [searchTerm, setSearchTerm] = useState('');
  const [globalPartSearchTerm, setGlobalPartSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFacilityManagerOpen, setIsFacilityManagerOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [deletingMachine, setDeletingMachine] = useState(null);
  const [viewingMachine, setViewingMachine] = useState(null);
  const [selectedPartFromSearch, setSelectedPartFromSearch] = useState(null);
  const { toast } = useToast();

  const filteredMachines = useMemo(() => {
    return (machines || []).filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [machines, searchTerm]);

  const globalPartSearchResults = useMemo(() => {
    if (!globalPartSearchTerm || globalPartSearchTerm.length < 2) return [];
    const term = globalPartSearchTerm.toLowerCase();
    const results = [];
    (hotspots || []).forEach(hotspot => {
      if (hotspot.part_id) {
        const part = (parts || []).find(p => p.id === hotspot.part_id);
        if (part && (part.name.toLowerCase().includes(term) || (part.part_number && part.part_number.toLowerCase().includes(term)))) {
          const assembly = (assemblies || []).find(a => a.id === hotspot.drawing_id);
          if (assembly) {
            const machine = (machines || []).find(m => m.id === assembly.machine_id);
            if (machine) {
              results.push({
                part,
                hotspot,
                assembly,
                machine,
              });
            }
          }
        }
      }
    });
    return results;
  }, [globalPartSearchTerm, parts, hotspots, assemblies, machines]);

  const openForm = (machine = null) => {
    setEditingMachine(machine);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingMachine(null);
    setIsFormOpen(false);
  };

  const openDetailView = (machine) => {
    setViewingMachine(machine);
    setIsDetailViewOpen(true);
  };

  const closeDetailView = () => {
    setViewingMachine(null);
    setIsDetailViewOpen(false);
    setSelectedPartFromSearch(null);
  };

  const handlePartSearchSelect = (result) => {
    setViewingMachine(result.machine);
    setSelectedPartFromSearch({
      assemblyId: result.assembly.id,
      hotspotId: result.hotspot.id,
    });
    setIsDetailViewOpen(true);
    setGlobalPartSearchTerm('');
  };

  const handleSubmit = async ({ machineData, assembliesData }) => {
    const isEditing = !!editingMachine;
    const { error } = await handleMachineSubmit({ machineData, assembliesData }, isEditing);
    if (!error) {
      closeForm();
    }
  };

  const handleDelete = (machine) => {
    setDeletingMachine(machine);
  };
  
  const confirmDelete = async () => {
    if (deletingMachine) {
        await handleDeleteMachine(deletingMachine.id);
        setDeletingMachine(null);
        toast({ title: "✅ Machine Deleted", description: `"${deletingMachine.name}" has been removed.` });
    }
  };

  const isAdmin = user.role === 'admin' || user.role === 'manager';

  const machineAssembliesForForm = useMemo(() => {
    if (!editingMachine) return [];
    return (assemblies || []).filter(asm => asm.machine_id === editingMachine.id);
  }, [editingMachine, assemblies]);

  return (
    <motion.div
      key="machines"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Machines</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setIsFacilityManagerOpen(true)} variant="outline">Manage Facilities</Button>
            <Button onClick={() => openForm()} className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Plus className="mr-2 h-4 w-4" /> Add Machine
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search machines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border-slate-700 pl-10"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search for a part in any machine..."
            value={globalPartSearchTerm}
            onChange={(e) => setGlobalPartSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border-slate-700 pl-10"
          />
          {globalPartSearchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto"
            >
              {globalPartSearchResults.map(({ part, hotspot, assembly, machine }, index) => (
                <div 
                  key={`${part.id}-${hotspot.id}-${index}`}
                  onClick={() => handlePartSearchSelect({ part, hotspot, assembly, machine })}
                  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50"
                >
                  <p className="font-semibold text-white">{part.name} <span className="text-xs text-slate-400">({part.part_number})</span></p>
                  <p className="text-sm text-slate-300">Machine: {machine.name}</p>
                  <p className="text-xs text-slate-400">Assembly: {assembly.name}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredMachines.map(machine => {
            const maintenanceCost = (movements || [])
              .filter(m => m.machine_id === machine.id && m.type === 'OUT')
              .reduce((acc, movement) => {
                const part = (parts || []).find(p => p.id === movement.part_id);
                return acc + ((part?.price || 0) * movement.quantity);
              }, 0);

            return (
              <MachineCard
                key={machine.id}
                machine={machine}
                maintenanceCost={maintenanceCost}
                user={user}
                onEdit={() => openForm(machine)}
                onDelete={() => handleDelete(machine)}
                onViewDetails={() => openDetailView(machine)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {filteredMachines.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Bot className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No machines found</h3>
          <p className="text-slate-400">Add a new machine or refine your search.</p>
        </div>
      )}

      {isFormOpen && (
          <MachineForm
            onSubmit={handleSubmit}
            onCancel={closeForm}
            initialData={editingMachine}
            facilities={facilities}
            initialAssemblies={machineAssembliesForForm}
          />
      )}
      
      <Dialog open={isFacilityManagerOpen} onOpenChange={setIsFacilityManagerOpen}>
        {isFacilityManagerOpen && (
          <FacilityManager
            facilities={facilities}
            onClose={() => setIsFacilityManagerOpen(false)}
            onSubmit={handleFacilitySubmit}
            onDelete={handleDeleteFacility}
          />
        )}
      </Dialog>

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        {isDetailViewOpen && viewingMachine && (
            <MachineDetailView
                machine={viewingMachine}
                parts={parts}
                assemblies={(assemblies || []).filter(a => a.machine_id === viewingMachine.id)}
                hotspots={hotspots}
                user={user}
                addToCart={addToCart}
                onBomUpdate={handleBomUpdate}
                onClose={closeDetailView}
                movements={movements}
                recordPartUsage={(partId, qty) => recordPartUsage(partId, qty, viewingMachine.id)}
                restockPart={(partId, qty) => restockPart(partId, qty)}
                initialPartSelection={selectedPartFromSearch}
            />
        )}
      </Dialog>

      <Dialog open={!!deletingMachine} onOpenChange={() => setDeletingMachine(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
            <div className="p-6">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
                    <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                    <p className="text-sm text-slate-400 mt-2">
                        Are you sure you want to delete the machine "{deletingMachine?.name}"? This action cannot be undone.
                    </p>
                </div>
            </div>
            <div className="bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                <Button variant="outline" className="mr-2" onClick={() => setDeletingMachine(null)}>Cancel</Button>
            </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default MachinesTab;