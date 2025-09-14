import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import WorldClassPartCard from './WorldClassPartCard';
import WorldClassPartDetailModal from './WorldClassPartDetailModal';
import PartForm from '@/components/Inventory/PartForm';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// 🚀 VIRTUALIZATION: For 10,000+ parts performance
import { FixedSizeGrid as Grid } from 'react-window';

// 🏆 WORLD-CLASS INVENTORY TAB - Designed for enterprise scale
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'virtual'

  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = apiHandlers;

  // 🚀 PERFORMANCE: Pre-compute everything once
  const computedData = useMemo(() => {
    const baseParts = parts || [];
    
    // Pre-calculate reorder levels for all parts at once
    const partsWithReorderLevels = baseParts.map(part => {
      const weeklyUsage = part.weekly_usage || 0;
      const monthlyUsage = part.monthly_usage || 0;
      const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
      const reorderLevel = effectiveWeeklyUsage > 0 ? 
        Math.ceil((effectiveWeeklyUsage * (part.lead_time_weeks || 2)) + (part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2))) : 0;
      
      return { ...part, calculatedReorderLevel: reorderLevel };
    });

    // Stats calculation
    const totalParts = partsWithReorderLevels.length;
    const lowStockCount = partsWithReorderLevels.filter(part => part.quantity <= (part.min_stock || 0)).length;
    const reorderCount = partsWithReorderLevels.filter(part => part.calculatedReorderLevel > 0 && part.quantity <= part.calculatedReorderLevel).length;

    // Display parts logic
    let displayParts = filteredParts?.length >= 0 ? filteredParts : partsWithReorderLevels;
    
    if (activeTab === 'reorder') {
      displayParts = displayParts.filter(part => {
        const reorderLevel = part.calculatedReorderLevel || 0;
        return reorderLevel > 0 && part.quantity <= reorderLevel;
      });
    }

    return {
      stats: { totalParts, lowStockCount, reorderCount },
      displayParts: displayParts.slice(0, viewMode === 'virtual' ? displayParts.length : 1000) // Limit for grid mode
    };
  }, [parts, filteredParts, activeTab, viewMode]);

  // 🚀 PERFORMANCE: Stable event handlers
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
      toast({ title: "✅ Deleted", description: `${deletingPart.name} removed.` });
    } catch (error) {
      toast({ variant: "destructive", title: "❌ Failed", description: "Could not delete part." });
    }
    setDeletingPart(null);
  }, [deletingPart, handleDeletePart, toast]);

  const handleFormSubmit = useCallback(async (partData) => {
    try {
      const result = await handlePartSubmit(partData);
      if (!result?.error) {
        setEditingPart(null);
        setIsFormOpen(false);
        toast({ title: "✅ Saved", description: "Part saved successfully." });
      } else {
        toast({ variant: "destructive", title: "❌ Failed", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "❌ Error", description: "Save failed." });
    }
  }, [handlePartSubmit, toast]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedMainGroup('');
    setSelectedSubGroup('');
  }, [setSearchTerm, setSelectedMainGroup, setSelectedSubGroup]);

  // 🚀 VIRTUAL GRID: For massive datasets
  const VirtualizedGrid = useCallback(({ columnCount, rowCount, items }) => {
    const Cell = ({ columnIndex, rowIndex, style }) => {
      const index = rowIndex * columnCount + columnIndex;
      const part = items[index];
      
      if (!part) return <div style={style} />;
      
      return (
        <div style={{ ...style, padding: '8px' }}>
          <WorldClassPartCard
            part={part}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            user={user}
            onAddToCart={addToCart}
            onViewDetails={handleViewDetails}
          />
        </div>
      );
    };

    return (
      <div className="w-full" style={{ height: '70vh' }}>
        <Grid
          columnCount={columnCount}
          columnWidth={280}
          height={window.innerHeight * 0.7}
          rowCount={Math.ceil(items.length / columnCount)}
          rowHeight={320}
          width={window.innerWidth - 100}
        >
          {Cell}
        </Grid>
      </div>
    );
  }, [handleEdit, handleDeleteRequest, user, addToCart, handleViewDetails]);

  if (!parts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading inventory...</div>
      </div>
    );
  }

  const { stats, displayParts } = computedData;
  const columnCount = Math.floor((window.innerWidth - 100) / 280) || 4;

  return (
    <div className="space-y-4">
      {/* 🎨 STREAMLINED: Compact header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
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

          {/* 🚀 PERFORMANCE: View mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">View:</span>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-3 text-xs"
            >
              Grid ({Math.min(displayParts.length, 1000)})
            </Button>
            <Button
              variant={viewMode === 'virtual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('virtual')}
              className="h-7 px-3 text-xs"
            >
              Virtual (All {displayParts.length})
            </Button>
          </div>
        </div>

        {user?.role === 'admin' && (
          <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </Button>
        )}
      </div>

      {/* 🔧 COMPACT: Search and filters */}
      <div className="flex gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search parts..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700/50 border-slate-600 h-9"
          />
        </div>
        
        <select
          value={selectedMainGroup || ''}
          onChange={(e) => setSelectedMainGroup(e.target.value)}
          className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9"
        >
          <option value="">All Groups</option>
          {mainGroups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>

        <select
          value={selectedSubGroup || ''}
          onChange={(e) => setSelectedSubGroup(e.target.value)}
          className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9"
        >
          <option value="">All Sub-Groups</option>
          {subGroups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>

        {(searchTerm || selectedMainGroup || selectedSubGroup) && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
            Clear
          </Button>
        )}
      </div>

      {/* 🎯 SIMPLE: Tabs */}
      <div className="flex border-b border-slate-600">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Inventory ({activeTab === 'inventory' ? displayParts.length : stats.totalParts})
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reorder'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Reorder ({stats.reorderCount})
          {stats.reorderCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">{stats.reorderCount}</Badge>
          )}
        </button>
      </div>

      {/* 🚀 PERFORMANCE: Dynamic rendering based on dataset size */}
      <div className="mt-4">
        {displayParts.length > 0 ? (
          viewMode === 'virtual' && displayParts.length > 500 ? (
            <VirtualizedGrid
              columnCount={columnCount}
              rowCount={Math.ceil(displayParts.length / columnCount)}
              items={displayParts}
            />
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {displayParts.map((part) => (
                <WorldClassPartCard
                  key={part.id}
                  part={part}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                  user={user}
                  onAddToCart={addToCart}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300 mb-1">
              {activeTab === 'reorder' ? 'No Reorders Needed' : 'No Parts Found'}
            </h3>
            <p className="text-slate-400 text-sm">
              {activeTab === 'reorder' 
                ? 'All parts are adequately stocked'
                : searchTerm || selectedMainGroup || selectedSubGroup
                  ? 'Try adjusting your filters'
                  : 'Add parts to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* 🎨 MODALS: Conditional rendering */}
      {selectedPart && (
        <WorldClassPartDetailModal
          isOpen={!!selectedPart}
          onClose={() => setSelectedPart(null)}
          part={selectedPart}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          user={user}
          movements={movements}
          recordPartUsage={recordPartUsage}
          machines={machines}
          restockPart={restockPart}
          onAddToCart={addToCart}
        />
      )}

      {isFormOpen && (
        <PartForm
          title={editingPart ? 'Edit Part' : 'Add New Part'}
          initialData={editingPart}
          onSubmit={handleFormSubmit}
          onCancel={() => { setEditingPart(null); setIsFormOpen(false); }}
        />
      )}

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

export default WorldClassInventoryTab;