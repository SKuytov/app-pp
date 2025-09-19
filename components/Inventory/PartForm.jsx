import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Loader2, UploadCloud, Image as ImageIcon, Trash2, Building2, Calculator, TrendingUp, X, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';

// 🔧 FIXED: Safe file upload component with proper error handling
const PremiumFileUploader = ({ onFileSelect, initialFileUrl, fileType, icon: Icon }) => {
  const [preview, setPreview] = useState(initialFileUrl);
  const [fileName, setFileName] = useState(initialFileUrl ? initialFileUrl.split('/').pop() : '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles;
      setIsUploading(true);
      setUploadError('');
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        setIsUploading(false);
        return;
      }

      // Validate file type
      const allowedTypes = fileType === 'image' 
        ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        : ['application/pdf', 'application/dwg', 'model/step', 'model/iges'];
      
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        setIsUploading(false);
        return;
      }
      
      setTimeout(() => {
        try {
          onFileSelect(file);
          if (file.type.startsWith('image/')) {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
          } else {
            setPreview(null);
          }
          setFileName(file.name);
          setIsUploading(false);
        } catch (error) {
          console.error('File upload error:', error);
          setUploadError('Failed to process file');
          setIsUploading(false);
        }
      }, 800);
    }
  }, [onFileSelect, fileType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isUploading
  });

  useEffect(() => {
    setPreview(initialFileUrl);
    setFileName(initialFileUrl ? initialFileUrl.split('/').pop() : '');
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [initialFileUrl]);

  const handleRemove = (e) => {
    e.stopPropagation();
    onFileSelect(null);
    setPreview(null);
    setFileName('');
    setUploadError('');
  };

  return (
    <div className="space-y-2">
      <div 
        {...getRootProps()} 
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
          ${isDragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : isUploading 
            ? 'border-gray-400 bg-gray-100 cursor-not-allowed'
            : uploadError
            ? 'border-red-500 bg-red-500/10'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
      >
        <input {...getInputProps()} />
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg" />
        
        <div className="relative text-center">
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : fileName ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <Icon className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-800">{fileName}</p>
                <p className="text-xs text-gray-500">Drop a new file or click to replace</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-800">Upload {fileType}</p>
                <p className="text-sm text-gray-500">
                  {isDragActive ? 'Drop your file here...' : 'Drag & drop or click to browse'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertTriangle className="w-4 h-4" />
          {uploadError}
        </div>
      )}
    </div>
  );
};

// 🚀 FIXED: Enhanced form validation and data handling
const validatePartData = (formData) => {
  const errors = {};
  
  // Required fields validation
  if (!formData.name?.trim()) errors.name = 'Part name is required';
  if (!formData.part_number?.trim()) errors.part_number = 'Part number is required';
  if (formData.quantity === '' || formData.quantity < 0) errors.quantity = 'Valid quantity is required';
  if (formData.price === '' || formData.price < 0) errors.price = 'Valid price is required';
  
  // Data type validation
  const numericFields = ['quantity', 'min_stock', 'price', 'weekly_usage', 'monthly_usage', 'lead_time_weeks', 'safety_stock'];
  numericFields.forEach(field => {
    if (formData[field] !== '' && (isNaN(Number(formData[field])) || Number(formData[field]) < 0)) {
      errors[field] = `${field.replace('_', ' ')} must be a valid positive number`;
    }
  });

  // Business logic validation
  if (formData.min_stock !== '' && formData.quantity !== '' && Number(formData.min_stock) > Number(formData.quantity)) {
    errors.min_stock = 'Minimum stock cannot be higher than current quantity';
  }
  
  // Usage pattern validation
  if (formData.weekly_usage && formData.monthly_usage) {
    errors.usage = 'Please set either weekly OR monthly usage, not both';
  }

  return errors;
};

// 🔧 FIXED: Sanitize data for API submission
const sanitizeFormData = (formData, imageFile, cadFile) => {
  const sanitized = {};
  
  // Convert empty strings to null for optional numeric fields
  const optionalNumericFields = ['min_stock', 'weekly_usage', 'monthly_usage', 'lead_time_weeks', 'safety_stock'];
  
  Object.keys(formData).forEach(key => {
    let value = formData[key];
    
    // Handle empty strings
    if (value === '') {
      sanitized[key] = optionalNumericFields.includes(key) ? null : '';
      return;
    }
    
    // Convert numeric fields
    if (['quantity', 'price', 'min_stock', 'weekly_usage', 'monthly_usage', 'lead_time_weeks', 'safety_stock'].includes(key)) {
      const numValue = Number(value);
      sanitized[key] = isNaN(numValue) ? null : numValue;
    } else {
      sanitized[key] = String(value).trim();
    }
  });

  // Handle files properly - don't include in main data
  // Files should be handled separately in the upload process
  if (imageFile && imageFile !== formData.image_url) {
    sanitized._hasNewImageFile = true;
  }
  
  if (cadFile && cadFile !== formData.cad_url) {
    sanitized._hasNewCadFile = true;
  }

  return sanitized;
};

const WorldBestPartForm = ({ onSubmit, onCancel, title, initialData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '', 
    part_number: '', 
    supplier_id: '',
    supplier: '',
    main_group: '', 
    sub_group: '',
    quantity: '', 
    min_stock: '', 
    price: '', 
    location: '', 
    criticality: 'C',
    weekly_usage: '',
    monthly_usage: '',
    lead_time_weeks: '',
    safety_stock: '',
    image_url: '', 
    cad_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [cadFile, setCadFile] = useState(null);

  // 🔧 FIXED: Safe calculations with error handling
  const calculatedReorderLevel = React.useMemo(() => {
    try {
      const weeklyUsage = parseFloat(formData.weekly_usage) || 0;
      const monthlyUsage = parseFloat(formData.monthly_usage) || 0;
      const leadTimeWeeks = parseFloat(formData.lead_time_weeks) || 0;
      const safetyStock = parseFloat(formData.safety_stock) || 0;
      
      const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
      
      if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
        return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
      }
      return 0;
    } catch (error) {
      console.error('Error calculating reorder level:', error);
      return 0;
    }
  }, [formData.weekly_usage, formData.monthly_usage, formData.lead_time_weeks, formData.safety_stock]);

  const totalValue = React.useMemo(() => {
    try {
      const quantity = parseFloat(formData.quantity) || 0;
      const price = parseFloat(formData.price) || 0;
      return quantity * price;
    } catch (error) {
      console.error('Error calculating total value:', error);
      return 0;
    }
  }, [formData.quantity, formData.price]);

  useEffect(() => {
    if (initialData) {
      const safeInitialData = {};
      Object.keys(formData).forEach(key => {
        safeInitialData[key] = initialData[key] !== undefined ? String(initialData[key]) : '';
      });
      
      if (initialData.id) safeInitialData.id = initialData.id;
      
      setFormData(safeInitialData);
      setImageFile(initialData.image_url);
      setCadFile(initialData.cad_url);
    }
  }, [initialData]);

  // 🚀 FIXED: Enhanced form submission with proper error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const errors = validatePartData(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Validation Error", 
        description: "Please fix the form errors before submitting." 
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize data for API
      const sanitizedData = sanitizeFormData(formData, imageFile, cadFile);
      
      // Prepare submission data
      const submissionData = {
        ...sanitizedData,
        imageFile: imageFile !== formData.image_url ? imageFile : null,
        cadFile: cadFile !== formData.cad_url ? cadFile : null
      };

      const result = await onSubmit(submissionData);
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      toast({ 
        title: "Success", 
        description: `Part ${initialData ? 'updated' : 'created'} successfully.` 
      });
      
    } catch (error) {
      console.error('Form submission error:', error);
      let errorMessage = 'An unexpected error occurred';
      
      // Handle specific error types
      if (error.message?.includes('duplicate')) {
        errorMessage = 'A part with this part number already exists';
      } else if (error.message?.includes('validation')) {
        errorMessage = 'Please check your input data';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: errorMessage 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const steps = [
    { title: 'Basic Info', icon: '📝', fields: ['name', 'part_number'] },
    { title: 'Supplier', icon: '🏢', fields: ['supplier_id', 'supplier'] },
    { title: 'Inventory', icon: '📦', fields: ['quantity', 'min_stock', 'price'] },
    { title: 'Advanced', icon: '⚙️', fields: ['weekly_usage', 'monthly_usage'] },
    { title: 'Files', icon: '📎', fields: [] }
  ];

  const isStepValid = (step) => {
    const stepFields = steps[step - 1]?.fields || [];
    if (step === 1) return formData.name && formData.part_number && !formErrors.name && !formErrors.part_number;
    if (step === 3) return formData.quantity !== '' && formData.price !== '' && !formErrors.quantity && !formErrors.price;
    return stepFields.every(field => !formErrors[field]);
  };

  const canProceedToNextStep = isStepValid(currentStep);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {title || 'Part Form'}
        </DialogTitle>
        
        <VisuallyHidden>
          <DialogDescription>
            {initialData ? 'Edit existing part details' : 'Create a new part in the inventory system'}
          </DialogDescription>
        </VisuallyHidden>

        {/* Premium Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-blue-100">Step {currentStep} of {steps.length}</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <motion.div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    currentStep > index + 1
                      ? 'bg-green-500 text-white'
                      : currentStep === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {currentStep > index + 1 ? '✓' : step.icon}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-center mt-2 text-sm text-gray-600">
            {steps[currentStep - 1]?.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
                  <p className="text-gray-600">Let's start with the essentials</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Part Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter part name"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="part_number">Part Number *</Label>
                    <Input
                      id="part_number"
                      name="part_number"
                      value={formData.part_number}
                      onChange={handleChange}
                      placeholder="Enter part number"
                      className={formErrors.part_number ? 'border-red-500' : ''}
                    />
                    {formErrors.part_number && <p className="text-sm text-red-600">{formErrors.part_number}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="main_group">Main Group</Label>
                    <Input
                      id="main_group"
                      name="main_group"
                      value={formData.main_group}
                      onChange={handleChange}
                      placeholder="e.g., Electronics"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sub_group">Sub Group</Label>
                    <Input
                      id="sub_group"
                      name="sub_group"
                      value={formData.sub_group}
                      onChange={handleChange}
                      placeholder="e.g., Sensors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="criticality">Criticality</Label>
                    <select
                      id="criticality"
                      name="criticality"
                      value={formData.criticality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A">A - Critical</option>
                      <option value="B">B - Important</option>
                      <option value="C">C - Standard</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Supplier Information */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Supplier Information</h3>
                  <p className="text-gray-600">Connect this part to its supplier</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier ID</Label>
                    <Input
                      id="supplier_id"
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleChange}
                      placeholder="External supplier identifier"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier Name</Label>
                    <Input
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      placeholder="Company or supplier name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Physical location where this part is stored"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Inventory & Pricing */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center">
                    <Calculator className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Inventory & Pricing</h3>
                  <p className="text-gray-600">Set quantities and pricing information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Current Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      className={formErrors.quantity ? 'border-red-500' : ''}
                    />
                    {formErrors.quantity && <p className="text-sm text-red-600">{formErrors.quantity}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">Minimum Stock</Label>
                    <Input
                      id="min_stock"
                      name="min_stock"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.min_stock}
                      onChange={handleChange}
                      placeholder="0"
                      className={formErrors.min_stock ? 'border-red-500' : ''}
                    />
                    {formErrors.min_stock && <p className="text-sm text-red-600">{formErrors.min_stock}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per 1 pcs ({currency}) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={formErrors.price ? 'border-red-500' : ''}
                    />
                    {formErrors.price && <p className="text-sm text-red-600">{formErrors.price}</p>}
                  </div>
                </div>

                {totalValue > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Total Inventory Value</h4>
                    </div>
                    <p className="text-blue-700 mt-1">
                      {formData.quantity} pcs × {currency} {formData.price} = {currency} {totalValue.toFixed(2)}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Consumption Pattern */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Consumption Pattern</h3>
                  <p className="text-gray-600">Configure reorder level calculations</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">Set either weekly OR monthly usage (not both)</p>
                </div>
                {formErrors.usage && <p className="text-sm text-red-600">{formErrors.usage}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="weekly_usage">Weekly Usage (pieces)</Label>
                      <Input
                        id="weekly_usage"
                        name="weekly_usage"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.weekly_usage}
                        onChange={handleChange}
                        placeholder="Average pieces used per week"
                        className={formErrors.weekly_usage ? 'border-red-500' : ''}
                      />
                      {formErrors.weekly_usage && <p className="text-sm text-red-600">{formErrors.weekly_usage}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthly_usage">Monthly Usage (pieces)</Label>
                      <Input
                        id="monthly_usage"
                        name="monthly_usage"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.monthly_usage}
                        onChange={handleChange}
                        placeholder="Average pieces used per month"
                        className={formErrors.monthly_usage ? 'border-red-500' : ''}
                      />
                      {formErrors.monthly_usage && <p className="text-sm text-red-600">{formErrors.monthly_usage}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lead_time_weeks">Lead Time (Weeks)</Label>
                      <Input
                        id="lead_time_weeks"
                        name="lead_time_weeks"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.lead_time_weeks}
                        onChange={handleChange}
                        placeholder="Weeks from order to delivery"
                        className={formErrors.lead_time_weeks ? 'border-red-500' : ''}
                      />
                      {formErrors.lead_time_weeks && <p className="text-sm text-red-600">{formErrors.lead_time_weeks}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="safety_stock">Safety Stock</Label>
                      <Input
                        id="safety_stock"
                        name="safety_stock"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.safety_stock}
                        onChange={handleChange}
                        placeholder="Buffer stock for uncertainties"
                        className={formErrors.safety_stock ? 'border-red-500' : ''}
                      />
                      {formErrors.safety_stock && <p className="text-sm text-red-600">{formErrors.safety_stock}</p>}
                    </div>
                  </div>
                </div>

                {calculatedReorderLevel > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Calculated Reorder Level</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mt-1">{calculatedReorderLevel} pieces</p>
                    <p className="text-green-600 text-sm">Reorder when stock reaches this level</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: Files */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800">Assets & Files</h3>
                  <p className="text-gray-600">Add images and documentation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Part Image</Label>
                    <PremiumFileUploader
                      fileType="image"
                      icon={ImageIcon}
                      onFileSelect={setImageFile}
                      initialFileUrl={formData.image_url}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>CAD File</Label>
                    <PremiumFileUploader
                      fileType="cad"
                      icon={UploadCloud}
                      onFileSelect={setCadFile}
                      initialFileUrl={formData.cad_url}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between p-6 bg-gray-50 border-t">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNextStep || isSubmitting}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!canProceedToNextStep || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {initialData ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {initialData ? 'Update Part' : 'Create Part'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorldBestPartForm;
