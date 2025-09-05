import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
import FilterControls from '@/components/Inventory/FilterControls';
import PartCard from '@/components/Inventory/PartCard';
import PartForm from '@/components/Inventory/PartForm';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const InventoryTab = ({ 
  user,
  addToCart,
  parts,
  filteredParts,
  searchTerm,
  setSearchTerm,
  selectedMainGroup,
  setSelectedMainGroup,
  selectedSubGroup,
  setSelectedSubGroup,
  mainGroups,
  subGroups,
  machines,
  apiHandlers,
  movements
}) => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);

  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = apiHandlers;

  const handleEdit = (part) => {
    setEditingPart(part);
    setIsFormOpen(true);
  };
  
  const handleDeleteRequest = (part) => {
    setDeletingPart(part);
  };

  const confirmDelete = async () => {
    if (deletingPart) {
      await handleDeletePart(deletingPart.id);
      setDeletingPart(null);
    }
  };

  const closeForm = () => {
    setEditingPart(null);
    setIsFormOpen(false);
  };
  
  const handleFormSubmit = async (partData) => {
    const result = await handlePartSubmit(partData);
    if (!result.error) {
      closeForm();
    }
  };

  return (
  <motion.div
    key="inventory"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-white">Inventory</h2>
       {user.role === 'admin' && (
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4" /> Add Part
        </button>
      )}
    </div>

    <FilterControls
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedMainGroup={selectedMainGroup}
      setSelectedMainGroup={setSelectedMainGroup}
      selectedSubGroup={selectedSubGroup}
      setSelectedSubGroup={setSelectedSubGroup}
      mainGroups={mainGroups || []}
      subGroups={subGroups || []}
    />
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {(filteredParts || []).map((part) => (
        <PartCard
          key={part.id}
          part={part}
          onEdit={handleEdit}
          onDelete={() => handleDeleteRequest(part)}
          user={user}
          movements={movements}
          recordPartUsage={recordPartUsage}
          machines={machines || []}
          restockPart={restockPart}
          onAddToCart={addToCart}
        />
      ))}
    </div>

    {(!filteredParts || filteredParts.length === 0) && (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No parts found</h3>
        <p className="text-gray-300">Try adjusting your search or filter criteria.</p>
      </div>
    )}
    
    {isFormOpen && (
      <PartForm 
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
        title={editingPart ? 'Edit Part' : 'Add New Part'}
        initialData={editingPart}
      />
    )}

    {deletingPart && (
      <AlertDialog open={!!deletingPart} onOpenChange={() => setDeletingPart(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the part "{deletingPart.name}" and all associated data, including any hotspots on drawings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
  </motion.div>
  );
};

export default InventoryTab;