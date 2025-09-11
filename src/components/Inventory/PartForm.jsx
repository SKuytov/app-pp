import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Image as ImageIcon, Trash2, Building2, Calculator, TrendingUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Label } from '@/components/ui/label';

const FileUploader = ({ onFileSelect, initialFileUrl, fileType }) => {
  const [preview, setPreview] = useState(initialFileUrl);
  const [fileName, setFileName] = useState(initialFileUrl ? initialFileUrl.split('/').pop() : '');

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
      } else {
        setPreview(null);
      }
      setFileName(file.name);
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
      className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
        isDragActive ? 'border-blue-400 bg-blue-50/10' : 'border-slate-600 hover:border-slate-400'
      }`}
    >
      <input {...getInputProps()} />
      {fileName ? (
        <div className="text-center">
          {preview && <img src={preview} alt="Preview" className="mx-auto mb-2 h-20 w-20 object-cover rounded" />}
          {!preview && <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-400" />}
          <p className="text-slate-200 font-medium">{fileName}</p>
          <p className="text-slate-400 text-sm mt-1">Drop a new file or click to replace.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="mt-2 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <UploadCloud className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="text-slate-200 font-medium">Upload {fileType}</p>
          <p className="text-slate-400 text-sm mt-1">Drag & drop or click to browse</p>
        </div>
      )}
    </div>
  );
};

const PartForm = ({ onSubmit, onCancel, title, initialData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currency } = useCurrency();
  const [formData, setFormData] = useState({
    name: '', 
    part_number: '', 
    supplier_id: '',          // NEW: Separate supplier ID field
    supplier: '',             // Supplier name (existing field)
    main_group: '', 
    sub_group: '',
    quantity: '', 
    min_stock: '', 
    price: '', 
    location: '', 
    criticality: 'C',
    // NEW: Weekly/Monthly consumption fields
    weekly_usage: '',
    monthly_usage: '',
    lead_time_weeks: '',
    safety_stock: '',
    image_url: '', 
    cad_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [cadFile, setCadFile] = useState(null);

  // Calculate reorder level automatically for weekly/monthly patterns
  const calculatedReorderLevel = React.useMemo(() => {
    const weeklyUsage = parseFloat(formData.weekly_usage) || 0;
    const monthlyUsage = parseFloat(formData.monthly_usage) || 0;
    const leadTimeWeeks = parseFloat(formData.lead_time_weeks) || 0;
    const safetyStock = parseFloat(formData.safety_stock) || 0;
    
    // Use weekly if available, otherwise convert monthly to weekly
    const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33); // 4.33 weeks per month average
    
    if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
      return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
    }
    return 0;
  }, [formData.weekly_usage, formData.monthly_usage, formData.lead_time_weeks, formData.safety_stock]);

  // Calculate total value
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        className="bg-slate-800/95 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="p-6 border-b border-slate-600">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-slate-300">Part Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter part name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="part_number" className="text-slate-300">Part Number</Label>
                <Input
                  id="part_number"
                  name="part_number"
                  value={formData.part_number}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white font-mono"
                  placeholder="Enter part number (e.g., 100004)"
                  required
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Supplier Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_id" className="text-slate-300">Supplier ID</Label>
                <Input
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white font-mono"
                  placeholder="Enter supplier ID (e.g., 2123071)"
                />
              </div>
              <div>
                <Label htmlFor="supplier" className="text-slate-300">Supplier Name</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter supplier name (e.g., FESTO)"
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="main_group" className="text-slate-300">Main Group</Label>
                <Input
                  id="main_group"
                  name="main_group"
                  value={formData.main_group}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter main group"
                />
              </div>
              <div>
                <Label htmlFor="sub_group" className="text-slate-300">Sub Group</Label>
                <Input
                  id="sub_group"
                  name="sub_group"
                  value={formData.sub_group}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter sub group"
                />
              </div>
              <div>
                <Label htmlFor="criticality" className="text-slate-300">Criticality</Label>
                <select
                  id="criticality"
                  name="criticality"
                  value={formData.criticality}
                  onChange={handleChange}
                  className="w-full p-2 bg-white/10 border border-white/20 text-white rounded-md"
                >
                  <option value="A">A - Critical</option>
                  <option value="B">B - Important</option>
                  <option value="C">C - Standard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory & Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Inventory & Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-slate-300">Current Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="min_stock" className="text-slate-300">Minimum Stock</Label>
                <Input
                  id="min_stock"
                  name="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-slate-300">Price per 1 pcs ({currency})</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>
            
            {/* Total Value Display */}
            {totalValue > 0 && (
              <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                <p className="text-green-300 text-sm">Total Inventory Value</p>
                <p className="text-green-400 text-xl font-bold">
                  {formData.quantity} pcs × {currency} {formData.price} = {currency} {totalValue.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Consumption Pattern & Reorder Level */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Consumption Pattern & Reorder Level
            </h3>
            <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-lg">
              <p className="text-purple-300 text-sm mb-3">Set either weekly OR monthly usage (not both)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="weekly_usage" className="text-slate-300">Weekly Usage (pieces)</Label>
                  <Input
                    id="weekly_usage"
                    name="weekly_usage"
                    type="number"
                    step="0.1"
                    value={formData.weekly_usage}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-slate-400 text-xs mt-1">How many pieces used per week</p>
                </div>
                <div>
                  <Label htmlFor="monthly_usage" className="text-slate-300">Monthly Usage (pieces)</Label>
                  <Input
                    id="monthly_usage"
                    name="monthly_usage"
                    type="number"
                    step="0.1"
                    value={formData.monthly_usage}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-slate-400 text-xs mt-1">How many pieces used per month</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_time_weeks" className="text-slate-300">Lead Time (Weeks)</Label>
                  <Input
                    id="lead_time_weeks"
                    name="lead_time_weeks"
                    type="number"
                    step="0.5"
                    value={formData.lead_time_weeks}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="2"
                    min="0"
                  />
                  <p className="text-slate-400 text-xs mt-1">Weeks from order to delivery</p>
                </div>
                <div>
                  <Label htmlFor="safety_stock" className="text-slate-300">Safety Stock</Label>
                  <Input
                    id="safety_stock"
                    name="safety_stock"
                    type="number"
                    value={formData.safety_stock}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-slate-400 text-xs mt-1">Buffer stock for uncertainties</p>
                </div>
              </div>
            </div>

            {/* Calculated Reorder Level Display */}
            {calculatedReorderLevel > 0 && (
              <div className="bg-orange-900/20 border border-orange-500/30 p-3 rounded-lg">
                <p className="text-orange-300 text-sm">Calculated Reorder Level</p>
                <p className="text-orange-400 text-xl font-bold">
                  {calculatedReorderLevel} pieces
                </p>
                <p className="text-orange-300 text-xs mt-1">
                  Formula: (Usage per week × Lead time weeks) + Safety stock
                </p>
                <p className="text-orange-300 text-xs">
                  Reorder when stock reaches or falls below this level
                </p>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">Location</h3>
            <div>
              <Label htmlFor="location" className="text-slate-300">Storage Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Enter storage location"
              />
            </div>
          </div>

          {/* Files */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-300 block mb-2">Part Image</Label>
                <FileUploader
                  onFileSelect={setImageFile}
                  initialFileUrl={formData.image_url}
                  fileType="image"
                />
              </div>
              <div>
                <Label className="text-slate-300 block mb-2">CAD File</Label>
                <FileUploader
                  onFileSelect={setCadFile}
                  initialFileUrl={formData.cad_url}
                  fileType="CAD file"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-600">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Part'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PartForm;