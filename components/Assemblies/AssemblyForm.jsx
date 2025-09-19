import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AssemblyForm = ({ onSubmit, onCancel, partsList, mainGroups }) => {
  const [name, setName] = useState('');
  const [drawingUrl, setDrawingUrl] = useState('');
  const [selectedMainGroup, setSelectedMainGroup] = useState('');
  const [selectedSubGroup, setSelectedSubGroup] = useState('');
  const [bom, setBom] = useState([{ itemNumber: '', partNumber: '' }]);

  const subGroups = useMemo(() => {
    if (!selectedMainGroup) return [];
    return [...new Set(partsList.filter(p => p.mainGroup === selectedMainGroup).map(p => p.subGroup))];
  }, [partsList, selectedMainGroup]);

  const handleBomChange = (index, field, value) => {
    const newBom = [...bom];
    newBom[index][field] = value;
    setBom(newBom);
  };

  const addBomItem = () => {
    setBom([...bom, { itemNumber: '', partNumber: '' }]);
  };

  const removeBomItem = (index) => {
    const newBom = bom.filter((_, i) => i !== index);
    setBom(newBom);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const assemblyData = {
      name,
      drawingUrl,
      mainGroup: selectedMainGroup,
      subGroup: selectedSubGroup,
      parts: bom.filter(item => item.itemNumber && item.partNumber),
    };
    onSubmit(assemblyData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-white/20 w-full max-w-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Assembly</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}><X/></Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Assembly Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/10 border-white/20 text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Drawing Image URL</label>
            <Input value={drawingUrl} onChange={(e) => setDrawingUrl(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Main Group</label>
              <Select value={selectedMainGroup} onValueChange={setSelectedMainGroup}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{mainGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Sub Group</label>
               <Select value={selectedSubGroup} onValueChange={setSelectedSubGroup} disabled={!selectedMainGroup}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{subGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Bill of Materials (BOM)</h3>
            <div className="space-y-2">
              {bom.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    type="number"
                    placeholder="Item #"
                    value={item.itemNumber}
                    onChange={(e) => handleBomChange(index, 'itemNumber', e.target.value)}
                    className="bg-white/10 border-white/20 text-white w-24"
                  />
                  <select
                    value={item.partNumber}
                    onChange={(e) => handleBomChange(index, 'partNumber', e.target.value)}
                    className="flex-1 h-10 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                  >
                    <option value="" className="bg-slate-800">Select a part...</option>
                    {partsList.map(part => (
                      <option key={part.id} value={part.partNumber} className="bg-slate-800">
                        {part.name} ({part.partNumber})
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeBomItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addBomItem} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
              Save Assembly
            </Button>
            <Button type="button" onClick={onCancel} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AssemblyForm;