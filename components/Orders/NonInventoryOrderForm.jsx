import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const NonInventoryOrderForm = ({ machines, onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    part_name: '',
    part_number: '',
    quantity: 1,
    machine_id: '',
    priority: 'Normal',
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({
      ...formData,
      machine_id: formData.machine_id === 'none' ? null : formData.machine_id,
    });
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-white">Request New Part</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Part Name</label>
          <Input
            value={formData.part_name}
            onChange={(e) => handleChange('part_name', e.target.value)}
            required
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Part Number (if known)</label>
          <Input
            value={formData.part_number}
            onChange={(e) => handleChange('part_number', e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', parseInt(e.target.value, 10) || 1)}
            min="1"
            required
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Assign to Machine (Optional)</label>
          <Select value={formData.machine_id} onValueChange={(val) => handleChange('machine_id', val)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select a machine" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 text-white">
              <SelectItem value="none" className="hover:bg-slate-700">None</SelectItem>
              {(machines || []).map(machine => (
                <SelectItem key={machine.id} value={machine.id} className="hover:bg-slate-700">{machine.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
          <Select value={formData.priority} onValueChange={(val) => handleChange('priority', val)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 text-white">
              <SelectItem value="Normal" className="hover:bg-slate-700">Normal</SelectItem>
              <SelectItem value="High" className="hover:bg-slate-700">High</SelectItem>
              <SelectItem value="Emergency" className="hover:bg-slate-700">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <DialogFooter className="pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Request'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default NonInventoryOrderForm;