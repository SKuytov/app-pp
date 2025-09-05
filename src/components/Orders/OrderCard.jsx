import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { HardHat, Calendar, Hash, Package, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const OrderCard = ({ order, onClick }) => {
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'High': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const isMultiItemOrder = order.items && order.items.length > 0;
  const isNonInventory = order.is_non_inventory;
  
  const partName = isNonInventory ? order.part_name : (isMultiItemOrder ? order.items[0].part_name : 'Unknown Item');
  const partNumber = isNonInventory ? order.part_number : (isMultiItemOrder ? order.items[0].part_number : 'N/A');
  const quantity = isNonInventory ? order.quantity : (isMultiItemOrder ? order.items[0].quantity : 'N/A');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="p-4 bg-slate-900/70 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-all duration-200"
    >
      <div className="flex justify-between items-start">
        <p className="text-white font-semibold text-md mb-2 flex-1 pr-2">{partName}</p>
        <Badge className={getPriorityClass(order.priority)}>{order.priority || 'Normal'}</Badge>
      </div>
      <p className="text-xs text-slate-400 mb-3">{partNumber}</p>
      
      {isNonInventory && (
        <div className="flex items-center text-xs text-yellow-300 mb-2">
          <AlertTriangle className="h-3 w-3 mr-1.5" />
          <span>Non-Inventory Item</span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-300">
        <div className="flex items-center">
          <Hash className="h-3 w-3 mr-1.5 text-slate-500" />
          <span>Qty: {quantity}</span>
        </div>
        <div className="flex items-center">
          <HardHat className="h-3 w-3 mr-1.5 text-slate-500" />
          <span>{order.requested_by_name}</span>
        </div>
      </div>
      <div className="flex items-center text-sm text-slate-300 mt-2">
        <Calendar className="h-3 w-3 mr-1.5 text-slate-500" />
        <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
      </div>
      {isMultiItemOrder && order.items.length > 1 && (
        <div className="flex items-center text-xs text-purple-300 mt-2 pt-2 border-t border-slate-700">
          <Package className="h-3 w-3 mr-1.5" />
          <span>+ {order.items.length - 1} more item(s)</span>
        </div>
      )}
    </motion.div>
  );
};

export default OrderCard;