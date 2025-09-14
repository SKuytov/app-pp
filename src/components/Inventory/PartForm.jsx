import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { partSchema } from '@/utils/validation';

const PartForm = ({
  isOpen,
  onClose,
  onSubmit,
  part = null,
  facilities = [],
  suppliers = [],
  mainGroups = [],
  subGroups = []
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [cadFilePreview, setCadFilePreview] = useState(null);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch,
    clearErrors
  } = useForm({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name: '',
      part_number: '',
      description: '',
      quantity: 0,
      min_stock: 0,
      max_stock: null,
      price: 0.00,
      currency: 'BGN',
      main_group: '',
      sub_group: '',
      criticality: 'C',
      location: '',
      supplier_id: '',
      lead_time_weeks: 1,
      safety_stock: 0,
      weekly_usage: 0,
      monthly_usage: 0
    },
    mode: 'onChange'
  });

  // Watch for main group changes to update sub groups
  const selectedMainGroup = watch('main_group');
  const availableSubGroups = subGroups.filter(sg => 
    selectedMainGroup ? sg.main_group === selectedMainGroup : true
  );

  // Initialize form when part changes
  useEffect(() => {
    if (part) {
      reset({
        ...part,
        max_stock: part.max_stock || null,
        sub_group: part.sub_group || '',
        location: part.location || '',
        supplier_id: part.supplier_id || '',
        description: part.description || ''
      });
      
      if (part.image_url) {
        setImagePreview(part.image_url);
      }
      if (part.cad_url) {
        setCadFilePreview(part.cad_url);
      }
    } else {
      reset();
      setImagePreview(null);
      setCadFilePreview(null);
    }
  }, [part, reset]);

  // Handle form submission
  const onFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Prepare form data including files
      const formData = {
        ...data,
        // Convert empty strings to null
        sub_group: data.sub_group || null,
        location: data.location || null,
        supplier_id: data.supplier_id || null,
        description: data.description || null,
        max_stock: data.max_stock || null
      };

      // Add files if they exist
      const imageFile = document.getElementById('image-upload')?.files[0];
      const cadFile = document.getElementById('cad-upload')?.files[0];

      if (imageFile) {
        formData.imageFile = imageFile;
      }
      if (cadFile) {
        formData.cadFile = cadFile;
      }

      await onSubmit(formData);
      
      toast({
        title: "✅ Success",
        description: `Part ${part ? 'updated' : 'created'} successfully`
      });
      
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: error.message || `Failed to ${part ? 'update' : 'create'} part`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image must be less than 10MB"
        });
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload JPEG, PNG, or WebP images only"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle CAD file upload
  const handleCadUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "CAD file must be less than 10MB"
        });
        return;
      }

      setCadFilePreview(file.name);
    }
  };

  // Get criticality color
  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'A': return 'bg-red-500';
      case 'B': return 'bg-yellow-500';
      case 'C': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {part ? 'Edit Part' : 'Add New Part'}
            {part && (
              <Badge className={`${getCriticalityColor(part.criticality)} text-white`}>
                Class {part.criticality}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-4 bg-slate-700/50 border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Part Name */}
              <div>
                <Label htmlFor="name" className="text-white">Part Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="bg-slate-600 border-slate-500 text-white"
                  placeholder="Enter part name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Part Number */}
              <div>
                <Label htmlFor="part_number" className="text-white">Part Number *</Label>
                <Input
                  id="part_number"
                  {...register('part_number')}
                  className="bg-slate-600 border-slate-500 text-white"
                  placeholder="Enter part number"
                />
                {errors.part_number && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.part_number.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-white resize-none"
                  rows="3"
                  placeholder="Enter part description"
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Inventory & Pricing */}
          <Card className="p-4 bg-slate-700/50 border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Inventory & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quantity */}
              <div>
                <Label htmlFor="quantity" className="text-white">Current Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  {...register('quantity', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
                {errors.quantity && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              {/* Min Stock */}
              <div>
                <Label htmlFor="min_stock" className="text-white">Minimum Stock</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  {...register('min_stock', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
                {errors.min_stock && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.min_stock.message}
                  </p>
                )}
              </div>

              {/* Max Stock */}
              <div>
                <Label htmlFor="max_stock" className="text-white">Maximum Stock</Label>
                <Input
                  id="max_stock"
                  type="number"
                  min="0"
                  {...register('max_stock', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
                {errors.max_stock && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.max_stock.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price" className="text-white">Unit Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
                {errors.price && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div>
                <Label htmlFor="currency" className="text-white">Currency</Label>
                <select
                  id="currency"
                  {...register('currency')}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-white"
                >
                  <option value="BGN">BGN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              {/* Criticality */}
              <div>
                <Label htmlFor="criticality" className="text-white">Criticality</Label>
                <select
                  id="criticality"
                  {...register('criticality')}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-white"
                >
                  <option value="A">A - Critical</option>
                  <option value="B">B - Important</option>
                  <option value="C">C - Standard</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Categories & Location */}
          <Card className="p-4 bg-slate-700/50 border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Categories & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Group */}
              <div>
                <Label htmlFor="main_group" className="text-white">Main Group *</Label>
                <select
                  id="main_group"
                  {...register('main_group')}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-white"
                >
                  <option value="">Select main group</option>
                  {mainGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                {errors.main_group && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.main_group.message}
                  </p>
                )}
              </div>

              {/* Sub Group */}
              <div>
                <Label htmlFor="sub_group" className="text-white">Sub Group</Label>
                <select
                  id="sub_group"
                  {...register('sub_group')}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-white"
                  disabled={!selectedMainGroup}
                >
                  <option value="">Select sub group</option>
                  {availableSubGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-white">Storage Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  className="bg-slate-600 border-slate-500 text-white"
                  placeholder="e.g., Shelf A-1, Warehouse B"
                />
              </div>

              {/* Supplier */}
              <div>
                <Label htmlFor="supplier_id" className="text-white">Preferred Supplier</Label>
                <select
                  id="supplier_id"
                  {...register('supplier_id')}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-white"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Planning Parameters */}
          <Card className="p-4 bg-slate-700/50 border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Planning Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="lead_time_weeks" className="text-white">Lead Time (weeks)</Label>
                <Input
                  id="lead_time_weeks"
                  type="number"
                  min="0"
                  max="52"
                  {...register('lead_time_weeks', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>

              <div>
                <Label htmlFor="safety_stock" className="text-white">Safety Stock</Label>
                <Input
                  id="safety_stock"
                  type="number"
                  min="0"
                  {...register('safety_stock', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>

              <div>
                <Label htmlFor="weekly_usage" className="text-white">Weekly Usage</Label>
                <Input
                  id="weekly_usage"
                  type="number"
                  min="0"
                  {...register('weekly_usage', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>

              <div>
                <Label htmlFor="monthly_usage" className="text-white">Monthly Usage</Label>
                <Input
                  id="monthly_usage"
                  type="number"
                  min="0"
                  {...register('monthly_usage', { valueAsNumber: true })}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>
            </div>
          </Card>

          {/* File Uploads */}
          <Card className="p-4 bg-slate-700/50 border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div>
                <Label className="text-white">Part Image</Label>
                <div className="mt-2">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload').click()}
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Part preview"
                        className="w-full h-32 object-cover rounded-lg border border-slate-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* CAD Upload */}
              <div>
                <Label className="text-white">CAD File</Label>
                <div className="mt-2">
                  <input
                    id="cad-upload"
                    type="file"
                    accept=".dwg,.dxf,.pdf"
                    onChange={handleCadUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('cad-upload').click()}
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Upload CAD File
                  </Button>
                  {cadFilePreview && (
                    <div className="mt-3 p-3 bg-slate-600 rounded-lg">
                      <p className="text-sm text-slate-300 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {cadFilePreview}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Form Validation Status */}
          {Object.keys(errors).length > 0 && (
            <Alert className="border-red-600 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Please fix the validation errors above before submitting.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {part ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {part ? 'Update Part' : 'Create Part'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartForm;