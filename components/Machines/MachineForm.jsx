import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, UploadCloud, GitBranchPlus, CornerDownRight, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDropzone } from 'react-dropzone';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DrawingUploader = ({ drawingUrl, onFileSelect }) => {
    const [preview, setPreview] = useState(drawingUrl);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            onFileSelect(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [] },
        multiple: false
    });

    useEffect(() => {
        setPreview(drawingUrl);
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [drawingUrl]);

    return (
        <div {...getRootProps()} className={`p-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}>
            <input {...getInputProps()} />
            {preview ? (
                <div className="flex items-center gap-2">
                    <img src={preview} alt="Drawing preview" className="h-12 w-12 object-cover rounded-md border border-slate-600" />
                    <div className="text-xs text-slate-300">
                        <p className="font-semibold">Drawing ready.</p>
                        <p>Drop file to replace.</p>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400">
                    <UploadCloud className="mx-auto h-6 w-6 mb-1" />
                    <p className="text-xs font-semibold">Drop drawing here</p>
                </div>
            )}
        </div>
    );
};

const AssemblyNode = ({ assembly, onUpdate, onAddChild, onDelete, level = 0 }) => {
    return (
        <div className="space-y-2">
            <div className="flex items-start gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                {level > 0 && <CornerDownRight className="h-5 w-5 mt-2 text-slate-500 flex-shrink-0" />}
                <div className="flex-grow p-3 bg-slate-700/50 rounded-lg space-y-3 border border-slate-600/50">
                    <Input 
                        placeholder="Assembly Name"
                        value={assembly.name}
                        onChange={(e) => onUpdate(assembly.id, 'name', e.target.value)}
                        className="bg-slate-800/80 border-slate-600 text-white h-9"
                    />
                    <Textarea 
                        placeholder="Description"
                        value={assembly.description}
                        onChange={(e) => onUpdate(assembly.id, 'description', e.target.value)}
                        className="bg-slate-800/80 border-slate-600 text-white"
                        rows={1}
                    />
                    <DrawingUploader 
                        drawingUrl={assembly.drawing_url}
                        onFileSelect={(file) => onUpdate(assembly.id, 'drawing_file', file)}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => onDelete(assembly.id)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8">
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onAddChild(assembly.id)} className="h-8">
                            <GitBranchPlus className="h-4 w-4 mr-1" /> Add Sub-assembly
                        </Button>
                    </div>
                </div>
            </div>
            {assembly.children && assembly.children.length > 0 && (
                <div className="space-y-2">
                    {assembly.children.map(child => (
                        <AssemblyNode 
                            key={child.id}
                            assembly={child}
                            onUpdate={onUpdate}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const AssemblyTreeEditor = ({ assemblies, setAssemblies }) => {
    const [assemblyToDelete, setAssemblyToDelete] = useState(null);

    const findNodeAndManipulate = (nodes, id, callback) => {
        return nodes.map(node => {
            if (node.id === id) {
                return callback(node);
            }
            if (node.children) {
                const updatedChildren = findNodeAndManipulate(node.children, id, callback);
                if (JSON.stringify(updatedChildren) !== JSON.stringify(node.children)) {
                    return { ...node, children: updatedChildren };
                }
            }
            return node;
        }).filter(Boolean);
    };

    const addRootAssembly = () => {
        setAssemblies(prev => [...prev, { name: '', description: '', drawing_url: '', drawing_file: null, id: `new_${Date.now()}`, children: [] }]);
    };
    
    const addSubAssembly = (parentId) => {
        const newAssembly = { name: '', description: '', drawing_url: '', drawing_file: null, id: `new_${Date.now()}`, children: [] };
        const newTree = findNodeAndManipulate(assemblies, parentId, node => ({
            ...node,
            children: [...(node.children || []), newAssembly]
        }));
        setAssemblies(newTree);
    };
    
    const updateAssembly = (id, field, value) => {
        const newTree = findNodeAndManipulate(assemblies, id, node => ({...node, [field]: value }));
        setAssemblies(newTree);
    };

    const requestDeleteAssembly = (id) => {
        setAssemblyToDelete(id);
    };
    
    const confirmDeleteAssembly = () => {
        if (!assemblyToDelete) return;
        const deleteRecursive = (nodes, targetId) => {
            return nodes.filter(node => {
                if (node.id === targetId) return false;
                if (node.children) {
                    node.children = deleteRecursive(node.children, targetId);
                }
                return true;
            });
        };
        setAssemblies(deleteRecursive(assemblies, assemblyToDelete));
        setAssemblyToDelete(null);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Machine Assembly Structure</h3>
            <div className="p-4 bg-slate-900/50 rounded-lg space-y-4">
                {assemblies.length > 0 ? (
                    assemblies.map(asm => (
                        <AssemblyNode 
                            key={asm.id}
                            assembly={asm}
                            onUpdate={updateAssembly}
                            onAddChild={addSubAssembly}
                            onDelete={requestDeleteAssembly}
                        />
                    ))
                ) : (
                    <p className="text-center text-slate-400 py-4">No assemblies defined. Add one to get started.</p>
                )}
                 <Button variant="outline" onClick={addRootAssembly} className="w-full border-dashed hover:border-solid hover:bg-slate-700/50 mt-4">
                    <Plus className="h-4 w-4 mr-2" /> Add Root Assembly
                </Button>
            </div>
            
            <AlertDialog open={!!assemblyToDelete} onOpenChange={() => setAssemblyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-400"/>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the assembly and all its sub-assemblies.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAssemblyToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteAssembly} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, delete assembly
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


const MachineForm = ({ onSubmit, onCancel, initialData = null, facilities = [], initialAssemblies = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    facility_id: '',
    status: 'Operational',
  });
  
  const [assemblyTree, setAssemblyTree] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || null,
        name: initialData.name || '',
        description: initialData.description || '',
        facility_id: initialData.facility_id || '',
        status: initialData.status || 'Operational',
      });
      
      const buildTree = (assemblies, parentId = null) => {
          return assemblies
              .filter(asm => asm.parent_assembly_id === parentId)
              .map(asm => ({
                  ...asm,
                  drawing_file: null,
                  children: buildTree(assemblies, asm.id)
              }));
      };
      setAssemblyTree(buildTree(initialAssemblies));

    } else {
        setFormData(prev => ({ 
            ...prev, 
            id: null,
            name: '',
            description: '',
            facility_id: facilities.length > 0 ? facilities[0].id : '',
            status: 'Operational',
        }));
        setAssemblyTree([]);
    }
  }, [initialData, facilities, initialAssemblies]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ machineData: formData, assembliesData: assemblyTree });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-white/20 w-full max-w-3xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6">{initialData ? 'Edit Machine' : 'Add New Machine'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Machine Name</label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="bg-white/10 border-white/20 text-white" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Facility</label>
                <Select value={formData.facility_id} onValueChange={(value) => setFormData(prev => ({ ...prev, facility_id: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select a facility" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {(facilities || []).map(facility => (
                      <SelectItem key={facility.id} value={facility.id} className="hover:bg-slate-700">{facility.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    <SelectItem value="Operational" className="hover:bg-slate-700">Operational</SelectItem>
                    <SelectItem value="Needs Maintenance" className="hover:bg-slate-700">Needs Maintenance</SelectItem>
                    <SelectItem value="Offline" className="hover:bg-slate-700">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <AssemblyTreeEditor assemblies={assemblyTree} setAssemblies={setAssemblyTree} />
          
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" disabled={isSubmitting || !formData.facility_id}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : (initialData ? 'Update Machine & Assemblies' : 'Add Machine & Assemblies')}
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

export default MachineForm;