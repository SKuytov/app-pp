import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Image as ImageIcon, Trash2, Building2, Calculator, TrendingUp, X, Sparkles, Zap } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Label } from '@/components/ui/label';

const PremiumFileUploader = ({ onFileSelect, initialFileUrl, fileType, icon: Icon }) => {
  const [preview, setPreview] = useState(initialFileUrl);
  const [fileName, setFileName] = useState(initialFileUrl ? initialFileUrl.split('/').pop() : '');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setIsUploading(true);
      
      setTimeout(() => {
        onFileSelect(file);
        if (file.type.startsWith('image/')) {
          const previewUrl = URL.createObjectURL(file);
          setPreview(previewUrl);
        } else {
          setPreview(null);
        }
        setFileName(file.name);
        setIsUploading(false);
      }, 800);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
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
  };

  return (
    <div
      {...getRootProps()}
      className={`group relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
        isDragActive 
          ? 'border-blue-400 bg-gradient-to-br from-blue-900/20 to-purple-900/20 scale-105' 
          : 'border-slate-600 hover:border-slate-400 hover:bg-slate-700/20'
      }`}
    >
      <input {...getInputProps()} />
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {isUploading ? (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <p className="text-blue-400 font-medium">Uploading...</p>
        </motion.div>
      ) : fileName ? (
        <div className="text-center relative z-10">
          <div className="mb-4">
            {preview ? (
              <img src={preview} alt="Preview" className="mx-auto h-20 w-20 object-cover rounded-xl shadow-lg" />
            ) : (
              <div className="mx-auto w-20 h-20 bg-slate-600/30 rounded-xl flex items-center justify-center">
                <Icon className="w-8 h-8 text-slate-400" />
              </div>
            )}
          </div>
          <p className="text-slate-200 font-medium mb-2">{fileName}</p>
          <p className="text-slate-400 text-sm mb-3">Drop a new file or click to replace</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="text-center relative z-10">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-4"
          >
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-600/30 to-slate-700/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Icon className="w-8 h-8 text-slate-400" />
            </div>
          </motion.div>
          <p className="text-slate-200 font-medium text-lg mb-2">Upload {fileType}</p>
          <p className="text-slate-400 text-sm">
            {isDragActive ? 'Drop your file here...' : 'Drag & drop or click to browse'}
          </p>
        </div>
      )}
    </div>
  );
};

const WorldBestPartForm = ({ onSubmit, onCancel, title, initialData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currency } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);
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

  const calculatedReorderLevel = React.useMemo(() => {
    const weeklyUsage = parseFloat(formData.weekly_usage) || 0;
    const monthlyUsage = parseFloat(formData.monthly_usage) || 0;
    const leadTimeWeeks = parseFloat(formData.lead_time_weeks) || 0;
    const safetyStock = parseFloat(formData.safety_stock) || 0;
    
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);
    
    if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
      return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
    }
    return 0;
  }, [formData.weekly_usage, formData.monthly_usage, formData.lead_time_weeks, formData.safety_stock]);

  const totalValue = React.useMemo(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    return quantity * price;
  }, [formData.quantity, formData.price]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || undefined,
        name: initialData.name || '',
        part_number: initialData.part_number || '',
        supplier_id: initialData.supplier_id || '',
        supplier: initialData.supplier || '',
        main_group: initialData.main_group || '',
        sub_group: initialData.sub_group || '',
        quantity: initialData.quantity || '',
        min_stock: initialData.min_stock || '',
        price: initialData.price || '',
        location: initialData.location || '',
        criticality: initialData.criticality || 'C',
        weekly_usage: initialData.weekly_usage || '',
        monthly_usage: initialData.monthly_usage || '',
        lead_time_weeks: initialData.lead_time_weeks || '',
        safety_stock: initialData.safety_stock || '',
        image_url: initialData.image_url || '',
        cad_url: initialData.cad_url || '',
      });
      setImageFile(initialData.image_url);
      setCadFile(initialData.cad_url);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ ...formData, imageFile, cadFile });
    setIsSubmitting(false);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
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
    if (step === 1) return formData.name && formData.part_number;
    if (step === 3) return formData.quantity !== '' && formData.price !== '';
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-600/50"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Premium Header */}
        <div className="relative p-6 border-b border-slate-600/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {title}
                </h2>
                <p className="text-slate-400 mt-1">Step {currentStep} of {steps.length}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full p-2"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      currentStep > index + 1
                        ? 'bg-green-500 text-white'
                        : currentStep === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {currentStep > index + 1 ? '✓' : step.icon}
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-1 mx-2 transition-all duration-300 ${
                      currentStep > index + 1 ? 'bg-green-500' : 'bg-slate-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-slate-300 font-medium">{steps[currentStep - 1]?.title}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Basic Information</h3>
                  <p className="text-slate-400">Let's start with the essentials</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Part Name *</Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="Enter part name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Part Number *</Label>
                    <Input
                      name="part_number"
                      value={formData.part_number}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white font-mono h-12 text-lg"
                      placeholder="e.g., 100004"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Main Group</Label>
                    <Input
                      name="main_group"
                      value={formData.main_group}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white h-12"
                      placeholder="Category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Sub Group</Label>
                    <Input
                      name="sub_group"
                      value={formData.sub_group}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white h-12"
                      placeholder="Sub-category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Criticality</Label>
                    <select
                      name="criticality"
                      value={formData.criticality}
                      onChange={handleChange}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 text-white rounded-md h-12 text-lg"
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
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Building2 className="w-8 h-8 text-blue-400" />
                    <h3 className="text-2xl font-bold text-white">Supplier Information</h3>
                  </div>
                  <p className="text-slate-400">Connect this part to its supplier</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Supplier ID</Label>
                    <Input
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white font-mono h-12 text-lg"
                      placeholder="e.g., 2123071"
                    />
                    <p className="text-slate-400 text-sm">External supplier identifier</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Supplier Name</Label>
                    <Input
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="e.g., FESTO"
                    />
                    <p className="text-slate-400 text-sm">Company or supplier name</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-lg">Storage Location</Label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                    placeholder="e.g., C3-3, Warehouse A, Shelf 15"
                  />
                  <p className="text-slate-400 text-sm">Physical location where this part is stored</p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Inventory & Pricing */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Calculator className="w-8 h-8 text-green-400" />
                    <h3 className="text-2xl font-bold text-white">Inventory & Pricing</h3>
                  </div>
                  <p className="text-slate-400">Set quantities and pricing information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Current Quantity *</Label>
                    <Input
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Minimum Stock</Label>
                    <Input
                      name="min_stock"
                      type="number"
                      value={formData.min_stock}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-lg">Price per 1 pcs ({currency}) *</Label>
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {totalValue > 0 && (
                  <motion.div 
                    className="p-6 rounded-2xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-center">
                      <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-300 text-lg font-medium mb-2">Total Inventory Value</p>
                      <p className="text-green-400 text-3xl font-bold">
                        {formData.quantity} pcs × {currency} {formData.price} = {currency} {totalValue.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 4: Consumption Pattern */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                    <h3 className="text-2xl font-bold text-white">Consumption Pattern</h3>
                  </div>
                  <p className="text-slate-400">Configure reorder level calculations</p>
                </div>

                <div className="bg-purple-900/10 border border-purple-500/20 p-6 rounded-2xl">
                  <p className="text-purple-300 text-center mb-6">Set either weekly OR monthly usage (not both)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-lg">Weekly Usage (pieces)</Label>
                      <Input
                        name="weekly_usage"
                        type="number"
                        step="0.1"
                        value={formData.weekly_usage}
                        onChange={handleChange}
                        className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-slate-400 text-sm">Average pieces used per week</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-lg">Monthly Usage (pieces)</Label>
                      <Input
                        name="monthly_usage"
                        type="number"
                        step="0.1"
                        value={formData.monthly_usage}
                        onChange={handleChange}
                        className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-slate-400 text-sm">Average pieces used per month</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-lg">Lead Time (Weeks)</Label>
                      <Input
                        name="lead_time_weeks"
                        type="number"
                        step="0.5"
                        value={formData.lead_time_weeks}
                        onChange={handleChange}
                        className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                        placeholder="2"
                        min="0"
                      />
                      <p className="text-slate-400 text-sm">Weeks from order to delivery</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-lg">Safety Stock</Label>
                      <Input
                        name="safety_stock"
                        type="number"
                        value={formData.safety_stock}
                        onChange={handleChange}
                        className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-slate-400 text-sm">Buffer stock for uncertainties</p>
                    </div>
                  </div>
                </div>

                {calculatedReorderLevel > 0 && (
                  <motion.div 
                    className="p-6 rounded-2xl bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <p className="text-orange-300 text-lg font-medium mb-2">Calculated Reorder Level</p>
                      <p className="text-orange-400 text-4xl font-bold mb-2">{calculatedReorderLevel} pieces</p>
                      <p className="text-orange-300 text-sm">Reorder when stock reaches this level</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 5: Files */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Assets & Files</h3>
                  <p className="text-slate-400">Add images and documentation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-slate-300 text-lg">Part Image</Label>
                    <PremiumFileUploader
                      onFileSelect={setImageFile}
                      initialFileUrl={formData.image_url}
                      fileType="image"
                      icon={ImageIcon}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-slate-300 text-lg">CAD File</Label>
                    <PremiumFileUploader
                      onFileSelect={setCadFile}
                      initialFileUrl={formData.cad_url}
                      fileType="CAD file"
                      icon={Building2}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-8 border-t border-slate-600/50 mt-8">
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onCancel}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="border-slate-500/50 hover:border-slate-400"
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep < steps.length ? (
                <Button 
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!isStepValid(currentStep)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isStepValid(currentStep)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Create Part'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default WorldBestPartForm;