import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { partSchema } from '@/utils/validation';

const PartForm = ({ part, onClose, onSubmit }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    description: '',
    quantity: 0,
    min_stock: 0,
    max_stock: '',
    price: 0,
    currency: 'BGN',
    main_group: '',
    sub_group: '',
    criticality: 'C',
    location: '',
    weekly_usage: 0,
    monthly_usage: 0,
    yearly_usage: 0,
    lead_time_weeks: 2,
    safety_stock: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (part) {
      setFormData({
        name: part.name || '',
        part_number: part.part_number || '',
        description: part.description || '',
        quantity: part.quantity || 0,
        min_stock: part.min_stock || 0,
        max_stock: part.max_stock || '',
        price: part.price || 0,
        currency: part.currency || 'BGN',
        main_group: part.main_group || '',
        sub_group: part.sub_group || '',
        criticality: part.criticality || 'C',
        location: part.location || '',
        weekly_usage: part.weekly_usage || 0,
        monthly_usage: part.monthly_usage || 0,
        yearly_usage: part.yearly_usage || 0,
        lead_time_weeks: part.lead_time_weeks || 2,
        safety_stock: part.safety_stock || 0
      });
      setHasUnsavedChanges(false);
    }
  }, [part]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Validate with Zod schema
      const validatedData = partSchema.parse({
        ...formData,
        max_stock: formData.max_stock === '' ? null : Number(formData.max_stock)
      });

      // Add ID if editing
      const submitData = part ? { ...validatedData, id: part.id } : validatedData;
      
      console.log('Submitting part data:', submitData);
      
      const result = await onSubmit(submitData);
      
      if (result && result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: part ? "✅ Part Updated" : "✅ Part Created",
        description: `${validatedData.name} has been ${part ? 'updated' : 'created'} successfully.`,
      });
      
      setHasUnsavedChanges(false);
      onClose();
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error.name === 'ZodError') {
        // Handle Zod validation errors
        const formErrors = {};
        error.errors?.forEach(err => {
          const path = err.path.join('.');
          formErrors[path] = err.message;
        });
        setErrors(formErrors);
        
        toast({
          variant: "destructive",
          title: "❌ Validation Error",
          description: "Please correct the highlighted fields."
        });
      } else if (error.message?.includes('Session expired') || error.message?.includes('Invalid Refresh Token')) {
        // Handle session expiry gracefully
        toast({
          variant: "destructive",
          title: "🔐 Session Expired",
          description: "Please refresh the page and log in again."
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Handle other errors
        toast({
          variant: "destructive",
          title: "❌ Save Failed",
          description: error.message || "An unexpected error occurred while saving the part."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, part, onSubmit, onClose, toast, isSubmitting]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSubmit(e);
        } else if (e.key === 'Escape') {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, handleClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-750">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {part ? 'Edit Part' : 'Create New Part'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {part ? `Editing ${part.name}` : 'Add a new part to your inventory'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(95vh-160px)]">
          <div className="space-y-6">
            
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Part Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                    placeholder="Enter part name"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="part_number" className="text-white">Part Number *</Label>
                  <Input
                    id="part_number"
                    value={formData.part_number}
                    onChange={(e) => handleInputChange('part_number', e.target.value.toUpperCase())}
                    className={errors.part_number ? 'border-red-500' : ''}
                    placeholder="Enter part number"
                  />
                  {errors.part_number && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.part_number}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter part description"
                  rows={3}
                />
              </div>
            </div>

            {/* Stock & Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Stock & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="quantity" className="text-white">Current Stock *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                    className={errors.quantity ? 'border-red-500' : ''}
                  />
                  {errors.quantity && (
                    <p className="text-red-400 text-sm mt-1">{errors.quantity}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="min_stock" className="text-white">Min Stock</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => handleInputChange('min_stock', Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_stock" className="text-white">Max Stock</Label>
                  <Input
                    id="max_stock"
                    type="number"
                    min="0"
                    value={formData.max_stock}
                    onChange={(e) => handleInputChange('max_stock', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="price" className="text-white">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Consumption Patterns */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Consumption Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="weekly_usage" className="text-white">Weekly Usage</Label>
                  <Input
                    id="weekly_usage"
                    type="number"
                    min="0"
                    value={formData.weekly_usage}
                    onChange={(e) => handleInputChange('weekly_usage', Number(e.target.value))}
                    placeholder="Parts used per week"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly_usage" className="text-white">Monthly Usage</Label>
                  <Input
                    id="monthly_usage"
                    type="number"
                    min="0"
                    value={formData.monthly_usage}
                    onChange={(e) => handleInputChange('monthly_usage', Number(e.target.value))}
                    placeholder="Parts used per month"
                  />
                </div>
                
                <div>
                  <Label htmlFor="yearly_usage" className="text-white">Yearly Usage</Label>
                  <Input
                    id="yearly_usage"
                    type="number"
                    min="0"
                    value={formData.yearly_usage}
                    onChange={(e) => handleInputChange('yearly_usage', Number(e.target.value))}
                    placeholder="Parts used per year"
                  />
                </div>
              </div>
            </div>

            {/* Categories & Settings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Categories & Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="main_group" className="text-white">Main Group *</Label>
                  <Input
                    id="main_group"
                    value={formData.main_group}
                    onChange={(e) => handleInputChange('main_group', e.target.value)}
                    className={errors.main_group ? 'border-red-500' : ''}
                    placeholder="e.g., Mechanical"
                  />
                  {errors.main_group && (
                    <p className="text-red-400 text-sm mt-1">{errors.main_group}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="sub_group" className="text-white">Sub Group</Label>
                  <Input
                    id="sub_group"
                    value={formData.sub_group}
                    onChange={(e) => handleInputChange('sub_group', e.target.value)}
                    placeholder="e.g., Bearings"
                  />
                </div>
                
                <div>
                  <Label htmlFor="criticality" className="text-white">Criticality</Label>
                  <Select value={formData.criticality} onValueChange={(value) => handleInputChange('criticality', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Critical</SelectItem>
                      <SelectItem value="B">B - Important</SelectItem>
                      <SelectItem value="C">C - Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Shelf/Bin location"
                  />
                </div>
              </div>
            </div>

            {/* Planning Parameters */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Planning Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_time_weeks" className="text-white">Lead Time (Weeks)</Label>
                  <Input
                    id="lead_time_weeks"
                    type="number"
                    min="0"
                    value={formData.lead_time_weeks}
                    onChange={(e) => handleInputChange('lead_time_weeks', Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="safety_stock" className="text-white">Safety Stock</Label>
                  <Input
                    id="safety_stock"
                    type="number"
                    min="0"
                    value={formData.safety_stock}
                    onChange={(e) => handleInputChange('safety_stock', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-700 bg-slate-750">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {part ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {part ? 'Update Part' : 'Create Part'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartForm;
