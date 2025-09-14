import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PartCard from './PartCard';
import PartDetailModal from './PartDetailModal';
import PartForm from '@/components/Inventory/PartForm';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// 🏆 WORLD-CLASS INVENTORY TAB - Production-ready without virtualization
const WorldClassInventoryTab = ({
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
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = apiHandlers;

  // Pre-compute parts and stats
  const { stats, displayParts } = useMemo(() => {
    const baseParts = parts || [];

    // Calculate reorder levels
    const partsWithReorderLevels = baseParts.map((part) => {
      const weeklyUsage = part.weekly_usage || 0;
      const monthlyUsage = part.monthly_usage || 0;
      const effectiveWeeklyUsage = weeklyUsage || monthlyUsage / 4.33;
      const reorderLevel =
        effectiveWeeklyUsage > 0
          ? Math.ceil(
              effectiveWeeklyUsage * (part.lead_time_weeks || 2) +
                (part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2))
            )
          : 0;
      return { ...part, calculatedReorderLevel: reorderLevel };
    });

    // Stats
    const totalParts = partsWithReorderLevels.length;
    const lowStockCount = partsWithReorderLevels.filter(
      (p) => p.quantity <= (p.min_stock || 0)
    ).length;
    const reorderCount = partsWithReorderLevels.filter(
      (p) => p.calculatedReorderLevel > 0 && p.quantity <= p.calculatedReorderLevel
    ).length;

    // Determine which list to show
    let list = filteredParts.length >= 0 ? filteredParts : partsWithReorderLevels;
    if (activeTab === 'reorder') {
      list = list.filter((p) => {
        const level = p.calculatedReorderLevel || 0;
        return level > 0 && p.quantity <= level;
      });
    }

    return {
      stats: { totalParts, lowStockCount, reorderCount },
      displayParts: viewMode === 'grid' ? list.slice(0, 1000) : list
    };
  }, [parts, filteredParts, activeTab, viewMode]);

  // Handlers
  const handleEdit = useCallback((part) => {
    setEditingPart(part);
    setIsFormOpen(true);
  }, []);

  const handleViewDetails = useCallback((part) => {
    setSelectedPart(part);
  }, []);

  const handleDeleteRequest = useCallback((part) => {
    setDeletingPart(part);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingPart) return;
    try {
      await handleDeletePart(deletingPart.id);
      toast({ title: '✅ Deleted', description: `${deletingPart.name} removed.` });
    } catch {
      toast({
        variant: 'destructive',
        title: '❌ Failed',
        description: 'Could not delete part.'
      });
    }
    setDeletingPart(null);
  }, [deletingPart, handleDeletePart, toast]);

  const handleFormSubmit = useCallback(
    async (partData) => {
      try {
        const result = await handlePartSubmit(partData);
        if (!result?.error) {
          setIsFormOpen(false);
          toast({ title: '✅ Saved', description: 'Part saved successfully.' });
        } else {
          toast({ variant: 'destructive', title: '❌ Failed', description: result.error });
        }
      } catch {
        toast({ variant: 'destructive', title: '❌ Error', description: 'Save failed.' });
      }
    },
    [handlePartSubmit, toast]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedMainGroup('');
    setSelectedSubGroup('');
  }, [setSearchTerm, setSelectedMainGroup, setSelectedSubGroup]);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Inventory</h2>
        <div className="flex space-x-4">
          <Badge color="blue">Total: {stats.totalParts}</Badge>
          {stats.lowStockCount > 0 && <Badge color="yellow">Low: {stats.lowStockCount}</Badge>}
          {stats.reorderCount > 0 && <Badge color="red">Reorder: {stats.reorderCount}</Badge>}
        </div>
        <Button onClick={() => setIsFormOpen(true)}><Plus className="mr-2" />New Part</Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search parts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <select
          value={selectedMainGroup}
          onChange={(e) => setSelectedMainGroup(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white px-3"
        >
          <option value="">All Groups</option>
          {mainGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={selectedSubGroup}
          onChange={(e) => setSelectedSubGroup(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white px-3"
        >
          <option value="">All Sub-Groups</option>
          {subGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        {(searchTerm || selectedMainGroup || selectedSubGroup) && (
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        )}
      </div>

      {/* Parts List */}
      {displayParts.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
          {displayParts.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              onEdit={() => handleEdit(part)}
              onDelete={() => handleDeleteRequest(part)}
              onViewDetails={() => handleViewDetails(part)}
              onAddToCart={() => addToCart(part, 1)}
              user={user}
              machines={machines}
              movements={movements}
              recordPartUsage={recordPartUsage}
              restockPart={restockPart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 mt-10">
          <h3 className="text-xl mb-2">
            {activeTab === 'reorder' ? 'No Reorders Needed' : 'No Parts Found'}
          </h3>
          <p>
            {activeTab === 'reorder'
              ? 'All parts are adequately stocked'
              : (searchTerm || selectedMainGroup || selectedSubGroup)
              ? 'Try adjusting your filters'
              : 'Add parts to get started'}
          </p>
        </div>
      )}

      {/* Modals */}
      {selectedPart && (
        <PartDetailModal
          part={selectedPart}
          onClose={() => setSelectedPart(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          user={user}
        />
      )}
      {isFormOpen && (
        <PartForm
          part={editingPart}
          onClose={() => { setEditingPart(null); setIsFormOpen(false); }}
          onSubmit={handleFormSubmit}
        />
      )}
      {deletingPart && (
        <AlertDialog open onOpenChange={() => setDeletingPart(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Part?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingPart.name}</strong> and cannot be undone.
            </AlertDialogDescription>
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

export default WorldClassInventoryTab;
