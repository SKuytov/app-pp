import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Search, Plus, Package, AlertTriangle, TrendingUp, Grid, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// 🔧 FIXED: Lazy load components to prevent loading errors
const WorldClassPartCard = React.lazy(() => import('./WorldClassPartCard'));
const WorldClassPartDetailModal = React.lazy(() => import('./WorldClassPartDetailModal'));
const WorldBestPartForm = React.lazy(() => import('./WorldBestPartForm'));
const VirtualizedPartsList = React.lazy(() => import('./VirtualizedPartsList'));

// 🚀 FIXED: Error Boundary Component
class InventoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Inventory component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
            <p className="text-red-700 mb-4">
              {this.state.error?.message || 'An unexpected error occurred in the inventory component'}
            </p>
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🔧 FIXED: Safe utility functions to prevent React Error #31
const safeToString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString().split('T');
    }
    if (value.message) return String(value.message);
    if (value.error) return String(value.error);
    return JSON.stringify(value);
  }
  return String(value);
};

const safeToNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// 🏆 WORLD-CLASS INVENTORY TAB - Fixed all critical issues
const WorldClassInventoryTab = ({
  user,
  addToCart,
  parts = [],
  filteredParts = [],
  searchTerm = '',
  setSearchTerm,
  selectedMainGroup = '',
  setSelectedMainGroup,
  selectedSubGroup = '',
  setSelectedSubGroup,
  mainGroups = [],
  subGroups = [],
  machines = [],
  apiHandlers,
  movements = []
}) => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);

  // 🔧 FIXED: Safe API handlers with error handling
  const safeApiHandlers = useMemo(() => {
    const defaultHandler = async () => ({ error: 'API handler not available' });
    
    return {
      handlePartSubmit: apiHandlers?.handlePartSubmit || defaultHandler,
      handleDeletePart: apiHandlers?.handleDeletePart || defaultHandler,
      recordPartUsage: apiHandlers?.recordPartUsage || defaultHandler,
      restockPart: apiHandlers?.restockPart || defaultHandler
    };
  }, [apiHandlers]);

  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = safeApiHandlers;

  // 🚀 PERFORMANCE: Pre-compute everything once with safe calculations
  const computedData = useMemo(() => {
    try {
      const baseParts = Array.isArray(parts) ? parts : [];
      
      // Pre-calculate reorder levels for all parts at once
      const partsWithReorderLevels = baseParts.map(part => {
        try {
          const weeklyUsage = safeToNumber(part.weekly_usage);
          const monthlyUsage = safeToNumber(part.monthly_usage);
          const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
          const leadTimeWeeks = safeToNumber(part.lead_time_weeks) || 2;
          const safetyStock = safeToNumber(part.safety_stock) || Math.ceil(safeToNumber(part.min_stock) * 0.2);
          
          const reorderLevel = effectiveWeeklyUsage > 0 ? 
            Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock) : 0;
          
          return { 
            ...part, 
            calculatedReorderLevel: reorderLevel,
            // Ensure required fields exist
            id: part.id || `temp-${Math.random()}`,
            name: safeToString(part.name) || 'Unknown Part',
            quantity: safeToNumber(part.quantity),
            min_stock: safeToNumber(part.min_stock)
          };
        } catch (error) {
          console.warn('Error processing part:', safeToString(error), part);
          return { 
            ...part, 
            calculatedReorderLevel: 0,
            id: part.id || `error-${Math.random()}`,
            name: safeToString(part.name) || 'Error Loading Part',
            quantity: 0,
            min_stock: 0
          };
        }
      });

      // Stats calculation with safe operations
      const totalParts = partsWithReorderLevels.length;
      const lowStockCount = partsWithReorderLevels.filter(part => {
        try {
          return safeToNumber(part.quantity) <= safeToNumber(part.min_stock);
        } catch {
          return false;
        }
      }).length;
      
      const reorderCount = partsWithReorderLevels.filter(part => {
        try {
          const reorderLevel = safeToNumber(part.calculatedReorderLevel);
          const quantity = safeToNumber(part.quantity);
          return reorderLevel > 0 && quantity <= reorderLevel;
        } catch {
          return false;
        }
      }).length;

      // Display parts logic with safe filtering
      let displayParts = Array.isArray(filteredParts) && filteredParts.length >= 0 
        ? filteredParts 
        : partsWithReorderLevels;
      
      if (activeTab === 'reorder') {
        displayParts = displayParts.filter(part => {
          try {
            const reorderLevel = safeToNumber(part.calculatedReorderLevel);
            const quantity = safeToNumber(part.quantity);
            return reorderLevel > 0 && quantity <= reorderLevel;
          } catch {
            return false;
          }
        });
      }

      // Limit parts based on view mode to prevent performance issues
      const maxParts = viewMode === 'virtual' ? displayParts.length : 1000;

      return {
        stats: { totalParts, lowStockCount, reorderCount },
        displayParts: displayParts.slice(0, maxParts)
      };
    } catch (error) {
      console.error('Error computing inventory data:', safeToString(error));
      return {
        stats: { totalParts: 0, lowStockCount: 0, reorderCount: 0 },
        displayParts: []
      };
    }
  }, [parts, filteredParts, activeTab, viewMode]);

  // 🚀 PERFORMANCE: Stable event handlers with error handling
  const handleEdit = useCallback((part) => {
    try {
      if (!part || !part.id) {
        toast({ variant: "destructive", title: "Error", description: "Invalid part data" });
        return;
      }
      setEditingPart(part);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error editing part:', safeToString(error));
      toast({ variant: "destructive", title: "Error", description: "Failed to open edit form" });
    }
  }, [toast]);

  const handleViewDetails = useCallback((part) => {
    try {
      if (!part || !part.id) {
        toast({ variant: "destructive", title: "Error", description: "Invalid part data" });
        return;
      }
      setSelectedPart(part);
    } catch (error) {
      console.error('Error viewing part details:', safeToString(error));
      toast({ variant: "destructive", title: "Error", description: "Failed to open part details" });
    }
  }, [toast]);

  const handleDeleteRequest = useCallback((part) => {
    try {
      if (!part || !part.id) {
        toast({ variant: "destructive", title: "Error", description: "Invalid part data" });
        return;
      }
      setDeletingPart(part);
    } catch (error) {
      console.error('Error requesting delete:', safeToString(error));
      toast({ variant: "destructive", title: "Error", description: "Failed to prepare delete" });
    }
  }, [toast]);

  const confirmDelete = useCallback(async () => {
    if (!deletingPart) return;
    
    setLoading(true);
    try {
      const result = await handleDeletePart(deletingPart.id);
      if (result?.error) {
        throw new Error(result.error);
      }
      toast({ title: "✅ Deleted", description: `${safeToString(deletingPart.name)} removed.` });
    } catch (error) {
      console.error('Delete error:', safeToString(error));
      toast({ 
        variant: "destructive", 
        title: "❌ Failed", 
        description: safeToString(error.message) || "Could not delete part." 
      });
    } finally {
      setDeletingPart(null);
      setLoading(false);
    }
  }, [deletingPart, handleDeletePart, toast]);

  const handleFormSubmit = useCallback(async (partData) => {
    setLoading(true);
    try {
      const result = await handlePartSubmit(partData);
      if (result?.error) {
        throw new Error(result.error);
      }
      setEditingPart(null);
      setIsFormOpen(false);
      toast({ title: "✅ Saved", description: "Part saved successfully." });
    } catch (error) {
      console.error('Form submit error:', safeToString(error));
      let errorMessage = "Save failed.";
      
      // Handle specific error types
      if (safeToString(error.message).includes('duplicate')) {
        errorMessage = "Part number already exists";
      } else if (safeToString(error.message).includes('validation')) {
        errorMessage = "Invalid data provided";
      } else if (error.message) {
        errorMessage = safeToString(error.message);
      }
      
      toast({ variant: "destructive", title: "❌ Failed", description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [handlePartSubmit, toast]);

  const clearFilters = useCallback(() => {
    try {
      setSearchTerm('');
      setSelectedMainGroup('');
      setSelectedSubGroup('');
    } catch (error) {
      console.error('Error clearing filters:', safeToString(error));
    }
  }, [setSearchTerm, setSelectedMainGroup, setSelectedSubGroup]);

  const handleAddToCart = useCallback((part) => {
    try {
      if (!part || !part.id) {
        toast({ variant: "destructive", title: "Error", description: "Invalid part data" });
        return;
      }
      if (safeToNumber(part.quantity) <= 0) {
        toast({ variant: "destructive", title: "Out of Stock", description: "This part is not available" });
        return;
      }
      addToCart && addToCart(part);
      toast({ title: "✅ Added", description: `${safeToString(part.name)} added to cart` });
    } catch (error) {
      console.error('Error adding to cart:', safeToString(error));
      toast({ variant: "destructive", title: "Error", description: "Failed to add to cart" });
    }
  }, [addToCart, toast]);

  // 🚀 VIRTUAL GRID: For massive datasets with error handling
  const VirtualizedGrid = useCallback(({ columnCount, rowCount, items }) => {
    const Cell = ({ columnIndex, rowIndex, style }) => {
      try {
        const index = rowIndex * columnCount + columnIndex;
        const part = items[index];
        
        if (!part) return <div style={style} />;
        
        return (
          <div style={style} className="p-2">
            <Suspense fallback={
              <div className="bg-slate-800 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-6 bg-slate-700 rounded"></div>
              </div>
            }>
              <WorldClassPartCard
                part={part}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                user={user}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            </Suspense>
          </div>
        );
      } catch (error) {
        console.error('Error rendering grid cell:', safeToString(error));
        return (
          <div style={style} className="p-2">
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">Error loading part</p>
            </div>
          </div>
        );
      }
    };

    try {
      return (
        <div className="w-full" style={{ height: '600px' }}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          }>
            <VirtualizedPartsList
              parts={items}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onView={handleViewDetails}
              onAddToCart={handleAddToCart}
              user={user}
              containerHeight={600}
            />
          </Suspense>
        </div>
      );
    } catch (error) {
      console.error('Error rendering virtualized grid:', safeToString(error));
      return (
        <div className="flex items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading parts list</p>
        </div>
      );
    }
  }, [handleEdit, handleDeleteRequest, user, handleAddToCart, handleViewDetails]);

  // 🔧 FIXED: Safe loading state
  if (!Array.isArray(parts)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const { stats, displayParts } = computedData;
  const columnCount = Math.floor((window.innerWidth - 100) / 280) || 4;

  return (
    <InventoryErrorBoundary>
      <div className="space-y-6">
        {/* 🎨 STREAMLINED: Compact header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Inventory</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-300 border-blue-300">
                Total: {safeToString(stats.totalParts)}
              </Badge>
              {stats.lowStockCount > 0 && (
                <Badge variant="outline" className="text-red-300 border-red-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Low: {safeToString(stats.lowStockCount)}
                </Badge>
              )}
              {stats.reorderCount > 0 && (
                <Badge variant="outline" className="text-orange-300 border-orange-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Reorder: {safeToString(stats.reorderCount)}
                </Badge>
              )}
            </div>
          </div>

          {/* 🚀 PERFORMANCE: View mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">View:</span>
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'virtual' ? 'default' : 'outline'}
              onClick={() => setViewMode('virtual')}
              className="h-8"
            >
              <List className="w-4 h-4" />
            </Button>

            {user?.role === 'admin' && (
              <Button 
                onClick={() => setIsFormOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 h-8"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Part
              </Button>
            )}
          </div>
        </div>

        {/* 🔧 COMPACT: Search and filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 h-9"
            />
          </div>
          
          <select
            value={selectedMainGroup}
            onChange={(e) => setSelectedMainGroup(e.target.value)}
            className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9"
          >
            <option value="">All Groups</option>
            {Array.isArray(mainGroups) && mainGroups.map(group => (
              <option key={group} value={group}>{safeToString(group)}</option>
            ))}
          </select>

          <select
            value={selectedSubGroup}
            onChange={(e) => setSelectedSubGroup(e.target.value)}
            className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white h-9"
          >
            <option value="">All Sub-Groups</option>
            {Array.isArray(subGroups) && subGroups.map(group => (
              <option key={group} value={group}>{safeToString(group)}</option>
            ))}
          </select>

          {(searchTerm || selectedMainGroup || selectedSubGroup) && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
              Clear
            </Button>
          )}
        </div>

        {/* 🎯 SIMPLE: Tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
          <Button
            size="sm"
            variant={activeTab === 'inventory' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('inventory')}
            className="h-8"
          >
            All Parts
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'reorder' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('reorder')}
            className="h-8"
          >
            Reorder Needed ({safeToString(stats.reorderCount)})
          </Button>
        </div>

        {/* 🚀 PERFORMANCE: Dynamic rendering based on dataset size */}
        <div className="min-h-96">
          {displayParts.length > 0 ? (
            viewMode === 'virtual' && displayParts.length > 500 ? (
              <VirtualizedGrid
                columnCount={columnCount}
                rowCount={Math.ceil(displayParts.length / columnCount)}
                items={displayParts}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayParts.map((part) => (
                  <Suspense
                    key={part.id}
                    fallback={
                      <div className="bg-slate-800 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-slate-700 rounded mb-2"></div>
                        <div className="h-6 bg-slate-700 rounded"></div>
                      </div>
                    }
                  >
                    <WorldClassPartCard
                      part={part}
                      onEdit={handleEdit}
                      onDelete={handleDeleteRequest}
                      user={user}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                    />
                  </Suspense>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                {activeTab === 'reorder' ? 'No Reorders Needed' : 'No Parts Found'}
              </h3>
              <p className="text-slate-400 mb-6">
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

        {/* 🎨 MODALS: Conditional rendering with error boundaries */}
        {selectedPart && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          }>
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
              onAddToCart={handleAddToCart}
            />
          </Suspense>
        )}

        {isFormOpen && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          }>
            <WorldBestPartForm
              onSubmit={handleFormSubmit}
              onCancel={() => { setEditingPart(null); setIsFormOpen(false); }}
              title={editingPart ? "Edit Part" : "Add New Part"}
              initialData={editingPart}
            />
          </Suspense>
        )}

        {deletingPart && (
          <AlertDialog open={!!deletingPart} onOpenChange={() => setDeletingPart(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Part?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{safeToString(deletingPart.name)}" and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </InventoryErrorBoundary>
  );
};

export default WorldClassInventoryTab;
