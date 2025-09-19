import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const FacilityManager = ({ facilities, onClose, onSubmit, onDelete }) => {
  const [newFacilityName, setNewFacilityName] = useState('');
  const [editingFacility, setEditingFacility] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingFacility, setDeletingFacility] = useState(null);

  const handleAddFacility = async () => {
    if (!newFacilityName.trim()) return;
    setIsSubmitting(true);
    const { error } = await onSubmit({ name: newFacilityName.trim() }, false);
    if (!error) {
      setNewFacilityName('');
    }
    setIsSubmitting(false);
  };

  const handleUpdateFacility = async () => {
    if (!editingFacility || !editingFacility.name.trim()) return;
    setIsSubmitting(true);
    const { error } = await onSubmit(editingFacility, true);
    if (!error) {
      setEditingFacility(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (facility) => {
    setDeletingFacility(facility);
  };

  const confirmDelete = async () => {
    if (deletingFacility) {
      await onDelete(deletingFacility.id);
      setDeletingFacility(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-white/20 w-full max-w-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Manage Facilities</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New facility name..."
                value={newFacilityName}
                onChange={(e) => setNewFacilityName(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                disabled={isSubmitting}
              />
              <Button onClick={handleAddFacility} disabled={isSubmitting || !newFacilityName.trim()} className="bg-blue-500 hover:bg-blue-600">
                {isSubmitting && !editingFacility ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {facilities.map((facility) => (
                <div key={facility.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                  {editingFacility?.id === facility.id ? (
                    <Input
                      value={editingFacility.name}
                      onChange={(e) => setEditingFacility({ ...editingFacility, name: e.target.value })}
                      className="bg-white/20 border-white/30 text-white"
                      autoFocus
                    />
                  ) : (
                    <span className="text-white">{facility.name}</span>
                  )}
                  <div className="flex gap-1">
                    {editingFacility?.id === facility.id ? (
                      <Button size="sm" onClick={handleUpdateFacility} disabled={isSubmitting} className="bg-green-500 hover:bg-green-600">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setEditingFacility({ ...facility })} className="h-8 w-8 text-white hover:bg-white/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(facility)} className="h-8 w-8 text-red-400 hover:bg-red-500/20">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <Dialog open={!!deletingFacility} onOpenChange={() => setDeletingFacility(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500"/> Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the facility "{deletingFacility?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFacility(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FacilityManager;