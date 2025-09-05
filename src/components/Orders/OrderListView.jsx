import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const OrderListView = ({ orders, updateOrderStatus, user, facilities }) => {
  const { toast } = useToast();

  const handleApprove = (orderId) => {
    updateOrderStatus(orderId, 'Approved');
    toast({ title: "✅ Order Approved", description: "The order has been approved and sent for processing." });
  };

  const handleReject = (orderId) => {
    updateOrderStatus(orderId, 'Rejected');
    toast({ variant: "destructive", title: "❌ Order Rejected", description: "The order has been rejected." });
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'High': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-500/20 text-green-300';
      case 'Rejected': return 'bg-red-500/20 text-red-300';
      case 'Pending Approval': return 'bg-yellow-500/20 text-yellow-300';
      case 'Approved': return 'bg-blue-500/20 text-blue-300';
      case 'Ordered': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <Card className="p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-slate-300 font-semibold">Items</th>
              <th className="p-3 text-slate-300 font-semibold">Requester</th>
              <th className="p-3 text-slate-300 font-semibold">Facility</th>
              <th className="p-3 text-slate-300 font-semibold">Date</th>
              <th className="p-3 text-slate-300 font-semibold">Priority</th>
              <th className="p-3 text-slate-300 font-semibold">Status</th>
              <th className="p-3 text-slate-300 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {orders.map(order => {
                const isMultiItem = order.items && order.items.length > 0;
                const isNonInventory = order.is_non_inventory;
                const partName = isNonInventory ? order.part_name : (isMultiItem ? order.items[0].part_name : 'Unknown');
                const facilityName = facilities.find(f => f.id === order.facility_id)?.name || 'N/A';

                return (
                  <motion.tr
                    key={order.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 text-white font-medium">
                      {partName}
                      {isMultiItem && order.items.length > 1 && (
                        <span className="text-xs text-purple-300 ml-2 flex items-center">
                          <Package className="h-3 w-3 mr-1" /> +{order.items.length - 1} more
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-white">{order.requested_by_name}</td>
                    <td className="p-3 text-white">{facilityName}</td>
                    <td className="p-3 text-white">{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                    <td className="p-3"><Badge className={getPriorityClass(order.priority)}>{order.priority || 'Normal'}</Badge></td>
                    <td className="p-3"><Badge className={getStatusClass(order.status)}>{order.status}</Badge></td>
                    <td className="p-3 text-center">
                      {(user.role === 'approver' || user.role === 'admin') && order.status === 'Pending Approval' && (
                        <div className="flex justify-center space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(order.id)}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(order.id)}><X className="h-4 w-4" /></Button>
                        </div>
                      )}
                      {!(user.role === 'approver' || user.role === 'admin') && order.status === 'Pending Approval' && (
                        <div className="flex justify-center items-center text-yellow-300 text-xs">
                          <Clock className="h-3 w-3 mr-1.5" />
                          Awaiting Approval
                        </div>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No orders to display.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderListView;