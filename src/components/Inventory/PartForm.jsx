import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCurrency } from '@/contexts/CurrencyContext';

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
    <div {...getRootProps()} className={`relative p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}>
      <input {...getInputProps()} />
      {fileName ? (
        <div className="flex items-center gap-4">
          {preview && <img src={preview} alt="Preview" className="h-12 w-12 object-cover rounded-md" />}
          {!preview && <ImageIcon className="h-12 w-12 text-slate-400" />}
          <div className="text-sm text-slate-300 flex-grow">
            <p className="font-semibold truncate">{fileName}</p>
            <p>Drop a new file or click to replace.</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={handleRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="text-center text-slate-400">
          <UploadCloud className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">Upload {fileType}</p>
          <p className="text-xs">Drag & drop or click to browse</p>
        </div>
      )}
    </div>
  );
};

const PartForm = ({ onSubmit, onCancel, title, initialData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currency } = useCurrency();
  const [formData, setFormData] = useState({
    name: '', part_number: '', main_group: '', sub_group: '',
    quantity: '', min_stock: '', price: '', supplier: '',
    location: '', criticality: 'C',
    image_url: '', cad_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [cadFile, setCadFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || undefined,
        name: initialData.name || '',
        part_number: initialData.part_number || '',
        main_group: initialData.main_group || '',
        sub_group: initialData.sub_group || '',
        quantity: initialData.quantity || '',
        min_stock: initialData.min_stock || '',
        price: initialData.price || '',
        supplier: initialData.supplier || '',
        location: initialData.location || '',
        criticality: initialData.criticality || 'C',
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-white/20 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Part Name</label>
              <Input name="name" value={formData.name} onChange={handleChange} className="bg-white/10 border-white/20 text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Part Number</label>
              <Input name="part_number" value={formData.part_number} onChange={handleChange} className="bg-white/10 border-white/20 text-white" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Main Group</label>
              <Input name="main_group" value={formData.main_group} onChange={handleChange} className="bg-white/10 border-white/20 text-white" placeholder="e.g., Mechanical" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sub Group</label>
              <Input name="sub_group" value={formData.sub_group} onChange={handleChange} className="bg-white/10 border-white/20 text-white" placeholder="e.g., Bearings" required />
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">Criticality</label>
              <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full h-10 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white" required>
                <option value="A" className="bg-slate-800">A - Critical</option>
                <option value="B" className="bg-slate-800">B - Important</option>
                <option value="C" className="bg-slate-800">C - Standard</option>
              </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
              <Input name="quantity" type="number" min="0" value={formData.quantity} onChange={handleChange} className="bg-white/10 border-white/20 text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Min Stock</label>
              <Input name="min_stock" type="number" min="0" value={formData.min_stock} onChange={handleChange} className="bg-white/10 border-white/20 text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price ({currency})</label>
              <Input name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleChange} className="bg-white/10 border-white/20 text-white" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
              <Input name="supplier" value={formData.supplier} onChange={handleChange} className="bg-white/10 border-white/20 text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
              <Input name="location" value={formData.location} onChange={handleChange} className="bg-white/10 border-white/20 text-white" placeholder="e.g., A-1-05" required />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Part Image</label>
              <FileUploader onFileSelect={setImageFile} initialFileUrl={initialData?.image_url} fileType="Image" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">CAD File</label>
              <FileUploader onFileSelect={setCadFile} initialFileUrl={initialData?.cad_url} fileType="CAD File" />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : (initialData ? 'Update Part' : 'Add Part')}
            </Button>
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PartForm;