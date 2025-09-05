import React from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, Settings, AlertTriangle, Truck, ListOrdered } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/Dashboard/StatCard';
import { useCurrency } from '@/contexts/CurrencyContext';

const Dashboard = ({ user, parts, lowStockParts, orders, suppliers }) => {
  const { formatCurrency } = useCurrency();
  const safeParts = parts || [];
  const safeOrders = orders || [];
  const safeSuppliers = suppliers || [];
  const safeLowStockParts = lowStockParts || [];

  const totalValue = safeParts.reduce((sum, part) => sum + ((part.quantity || 0) * (part.price || 0)), 0);
  const totalParts = safeParts.reduce((sum, part) => sum + (part.quantity || 0), 0);
  const pendingOrders = safeOrders.filter(o => o.status === 'Pending Approval').length;
  const partCategories = new Set(safeParts.map(p => p.main_group).filter(Boolean)).size;

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white">Welcome, {user.username}</h1>
        <p className="text-slate-400">Here's your strategic overview of PartPulse.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <StatCard label="Total Parts" value={totalParts.toLocaleString()} icon={Package} color="blue" />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={TrendingUp} color="green" />
        <StatCard label="Part Categories" value={partCategories.toLocaleString()} icon={Settings} color="purple" />
        <StatCard label="Low Stock" value={safeLowStockParts.length.toLocaleString()} icon={AlertTriangle} color="red" />
        <StatCard label="Pending Orders" value={pendingOrders.toLocaleString()} icon={ListOrdered} color="yellow" />
        <StatCard label="Suppliers" value={safeSuppliers.length.toLocaleString()} icon={Truck} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700 lg:col-span-2">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {safeOrders.slice(-5).reverse().map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex flex-wrap items-center space-x-3">
                    <span className="text-white font-semibold">{order.requested_by_name || 'N/A'}</span>
                    <span className="text-slate-400 text-sm">({order.items ? `${order.items.length} items` : 'Non-inventory'})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-300 text-sm">{order.facility_name}</span>
                    <Badge variant={
                      order.status === 'Delivered' ? 'secondary' : 
                      order.status === 'Pending Approval' ? 'default' : 'destructive'
                    } className={
                      order.status === 'Delivered' ? 'bg-green-500/20 text-green-300' :
                      order.status === 'Pending Approval' ? 'bg-yellow-500/20 text-yellow-300' :
                      order.status === 'Rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-blue-500/20 text-blue-300'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
             {safeOrders.length === 0 && (
                <p className="text-slate-400 text-center py-4">No recent orders found.</p>
             )}
          </div>
        </Card>
        <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Critical Low Stock</h3>
          <div className="space-y-3">
            {safeLowStockParts.filter(p => p.criticality === 'A').slice(0, 5).map((part) => (
              <motion.div
                key={part.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                  <div>
                    <p className="text-white font-semibold">{part.name}</p>
                    <p className="text-slate-300 text-sm">In Stock: {part.quantity}</p>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
              </motion.div>
            ))}
             {safeLowStockParts.filter(p => p.criticality === 'A').length === 0 && (
                <p className="text-slate-400 text-center py-4">No critical items are low on stock.</p>
             )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default Dashboard;