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
import { usePartsPaginated } from '@/hooks/usePartsPaginated';

export default function InventoryTab({
  user,
  addToCart,
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
}) {
  const { toast } = useToast();

  // Pagination state
  const [activePage, setActivePage] = useState(1);

  // Fetch paginated parts
  const { data, isLoading, error } = usePartsPaginated(activePage, {
    searchTerm,
    mainGroup: selectedMainGroup
  });
  const parts = data?.parts || [];
  const total = data?.total_count || 0;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = apiHandlers;

  // Compute stats
  const { stats } = useMemo(() => {
    const totalParts = total;
    const lowStockCount = parts.filter(p => p.quantity <= (p.min_stock || 0)).length;
    const reorderCount = parts.filter(p => {
      const weekly = p.weekly_usage || 0;
      const monthly = p.monthly_usage || 0;
      const eff = weekly || monthly / 4.33;
      const level = eff > 0
        ? Math.ceil(eff * (p.lead_time_weeks || 2) + (p.safety_stock || Math.ceil((p.min_stock || 0) * 0.2)))
        : 0;
      return level > 0 && p.quantity <= level;
    }).length;
    return { stats: { totalParts, lowStockCount, reorderCount } };
  }, [parts, total]);

  // Handlers
  const handleEdit = useCallback(p => { setEditingPart(p); setIsFormOpen(true); }, []);
  const handleViewDetails = useCallback(p => setSelectedPart(p), []);
  const handleDeleteRequest = useCallback(p => setDeletingPart(p), []);
  const confirmDelete = useCallback(async () => {
    if (!deletingPart) return;
    try {
      await handleDeletePart(deletingPart.id);
      toast({ title: '✅ Deleted', description: `${deletingPart.name} removed.` });
    } catch {
      toast({ variant: 'destructive', title: '❌ Failed', description: 'Could not delete part.' });
    }
    setDeletingPart(null);
  }, [deletingPart, handleDeletePart, toast]);
  const handleFormSubmit = useCallback(async data => {
    try {
      const res = await handlePartSubmit(data);
      if (!res?.error) {
        setIsFormOpen(false);
        toast({ title: '✅ Saved', description: 'Part saved successfully.' });
      } else {
        toast({ variant: 'destructive', title: '❌ Failed', description: res.error });
      }
    } catch {
      toast({ variant: 'destructive', title: '❌ Error', description: 'Save failed.' });
    }
  }, [handlePartSubmit, toast]);
  const clearFilters = useCallback(() => {
    setSearchTerm(''); setSelectedMainGroup(''); setSelectedSubGroup('');
  }, [setSearchTerm, setSelectedMainGroup, setSelectedSubGroup]);

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Inventory</h2>
        <div className="space-x-4">
          <Badge> Total: {stats.totalParts} </Badge>
          {stats.lowStockCount > 0 && <Badge variant="warning">Low: {stats.lowStockCount}</Badge>}
          {stats.reorderCount > 0 && <Badge variant="destructive">Reorder: {stats.reorderCount}</Badge>}
        </div>
        <Button onClick={() => setIsFormOpen(true)}><Plus className="mr-1" />New Part</Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search parts..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedMainGroup}
          onChange={e => setSelectedMainGroup(e.target.value)}
          className="px-3"
        >
          <option value="">All Groups</option>
          {mainGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={selectedSubGroup}
          onChange={e => setSelectedSubGroup(e.target.value)}
          className="px-3"
        >
          <option value="">All Sub-Groups</option>
          {subGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        {(searchTerm || selectedMainGroup || selectedSubGroup) && (
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        )}
      </div>

      {/* Parts List */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {parts.map(p => (
            <PartCard
              key={p.id}
              part={p}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onAddToCart={addToCart}
              onViewDetails={handleViewDetails}
              user={user}
              machines={machines}
              movements={movements}
              recordPartUsage={recordPartUsage}
              restockPart={restockPart}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span>Page {activePage} of {Math.ceil(total / 50)}</span>
        <div className="space-x-2">
          <Button disabled={activePage === 1} onClick={() => setActivePage(p => p - 1)}>Previous</Button>
          <Button disabled={parts.length < 50} onClick={() => setActivePage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Modals */}
      {selectedPart && (
        <PartDetailModal
          isOpen={!!selectedPart}
          onClose={() => setSelectedPart(null)}
          part={selectedPart}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          machines={machines}
          recordPartUsage={recordPartUsage}
          restockPart={restockPart}
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
              This will permanently delete {deletingPart.name}.
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
}
