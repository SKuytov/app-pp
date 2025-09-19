import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OrderCard from '@/components/Orders/OrderCard';
import OrderDetailModal from '@/components/Orders/OrderDetailModal';

const KanbanColumn = ({ title, orders, color, children }) => (
  <div className={`flex-1 p-3 bg-slate-800/50 rounded-lg min-w-[300px]`}>
    <div className="flex items-center mb-4">
      <div className={`w-3 h-3 rounded-full mr-3 ${color}`}></div>
      <h3 className="font-semibold text-white">{title}</h3>
      <span className="ml-2 text-sm text-slate-400 bg-slate-700 rounded-full px-2 py-0.5">{orders.length}</span>
    </div>
    <div className="space-y-3 h-full overflow-y-auto">
      {children}
    </div>
  </div>
);

const OrderKanbanView = ({ orders, updateOrder, updateOrderStatus, parts, suppliers, user, facilities }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const columns = {
    'Pending Approval': orders.filter(o => o.status === 'Pending Approval'),
    'Approved': orders.filter(o => o.status === 'Approved'),
    'Quote Requested': orders.filter(o => o.status === 'Quote Requested'),
    'Ordered': orders.filter(o => o.status === 'Ordered'),
    'Delivered': orders.filter(o => o.status === 'Delivered'),
    'Rejected': orders.filter(o => o.status === 'Rejected'),
  };

  const handleCardClick = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleUpdateOrder = (updatedData) => {
    updateOrder(selectedOrder.id, updatedData);
    setSelectedOrder(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        <KanbanColumn title="Pending Approval" orders={columns['Pending Approval']} color="bg-yellow-400">
          {columns['Pending Approval'].map(order => <OrderCard key={order.id} order={order} onClick={() => handleCardClick(order)} />)}
        </KanbanColumn>
        <KanbanColumn title="Approved" orders={columns['Approved']} color="bg-blue-400">
          {columns['Approved'].map(order => <OrderCard key={order.id} order={order} onClick={() => handleCardClick(order)} />)}
        </KanbanColumn>
        <KanbanColumn title="Quote Requested" orders={columns['Quote Requested']} color="bg-cyan-400">
          {columns['Quote Requested'].map(order => <OrderCard key={order.id} order={order} onClick={() => handleCardClick(order)} />)}
        </KanbanColumn>
        <KanbanColumn title="Ordered" orders={columns['Ordered']} color="bg-purple-400">
          {columns['Ordered'].map(order => <OrderCard key={order.id} order={order} onClick={() => handleCardClick(order)} />)}
        </KanbanColumn>
        <KanbanColumn title="Delivered" orders={columns['Delivered']} color="bg-green-400">
          {columns['Delivered'].map(order => <OrderCard key={order.id} order={order} onClick={() => handleCardClick(order)} />)}
        </KanbanColumn>
        <KanbanColumn title="Rejected" orders={columns['Rejected']} color="bg-red-400">
          {columns['Rejected'].map(order => <OrderCard key={order.id} order={order} onClick={() => handleCardClick(order)} />)}
        </KanbanColumn>
      </div>
      {selectedOrder && (
        <OrderDetailModal
          isOpen={!!selectedOrder}
          onClose={handleCloseModal}
          order={selectedOrder}
          onUpdate={handleUpdateOrder}
          onUpdateStatus={updateOrderStatus}
          parts={parts}
          suppliers={suppliers}
          user={user}
          facilities={facilities}
        />
      )}
    </>
  );
};

export default OrderKanbanView;