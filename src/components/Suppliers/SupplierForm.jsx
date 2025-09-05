import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const SupplierForm = ({ onSubmit, onCancel, title, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        contact_person: initialData.contact_person || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Supplier Name</label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
            className="bg-white/10 border-white/20 text-white" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Contact Person</label>
          <Input 
            value={formData.contact_person} 
            onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))} 
            className="bg-white/10 border-white/20 text-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
          <Input 
            type="tel"
            value={formData.phone} 
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} 
            className="bg-white/10 border-white/20 text-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <Input 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
            className="bg-white/10 border-white/20 text-white" 
          />
        </div>
        <DialogFooter>
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600">
            {initialData ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default SupplierForm;