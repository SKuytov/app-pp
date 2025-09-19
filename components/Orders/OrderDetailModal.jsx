import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Edit, Save, Calendar, Truck, FileText, HardHat, Building, MessageSquare, UploadCloud, Package, AlertTriangle, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';

const DetailRow = ({ icon, label, value, isEditing, onUpdate, field, type = 'text', options = [], currencyInfo = null }) => {
  const Icon = icon;
  const formattedValue = type === 'date' && value ? format(parseISO(value), 'yyyy-MM-dd') : value;

  const displayValue = () => {
    if (value === null || value === undefined) return 'N/A';
    if (type === 'date') return format(parseISO(value), 'MMM d, yyyy');
    if (currencyInfo) {
      return `${currencyInfo.symbol || ''}${(+value).toFixed(2)}${currencyInfo.code && !currencyInfo.symbol ? ` ${currencyInfo.code}` : ''}`;
    }
    return value;
  };

  return (
    <div className="flex items-center py-2 border-b border-slate-700/50">
      <Icon className="h-4 w-4 mr-3 text-slate-400" />
      <span className="w-1/3 text-slate-300 font-medium">{label}</span>
      {isEditing && (type === 'select' ? (
        <Select onValueChange={(val) => onUpdate(field, val)} defaultValue={String(value)}>
          <SelectTrigger className="w-2/3 bg-slate-700 border-slate-600 text-white h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            {options.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={formattedValue || ''}
          onChange={(e) => onUpdate(field, e.target.value)}
          className="w-2/3 bg-slate-700 border-slate-600 text-white h-8"
        />
      ))}
      {!isEditing && <span className="w-2/3 text-white">{displayValue()}</span>}
    </div>
  );
};

const OrderDetailModal = ({ isOpen, onClose, order, onUpdate, onUpdateStatus, suppliers, user, facilities }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(order);
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const { currency } = useCurrency();

  useEffect(() => {
    setEditedOrder(order);
  }, [order]);

  const handleUpdateField = (field, value) => {
    setEditedOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(editedOrder);
    setIsEditing(false);
    toast({ title: "✅ Order Updated", description: "The order details have been saved." });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const updatedOrder = {
          ...editedOrder,
          quotation_pdf: reader.result,
          quotation_status: 'pending',
          quotation_filename: file.name,
        };
        setEditedOrder(updatedOrder);
        onUpdate(updatedOrder);
        toast({ title: "📄 Quotation Uploaded", description: `${file.name} is now attached to the order.` });
      };
    } else {
      toast({ variant: "destructive", title: "Invalid File", description: "Please upload a valid PDF file." });
    }
  };

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));
  const statusOptions = [
    { value: 'Pending Approval', label: 'Pending Approval' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Quote Requested', label: 'Quote Requested' },
    { value: 'Ordered', label: 'Ordered' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  const isMultiItem = order.items && order.items.length > 0;
  const isNonInventory = order.is_non_inventory;
  const partName = isNonInventory ? order.part_name : (isMultiItem ? `${order.items[0].part_name} (+${order.items.length - 1} more)` : 'Unknown Item');
  const partNumber = isNonInventory ? order.part_number : (isMultiItem ? `Multiple items` : 'N/A');
  const facilityName = facilities.find(f => f.id === order.facility_id)?.name || 'N/A';

  const canManage = user.role === 'admin' || user.role === 'approver' || user.role === 'head_tech';
  const canApprove = user.role === 'admin' || user.role === 'approver';
  
  const currencyInfo = {
    symbol: currency === 'USD' ? '$' : null,
    code: currency === 'BGN' ? 'BGN' : null,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/20 w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">{partName}</h2>
            <p className="text-sm text-slate-400">{partNumber}</p>
          </div>
          <div className="flex items-center space-x-2">
            {canManage && (isEditing ? (
              <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-2" />Save</Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} size="sm"><Edit className="h-4 w-4 mr-2" />Edit</Button>
            ))}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></Button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-6 text-sm">
          {isMultiItem && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg text-white mb-4 flex items-center"><Package className="h-5 w-5 mr-2" /> Ordered Items</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md">
                    <div>
                      <p className="text-white font-medium">{item.part_name}</p>
                      <p className="text-xs text-slate-400">{item.part_number || 'Non-inventory item'}</p>
                    </div>
                    <p className="text-white font-bold">Qty: {item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isNonInventory && (
             <div className="mb-6 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                    <h4 className="font-semibold text-yellow-300">Non-Inventory Request</h4>
                    <p className="text-yellow-400/80 text-xs">This part is not tracked in the inventory. Details are based on the request.</p>
                </div>
            </div>
          )}

          <h3 className="font-semibold text-lg text-white mb-4">Order Details</h3>
          <div className="space-y-1">
            <DetailRow icon={HardHat} label="Requester" value={editedOrder.requested_by_name} />
            <DetailRow icon={Building} label="Facility" value={facilityName} />
            <DetailRow icon={MessageSquare} label="Notes" value={editedOrder.notes} isEditing={isEditing} onUpdate={handleUpdateField} field="notes" />
            <DetailRow icon={Calendar} label="Request Date" value={editedOrder.created_at} />
          </div>

          <h3 className="font-semibold text-lg text-white mt-6 mb-4">Fulfillment Details</h3>
          <div className="space-y-1">
            <DetailRow icon={Truck} label="Status" value={editedOrder.status} isEditing={isEditing && canManage} onUpdate={handleUpdateField} field="status" type="select" options={statusOptions} />
            <DetailRow icon={Truck} label="Supplier" value={editedOrder.supplier_id ? suppliers.find(s => String(s.id) === String(editedOrder.supplier_id))?.name : 'N/A'} isEditing={isEditing && canManage} onUpdate={handleUpdateField} field="supplier_id" type="select" options={supplierOptions} />
            <DetailRow icon={() => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>} label="Price/Unit" value={editedOrder.price_per_unit} isEditing={isEditing && canManage} onUpdate={handleUpdateField} field="price_per_unit" type="number" currencyInfo={currencyInfo} />
            <DetailRow icon={FileText} label="Invoice #" value={editedOrder.invoice} isEditing={isEditing && canManage} onUpdate={handleUpdateField} field="invoice" />
            <DetailRow icon={Calendar} label="Expected Delivery" value={editedOrder.expected_delivery} isEditing={isEditing && canManage} onUpdate={handleUpdateField} field="expected_delivery" type="date" />
            <DetailRow icon={Calendar} label="Actual Delivery" value={editedOrder.actual_delivery} isEditing={isEditing && canManage} onUpdate={handleUpdateField} field="actual_delivery" type="date" />
          </div>

          {canManage && ['Approved', 'Quote Requested'].includes(order.status) && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg text-white mb-4">Quotation</h3>
              {order.quotation_pdf ? (
                <div className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                  <p className="text-white">{order.quotation_filename}</p>
                  <p className={`text-sm font-bold ${
                    order.quotation_status === 'approved' ? 'text-green-400' :
                    order.quotation_status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {order.quotation_status.charAt(0).toUpperCase() + order.quotation_status.slice(1)}
                  </p>
                </div>
              ) : (
                <>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                  <Button onClick={() => fileInputRef.current.click()} variant="outline" className="w-full">
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Upload Quotation PDF
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        {canApprove && order.status === 'Pending Approval' && (
          <div className="p-4 border-t border-white/10 flex justify-end gap-2">
            <Button variant="destructive" onClick={() => onUpdateStatus(order.id, 'Rejected')}><Ban className="h-4 w-4 mr-2" /> Reject</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(order.id, 'Approved')}><Check className="h-4 w-4 mr-2" /> Approve</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OrderDetailModal;