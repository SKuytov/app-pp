import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Filter, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PartCard from '@/components/Inventory/PartCard';
import PartForm from '@/components/Inventory/PartForm';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Lightweight component for 10,000+ parts
const InventoryTab = ({
  user,
  addToCart,
  parts = [],
  filteredParts = [],
  searchTerm,
  setSearchTerm,
  selectedMainGroup,
  setSelectedMainGroup,
  selectedSubGroup,
  setSelectedSubGroup,
  mainGroups = [],
  subGroups = [],
  machines,
  apiHandlers,
  movements
}) => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');

  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = apiHandlers;

  // Memoized calculations for performance
  const stats = useMemo(() => {
    const totalParts = parts.length;
    const lowStockCount = parts.filter(part => part.quantity <= part.min_stock).length;
    const reorderCount = parts.filter(part => part.quantity <= (part.reorder_level || 0)).length;
    
    return { totalParts, lowStockCount, reorderCount };
  }, [parts]);

  // Optimized filtered parts for current tab
  const displayParts = useMemo(() => {
    if (activeTab === 'reorder') {
      return filteredParts.filter(part => part.quantity <= (part.reorder_level || 0));
    }
    return filteredParts;
  }, [filteredParts, activeTab]);

  // Event handlers
  const handleEdit = useCallback((part) => {
    setEditingPart(part);
    setIsFormOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((part) => {
    setDeletingPart(part);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deletingPart) {
      await handleDeletePart(deletingPart.id);
      setDeletingPart(null);
    }
  }, [deletingPart, handleDeletePart]);

  const closeForm = useCallback(() => {
    setEditingPart(null);
    setIsFormOpen(false);
  }, []);

  const handleFormSubmit = useCallback(async (partData) => {
    const result = await handlePartSubmit(partData);
    if (!result.error) {
      closeForm();
    }
  }, [handlePartSubmit, closeForm]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedMainGroup('');
    setSelectedSubGroup('');
  }, [setSearchTerm, setSelectedMainGroup, setSelectedSubGroup]);

  return (
    <div className="space-y-4">
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
            <span>Total: {stats.totalParts}</span>
            {stats.lowStockCount > 0 && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Low Stock: {stats.lowStockCount}
              </span>
            )}
            {stats.reorderCount > 0 && (
              <span className="text-orange-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Reorder: {stats.reorderCount}
              </span>
            )}
          </div>
        </div>
        {user.role === 'admin' && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Part
          </Button>
        )}
      </div>

      {/* Compact Controls */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 h-9"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={selectedMainGroup}
            onChange={(e) => setSelectedMainGroup(e.target.value)}
            className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9"
          >
            <option value="">All Groups</option>
            {mainGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <select
            value={selectedSubGroup}
            onChange={(e) => setSelectedSubGroup(e.target.value)}
            className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9"
          >
            <option value="">All Sub-Groups</option>
            {subGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          {(searchTerm || selectedMainGroup || selectedSubGroup) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Compact Tabs */}
      <div className="flex border-b border-slate-600">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Inventory ({displayParts.length})
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'reorder'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          Reorder ({stats.reorderCount})
          {stats.reorderCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats.reorderCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Optimized Parts Grid */}
      <div className="mt-4">
        {displayParts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {displayParts.map((part) => (
              <PartCard
                key={part.id}
                part={part}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                user={user}
                movements={movements}
                recordPartUsage={recordPartUsage}
                machines={machines || []}
                restockPart={restockPart}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300 mb-1">No parts found</h3>
            <p className="text-slate-400 text-sm">
              {activeTab === 'reorder' 
                ? 'No parts need reordering at this time'
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <PartForm
          title={editingPart ? 'Edit Part' : 'Add New Part'}
          initialData={editingPart}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
      )}

      {/* Delete Confirmation */}
      {deletingPart && (
        <AlertDialog open={!!deletingPart} onOpenChange={() => setDeletingPart(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Part?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deletingPart.name}" and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default InventoryTab;