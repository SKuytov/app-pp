import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuotationApprovalModal from '@/components/Quotations/QuotationApprovalModal';

const QuotationManagement = ({ orders, quotations, updateOrder, user }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersWithQuotes = useMemo(() => {
    if (!orders || !quotations) return [];
    return orders
      .map(order => {
        const relatedQuotation = quotations.find(q => q.order_id === order.id);
        if (relatedQuotation) {
          return {
            ...order,
            quotation_pdf_url: relatedQuotation.pdf_url,
            quotation_status: relatedQuotation.status,
            quotation_price: relatedQuotation.price,
            supplier_name: relatedQuotation.supplier_name,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [orders, quotations]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-500/20 text-green-300';
      case 'Rejected': return 'bg-red-500/20 text-red-300';
      case 'Pending Approval': return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getPartNameFromOrder = (order) => {
    if (order.items && order.items.length > 0) {
      return order.items.map(item => item.part_name).join(', ');
    }
    return 'N/A';
  };

  return (
    <motion.div
      key="quotations"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Quotation Management</h2>
      </div>

      <Card className="p-4 sm:p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-slate-300 font-semibold">Order ID</th>
                <th className="p-3 text-slate-300 font-semibold">Part(s)</th>
                <th className="p-3 text-slate-300 font-semibold">File</th>
                <th className="p-3 text-slate-300 font-semibold">Status</th>
                <th className="p-3 text-slate-300 font-semibold">Requester</th>
              </tr>
            </thead>
            <tbody>
              {ordersWithQuotes.map(order => (
                <motion.tr
                  key={order.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-slate-800 hover:bg-slate-700/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="p-3 text-white font-mono text-xs">#{order.id.substring(0, 8)}...</td>
                  <td className="p-3 text-white font-medium">{getPartNameFromOrder(order)}</td>
                  <td className="p-3 text-blue-400 hover:underline">View Quotation</td>
                  <td className="p-3"><Badge className={getStatusClass(order.status)}>{order.status}</Badge></td>
                  <td className="p-3 text-white">{order.requested_by_name}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {ordersWithQuotes.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <FileCheck className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No quotations found</h3>
              <p className="text-slate-400">Quotations attached to orders will appear here for approval.</p>
            </div>
          )}
        </div>
      </Card>

      {selectedOrder && (
        <QuotationApprovalModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onUpdate={updateOrder}
          user={user}
        />
      )}
    </motion.div>
  );
};

export default QuotationManagement;