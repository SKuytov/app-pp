import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import OptimizedPartCard from './OptimizedPartCard';
import PartForm from '@/components/Inventory/PartForm';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// 🚀 PERFORMANCE: Extract calculation to avoid recreating
const calculateReorderLevel = (part) => {
  const weeklyUsage = part.weekly_usage || 0;
  const monthlyUsage = part.monthly_usage || 0;
  const leadTimeWeeks = part.lead_time_weeks || 2;
  const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
  const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
  
  if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
    return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
  }
  return part.reorder_level || 0;
};

// 🚀 ULTRA-OPTIMIZED: Lightweight InventoryTab for maximum performance
const UltraOptimizedInventoryTab = ({
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

  // 🚀 ULTRA-OPTIMIZED: Pre-compute all stats once
  const computedData = useMemo(() => {
    const baseParts = parts || [];
    const totalParts = baseParts.length;
    const lowStockCount = baseParts.filter(part => part.quantity <= (part.min_stock || 0)).length;
    
    // Pre-calculate reorder levels for all parts
    const reorderCount = baseParts.filter(part => {
      const reorderLevel = calculateReorderLevel(part);
      return part.quantity <= reorderLevel;
    }).length;

    // Determine display parts
    let displayParts = filteredParts?.length >= 0 ? filteredParts : baseParts;
    
    if (activeTab === 'reorder') {
      displayParts = displayParts.filter(part => {
        const reorderLevel = calculateReorderLevel(part);
        return part.quantity <= reorderLevel;
      });
    }

    return {
      stats: { totalParts, lowStockCount, reorderCount },
      displayParts
    };
  }, [parts, filteredParts, activeTab]);

  // 🚀 PERFORMANCE: Stable event handlers
  const handleEdit = useCallback((part) => {
    setEditingPart(part);
    setIsFormOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((part) => {
    setDeletingPart(part);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingPart) return;
    
    try {
      await handleDeletePart(deletingPart.id);
      toast({ title: "✅ Part Deleted", description: `${deletingPart.name} removed.` });
    } catch (error) {
      toast({ variant: "destructive", title: "❌ Delete Failed", description: "Could not delete part." });
    }
    setDeletingPart(null);
  }, [deletingPart, handleDeletePart, toast]);

  const closeForm = useCallback(() => {
    setEditingPart(null);
    setIsFormOpen(false);
  }, []);

  const handleFormSubmit = useCallback(async (partData) => {
    try {
      const result = await handlePartSubmit(partData);
      if (!result?.error) {
        closeForm();
        toast({ title: "✅ Part Saved", description: "Saved successfully." });
      } else {
        toast({ variant: "destructive", title: "❌ Save Failed", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "❌ Error", description: "Save failed." });
    }
  }, [handlePartSubmit, closeForm, toast]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedMainGroup('');
    setSelectedSubGroup('');
  }, [setSearchTerm, setSelectedMainGroup, setSelectedSubGroup]);

  // 🚀 PERFORMANCE: Early return for loading
  if (!parts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const { stats, displayParts } = computedData;

  return (
    <div className="space-y-4">
      {/* 🔧 SIMPLIFIED: Lightweight header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
            <span>Total: {stats.totalParts}</span>
            {stats.lowStockCount > 0 && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Low: {stats.lowStockCount}
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
        {user?.role === 'admin' && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Part
          </Button>
        )}
      </div>

      {/* 🚀 OPTIMIZED: Lightweight controls */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search parts..."
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 h-9 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedMainGroup || ''}
            onChange={(e) => setSelectedMainGroup(e.target.value)}
            className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9 transition-colors"
          >
            <option value="">All Groups</option>
            {mainGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <select
            value={selectedSubGroup || ''}
            onChange={(e) => setSelectedSubGroup(e.target.value)}
            className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9 transition-colors"
          >
            <option value="">All Sub-Groups</option>
            {subGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          {(searchTerm || selectedMainGroup || selectedSubGroup) && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-9 text-xs">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 🔧 SIMPLIFIED: Lightweight tabs */}
      <div className="flex border-b border-slate-600">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'inventory'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Inventory ({activeTab === 'inventory' ? displayParts.length : (filteredParts?.length || parts.length)})
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 ${
            activeTab === 'reorder'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Reorder ({stats.reorderCount})
          {stats.reorderCount > 0 && (
            <Badge variant="destructive" className="text-xs">{stats.reorderCount}</Badge>
          )}
        </button>
      </div>

      {/* 🚀 ULTRA-OPTIMIZED: Parts grid with optimized rendering */}
      <div className="mt-4">
        {displayParts.length > 0 ? (
          <div 
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              // Optimize for GPU by using transform instead of layout changes
              willChange: 'transform'
            }}
          >
            {displayParts.map((part) => (
              <OptimizedPartCard
                key={part.id}
                part={part}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                user={user}
                movements={movements}
                recordPartUsage={recordPartUsage}
                machines={machines}
                restockPart={restockPart}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300 mb-1">
              {activeTab === 'reorder' ? 'No Reorders Needed' : 'No Parts Found'}
            </h3>
            <p className="text-slate-400 text-sm">
              {activeTab === 'reorder' 
                ? 'All parts adequately stocked'
                : searchTerm || selectedMainGroup || selectedSubGroup
                  ? 'Try adjusting filters'
                  : 'Add parts to get started'
              }
            </p>
            {(searchTerm || selectedMainGroup || selectedSubGroup) && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 🚀 OPTIMIZED: Conditional form rendering */}
      {isFormOpen && (
        <PartForm
          title={editingPart ? 'Edit Part' : 'Add New Part'}
          initialData={editingPart}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
      )}

      {/* 🔧 SIMPLIFIED: Delete dialog */}
      {deletingPart && (
        <AlertDialog open={!!deletingPart} onOpenChange={() => setDeletingPart(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Part?</AlertDialogTitle>
              <AlertDialogDescription>
                Delete "{deletingPart.name}" ({deletingPart.part_number})? This cannot be undone.
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
      )}
    </div>
  );
};

export default UltraOptimizedInventoryTab;