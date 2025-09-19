import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, List, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import OrderListView from '@/components/Orders/OrderListView';
import OrderKanbanView from '@/components/Orders/OrderKanbanView';
import OrderForm from '@/components/Orders/OrderForm';
import NonInventoryOrderForm from '@/components/Orders/NonInventoryOrderForm';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OrderManagement = ({ user, orders, parts, suppliers, machines, facilities, cart, updateCart, clearCart, updateOrder, updateOrderStatus, createOrder }) => {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isNonInventoryFormOpen, setIsNonInventoryFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');

  const handleCreateOrder = async (orderData) => {
    const { error } = await createOrder(orderData);
    if (!error) {
      clearCart();
      setIsOrderFormOpen(false);
    }
  };

  const handleCreateNonInventoryOrder = async (orderData) => {
    const { error } = await createOrder({ ...orderData, is_non_inventory: true });
    if (!error) {
      setIsNonInventoryFormOpen(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (user.role === 'admin' || user.role === 'approver' || user.role === 'head_tech') {
      return orders;
    }
    return orders.filter(order => order.facility_id === user.facility_id);
  }, [orders, user]);

  const userMachines = useMemo(() => {
    if (!machines) return [];
    if (user.role === 'admin' || user.role === 'approver' || user.role === 'head_tech') {
        return machines;
    }
    return machines.filter(m => m.facility_id === user.facility_id);
  }, [machines, user]);

  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Order Management</h2>
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList>
              <TabsTrigger value="kanban"><Kanban className="h-4 w-4 mr-2" /> Kanban</TabsTrigger>
              <TabsTrigger value="list"><List className="h-4 w-4 mr-2" /> List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={isNonInventoryFormOpen} onOpenChange={setIsNonInventoryFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Request New Part</Button>
            </DialogTrigger>
            {isNonInventoryFormOpen && (
              <NonInventoryOrderForm
                machines={userMachines}
                onSubmit={handleCreateNonInventoryOrder}
                onCancel={() => setIsNonInventoryFormOpen(false)}
              />
            )}
          </Dialog>
          <Dialog open={isOrderFormOpen} onOpenChange={setIsOrderFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Plus className="mr-2 h-4 w-4" /> Create Order from Cart
              </Button>
            </DialogTrigger>
            {isOrderFormOpen && (
              <OrderForm
                cart={cart}
                updateCart={updateCart}
                machines={userMachines}
                onSubmit={handleCreateOrder}
                onCancel={() => setIsOrderFormOpen(false)}
              />
            )}
          </Dialog>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <OrderKanbanView
          orders={filteredOrders}
          updateOrder={updateOrder}
          updateOrderStatus={updateOrderStatus}
          parts={parts}
          suppliers={suppliers}
          user={user}
          facilities={facilities}
        />
      ) : (
        <OrderListView
          orders={filteredOrders}
          updateOrderStatus={updateOrderStatus}
          user={user}
          facilities={facilities}
        />
      )}
    </motion.div>
  );
};

export default OrderManagement;