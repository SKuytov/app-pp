import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Package, DollarSign, Building2, Calculator, Filter, Search, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilterControls from '@/components/Inventory/FilterControls';
import PartCard from '@/components/Inventory/PartCard';
import PartForm from '@/components/Inventory/PartForm';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const InventoryStats = ({ parts }) => {
  const { formatCurrency } = useCurrency();
  
  const stats = useMemo(() => {
    const totalParts = parts.length;
    const totalValue = parts.reduce((sum, part) => sum + ((part.quantity || 0) * (part.price || 0)), 0);
    const lowStockParts = parts.filter(part => part.quantity <= part.min_stock).length;
    
    // Calculate reorder parts
    const reorderParts = parts.filter(part => {
      const weeklyUsage = part.weekly_usage || 0;
      const monthlyUsage = part.monthly_usage || 0;
      const leadTimeWeeks = part.lead_time_weeks || 2;
      const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
      
      const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
      
      if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
        const reorderLevel = Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
        return part.quantity <= reorderLevel;
      }
      return false;
    }).length;
    
    const uniqueSuppliers = new Set(parts.map(part => part.supplier_id || part.supplier).filter(Boolean)).size;
    
    return {
      totalParts,
      totalValue,
      lowStockParts,
      reorderParts,
      uniqueSuppliers
    };
  }, [parts]);

  const statCards = [
    {
      title: "Total Parts",
      value: stats.totalParts.toLocaleString(),
      icon: Package,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20"
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-900/20"
    },
    {
      title: "Low Stock",
      value: stats.lowStockParts.toString(),
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-900/20"
    },
    {
      title: "Need Reorder",
      value: stats.reorderParts.toString(),
      icon: TrendingUp,
      color: "text-orange-400",
      bgColor: "bg-orange-900/20"
    },
    {
      title: "Suppliers",
      value: stats.uniqueSuppliers.toString(),
      icon: Building2,
      color: "text-purple-400",
      bgColor: "bg-purple-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`${stat.bgColor} border-slate-600`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-xs font-medium">{stat.title}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-75`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState('inventory');

  const { handlePartSubmit, handleDeletePart, recordPartUsage, restockPart } = apiHandlers;

  // Enhanced filtered parts with reorder status
  const enhancedFilteredParts = useMemo(() => {
    if (activeTab === 'reorder') {
      return (filteredParts || []).filter(part => {
        const weeklyUsage = part.weekly_usage || 0;
        const monthlyUsage = part.monthly_usage || 0;
        const leadTimeWeeks = part.lead_time_weeks || 2;
        const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
        
        const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
        
        if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
          const reorderLevel = Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
          return part.quantity <= reorderLevel;
        }
        return false;
      });
    }
    return filteredParts || [];
  }, [filteredParts, activeTab]);

  const reorderAlerts = useMemo(() => {
    return (parts || []).filter(part => {
      const weeklyUsage = part.weekly_usage || 0;
      const monthlyUsage = part.monthly_usage || 0;
      const leadTimeWeeks = part.lead_time_weeks || 2;
      const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
      
      const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
      
      if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
        const reorderLevel = Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
        return part.quantity <= reorderLevel;
      }
      return false;
    });
  }, [parts]);

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
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory</h1>
          <p className="text-slate-400 mt-1">Manage your parts and inventory</p>
        </div>
        {user.role === 'admin' && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" />
            Add Part
          </Button>
        )}
      </div>

      {/* Inventory Statistics */}
      <InventoryStats parts={parts || []} />

      {/* Enhanced Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search parts, numbers, or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
        
        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedMainGroup={selectedMainGroup}
          setSelectedMainGroup={setSelectedMainGroup}
          selectedSubGroup={selectedSubGroup}
          setSelectedSubGroup={setSelectedSubGroup}
          mainGroups={mainGroups}
          subGroups={subGroups}
        />
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="inventory">
            Inventory ({(filteredParts || []).length})
          </TabsTrigger>
          <TabsTrigger value="reorder">
            Reorder Alerts ({reorderAlerts.length})
            {reorderAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reorderAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          {/* Parts Grid - Maintaining your original large image layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {enhancedFilteredParts.map((part) => (
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

          {(!enhancedFilteredParts || enhancedFilteredParts.length === 0) && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No parts found</h3>
              <p className="text-slate-400">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reorder" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-400" />
                Parts Requiring Reorder
              </h3>
              {reorderAlerts.length > 0 && (
                <Badge variant="outline" className="text-orange-300 border-orange-500">
                  {reorderAlerts.length} items need attention
                </Badge>
              )}
            </div>

            {reorderAlerts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {reorderAlerts
                  .sort((a, b) => a.quantity - b.quantity)
                  .map((part) => (
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
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-16 bg-green-900/10 border border-green-500/20 rounded-lg">
                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-green-300 mb-2">All Good!</h3>
                <p className="text-green-400">No parts need reordering at this time.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      {isFormOpen && (
        <PartForm
          title={editingPart ? 'Edit Part' : 'Add New Part'}
          initialData={editingPart}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
      )}

      {/* Delete Confirmation Dialog */}
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
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default InventoryTab;