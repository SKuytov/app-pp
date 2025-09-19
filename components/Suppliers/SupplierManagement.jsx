import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Star, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import SupplierForm from '@/components/Suppliers/SupplierForm';

const SupplierManagement = ({ suppliers, addSupplier, editSupplier, user }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const openForm = (supplier = null) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingSupplier(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (supplierData) => {
    if (editingSupplier) {
      editSupplier(editingSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }
    closeForm();
  };

  const safeSuppliers = suppliers || [];

  return (
    <motion.div
      key="suppliers"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Supplier Management</h2>
        {user.role === 'admin' && (
          <Button onClick={() => openForm()} className="bg-gradient-to-r from-blue-500 to-purple-600">
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        )}
      </div>
      
      <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {safeSuppliers.map(supplier => (
              <motion.div
                key={supplier.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="p-4 bg-slate-900/50 border-slate-700 flex flex-col h-full hover:border-blue-500/50 transition-colors">
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-white">{supplier.name}</h4>
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <span>{supplier.performance ? supplier.performance.toFixed(1) : 'N/A'}</span>
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                    </div>
                    <p className="text-slate-300">{supplier.contact_person}</p>
                    <p className="text-slate-400 text-sm">{supplier.email}</p>
                    <p className="text-slate-400 text-sm">{supplier.phone}</p>
                  </div>
                  {user.role === 'admin' && (
                    <div className="mt-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openForm(supplier)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {safeSuppliers.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No suppliers found</h3>
              <p className="text-slate-400">Add a new supplier to get started.</p>
            </div>
          )}
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SupplierForm
          onSubmit={handleSubmit}
          onCancel={closeForm}
          title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          initialData={editingSupplier}
        />
      </Dialog>
    </motion.div>
  );
};

export default SupplierManagement;