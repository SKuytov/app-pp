import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Package, DollarSign, Building2, Calculator, Filter, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from '@/contexts/CurrencyContext';
import PartCard from './PartCard';
import PartDetailModal from './PartDetailModal';

const ReorderAlert = ({ part, onViewDetails }) => {
  const { formatCurrency } = useCurrency();
  
  // Calculate reorder level
  const reorderLevel = useMemo(() => {
    const weeklyUsage = part.weekly_usage || 0;
    const monthlyUsage = part.monthly_usage || 0;
    const leadTimeWeeks = part.lead_time_weeks || 2;
    const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
    
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
    
    if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
      return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
    }
    return 0;
  }, [part.weekly_usage, part.monthly_usage, part.lead_time_weeks, part.safety_stock, part.min_stock]);
  
  const deficit = Math.max(0, reorderLevel - part.quantity);
  const urgency = part.quantity <= part.min_stock ? 'critical' : 'high';
  
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-900/30 border-red-500/50 text-red-300';
      case 'high': return 'bg-orange-900/30 border-orange-500/50 text-orange-300';
      default: return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300';
    }
  };

  return (
    <motion.div
      className={`p-4 rounded-lg border ${getUrgencyColor(urgency)} mb-2`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="font-semibold">{part.name}</h4>
            <Badge variant="outline" className="text-xs">{part.part_number}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="opacity-75">Current: </span>
              <span className="font-semibold">{part.quantity}</span>
            </div>
            <div>
              <span className="opacity-75">Reorder at: </span>
              <span className="font-semibold">{reorderLevel}</span>
            </div>
            <div>
              <span className="opacity-75">Min Stock: </span>
              <span className="font-semibold">{part.min_stock}</span>
            </div>
            <div>
              <span className="opacity-75">Need: </span>
              <span className="font-semibold text-red-300">+{deficit}</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(part)}
          className="ml-4"
        >
          Details
        </Button>
      </div>
    </motion.div>
  );
};

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
      title: "Low Stock Items",
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
  parts = [], 
  onEditPart, 
  onDeletePart, 
  onAddToCart, 
  user,
  movements,
  recordPartUsage,
  machines,
  restockPart 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Enhanced filtering with reorder status
  const filteredParts = useMemo(() => {
    let filtered = parts;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.supplier_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    switch (filterCategory) {
      case 'low-stock':
        filtered = filtered.filter(part => part.quantity <= part.min_stock);
        break;
      case 'reorder':
        filtered = filtered.filter(part => {
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
        break;
      case 'critical':
        filtered = filtered.filter(part => part.criticality === 'A');
        break;
      case 'ok':
        filtered = filtered.filter(part => {
          const weeklyUsage = part.weekly_usage || 0;
          const monthlyUsage = part.monthly_usage || 0;
          const leadTimeWeeks = part.lead_time_weeks || 2;
          const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
          
          const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
          
          if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
            const reorderLevel = Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
            return part.quantity > reorderLevel && part.quantity > part.min_stock;
          }
          return part.quantity > part.min_stock;
        });
        break;
      default:
        break;
    }
    
    return filtered;
  }, [parts, searchTerm, filterCategory]);

  // Calculate reorder alerts
  const reorderAlerts = useMemo(() => {
    return parts.filter(part => {
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

  return (
    <div className="space-y-6">
      {/* Inventory Statistics */}
      <InventoryStats parts={parts} />

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
        
        <div className="flex gap-2">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
          >
            All ({parts.length})
          </Button>
          <Button
            variant={filterCategory === 'reorder' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('reorder')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Reorder ({reorderAlerts.length})
          </Button>
          <Button
            variant={filterCategory === 'low-stock' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('low-stock')}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Low Stock
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="inventory">Inventory ({filteredParts.length})</TabsTrigger>
          <TabsTrigger value="reorder-alerts">
            Reorder Alerts ({reorderAlerts.length})
            {reorderAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reorderAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          {filteredParts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredParts.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  onClick={() => setSelectedPart(part)}
                  onAddToCart={onAddToCart}
                  showReorderStatus={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No parts found</h3>
              <p className="text-slate-400">
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add some parts to get started'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reorder-alerts" className="mt-6">
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
              <div className="space-y-2">
                {reorderAlerts
                  .sort((a, b) => {
                    // Sort by quantity (ascending) to show most critical first
                    return a.quantity - b.quantity;
                  })
                  .map((part) => (
                    <ReorderAlert
                      key={part.id}
                      part={part}
                      onViewDetails={setSelectedPart}
                    />
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-12 bg-green-900/10 border border-green-500/20 rounded-lg">
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

      {/* Enhanced Part Detail Modal */}
      {selectedPart && (
        <PartDetailModal
          isOpen={true}
          onClose={() => setSelectedPart(null)}
          part={selectedPart}
          onEdit={onEditPart}
          onDelete={onDeletePart}
          onAddToCart={onAddToCart}
          user={user}
          movements={movements}
          recordPartUsage={recordPartUsage}
          machines={machines}
          restockPart={restockPart}
        />
      )}
    </div>
  );
};

export default InventoryTab;