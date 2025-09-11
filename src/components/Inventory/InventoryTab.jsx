// components/InventoryTab.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Package, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import InventoryTab from './components/Inventory/InventoryTab';

// Optimized components
import FilterControls from './FilterControls';
import VirtualizedPartsList from './VirtualizedPartsList';
import LazyPartDetailModal from './LazyPartDetailModal';
import LazyPartForm from './LazyPartForm';

// Custom hooks
import { useInventoryData } from '../hooks/useInventoryData';

const VIRTUALIZED_LIST_HEIGHT = 600;

const InventoryTab = ({ 
  user, 
  addToCart, 
  parts = [], 
  machines = [], 
  apiHandlers, 
  movements = [] 
}) => {
  const { toast } = useToast();
  
  // Use optimized data management hook
  const {
    parts: filteredParts,
    allParts,
    stats,
    isLoading,
    searchTerm,
    selectedMainGroup,
    selectedSubGroup,
    mainGroups,
    subGroups,
    sortBy,
    sortOrder,
    activeTab,
    handleSearchChange,
    handleMainGroupChange,
    handleSubGroupChange,
    handleSortChange,
    handleTabChange,
    clearFilters,
    hasFilters,
    isEmpty,
    totalCount,
    filteredCount,
    updateParts
  } = useInventoryData(parts);

  // Modal and form states
  const [detailModalState, setDetailModalState] = useState({ isOpen: false, part: null });
  const [formState, setFormState] = useState({ isOpen: false, editingPart: null });
  const [deletingPart, setDeletingPart] = useState(null);

  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = apiHandlers;

  // Memoized event handlers for better performance
  const handleView = useCallback((part) => {
    setDetailModalState({ isOpen: true, part });
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalState({ isOpen: false, part: null });
  }, []);

  const handleEdit = useCallback((part) => {
    setFormState({ isOpen: true, editingPart: part });
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormState({ isOpen: false, editingPart: null });
  }, []);

  const handleDeleteRequest = useCallback((part) => {
    setDeletingPart(part);
  }, []);

  const handleAddToCart = useCallback((part) => {
    if (part.quantity > 0) {
      addToCart(part);
      toast({
        title: "✅ Added to Cart",
        description: `${part.name} has been added to your cart.`
      });
    }
  }, [addToCart, toast]);

  const confirmDelete = useCallback(async () => {
    if (deletingPart) {
      try {
        await handleDeletePart(deletingPart.id);
        toast({
          title: "✅ Part Deleted",
          description: `${deletingPart.name} has been removed.`
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "❌ Delete Failed",
          description: "Could not delete part."
        });
      }
      setDeletingPart(null);
    }
  }, [deletingPart, handleDeletePart, toast]);

  const handleFormSubmit = useCallback(async (partData) => {
    try {
      const result = await handlePartSubmit(partData);
      if (!result?.error) {
        handleCloseForm();
        toast({
          title: "✅ Part Saved",
          description: "Part has been saved successfully."
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Save Failed",
          description: result.error || "Could not save part."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Save Failed",
        description: "An error occurred while saving."
      });
    }
  }, [handlePartSubmit, handleCloseForm, toast]);

  // Memoized statistics display
  const StatsCards = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-slate-300">Total Parts</span>
        </div>
        <div className="text-2xl font-bold text-slate-100">{stats.totalParts.toLocaleString()}</div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-slate-300">Low Stock</span>
        </div>
        <div className="text-2xl font-bold text-red-400">{stats.lowStockCount.toLocaleString()}</div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-slate-300">Reorder</span>
        </div>
        <div className="text-2xl font-bold text-orange-400">{stats.reorderCount.toLocaleString()}</div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-300">Out of Stock</span>
        </div>
        <div className="text-2xl font-bold text-slate-400">{stats.outOfStockCount.toLocaleString()}</div>
      </div>
    </div>
  ), [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <div className="text-lg">Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Inventory Management</h2>
          <p className="text-slate-400">Manage your parts and stock levels efficiently</p>
        </div>
        
        {user?.role === 'admin' && (
          <Button
            onClick={() => setFormState({ isOpen: true, editingPart: null })}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </Button>
        )}
      </div>

      {/* Statistics */}
      {StatsCards}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md bg-slate-800/50">
          <TabsTrigger value="inventory">All Inventory</TabsTrigger>
          <TabsTrigger value="reorder" className="text-orange-400">
            Reorder ({stats.reorderCount})
          </TabsTrigger>
          <TabsTrigger value="lowstock" className="text-red-400">
            Low Stock ({stats.lowStockCount})
          </TabsTrigger>
          <TabsTrigger value="outofstock" className="text-slate-400">
            Out of Stock ({stats.outOfStockCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filter Controls */}
          <FilterControls
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            selectedMainGroup={selectedMainGroup}
            onMainGroupChange={handleMainGroupChange}
            selectedSubGroup={selectedSubGroup}
            onSubGroupChange={handleSubGroupChange}
            mainGroups={mainGroups}
            subGroups={subGroups}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onClearFilters={clearFilters}
            hasFilters={hasFilters}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />

          {/* Virtualized Parts List */}
          <VirtualizedPartsList
            parts={filteredParts}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onView={handleView}
            onAddToCart={handleAddToCart}
            user={user}
            containerHeight={VIRTUALIZED_LIST_HEIGHT}
          />

          {/* Empty State */}
          {isEmpty && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                {activeTab === 'reorder' ? 'All parts are adequately stocked' :
                 activeTab === 'lowstock' ? 'No low stock items' :
                 activeTab === 'outofstock' ? 'No out of stock items' :
                 hasFilters ? 'No parts match your filters' : 'No parts found'}
              </h3>
              <p className="text-slate-400 mb-4">
                {hasFilters ? 'Try adjusting your search or filters' : 'Add some parts to get started'}
              </p>
              {hasFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lazy-loaded Modals */}
      <LazyPartDetailModal
        isOpen={detailModalState.isOpen}
        onClose={handleCloseDetailModal}
        part={detailModalState.part}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        user={user}
        movements={movements}
        recordPartUsage={recordPartUsage}
        machines={machines}
        restockPart={restockPart}
        onAddToCart={handleAddToCart}
      />

      <LazyPartForm
        isOpen={formState.isOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        part={formState.editingPart}
        title={formState.editingPart ? 'Edit Part' : 'Add New Part'}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPart} onOpenChange={() => setDeletingPart(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPart?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryTab;