import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Search, ChevronsRight } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import InteractiveDrawingViewer from './InteractiveDrawingViewer';
import AssemblyCard from './AssemblyCard';
import AssemblyForm from './AssemblyForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AssembliesTab = ({ assemblies, parts, user, onQuickOrder, onAddAssembly, onUpdateAssembly, mainGroups }) => {
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainGroup, setSelectedMainGroup] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState('all');
  const { toast } = useToast();

  const subGroups = useMemo(() => {
    if (selectedMainGroup === 'all') return [];
    const uniqueSubGroups = [...new Set(assemblies.filter(a => a.mainGroup === selectedMainGroup).map(a => a.subGroup))];
    return ['all', ...uniqueSubGroups];
  }, [assemblies, selectedMainGroup]);
  
  const filteredAssemblies = useMemo(() => assemblies.filter(assembly => {
    const matchesSearch = assembly.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMainGroup = selectedMainGroup === 'all' || assembly.mainGroup === selectedMainGroup;
    const matchesSubGroup = selectedSubGroup === 'all' || assembly.subGroup === selectedSubGroup;

    return matchesSearch && matchesMainGroup && (selectedMainGroup === 'all' || matchesSubGroup);
  }), [assemblies, searchTerm, selectedMainGroup, selectedSubGroup]);

  const handleOpenViewer = (assembly) => {
    setSelectedAssembly(assembly);
  };

  const handleCloseViewer = () => {
    setSelectedAssembly(null);
  };

  const handleSaveAssembly = (assemblyData) => {
    onAddAssembly(assemblyData);
    setIsFormOpen(false);
    toast({ title: "✅ Assembly Created", description: `${assemblyData.name} has been added.` });
  };

  return (
    <motion.div
      key="assemblies"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Search assemblies..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedMainGroup} onValueChange={setSelectedMainGroup}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Main Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Main Groups</SelectItem>
              {mainGroups.map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedMainGroup !== 'all' && subGroups.length > 1 && (
            <>
              <ChevronsRight className="self-center"/>
              <Select value={selectedSubGroup} onValueChange={setSelectedSubGroup}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sub Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Groups</SelectItem>
                  {subGroups.filter(g=>g!=='all').map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        {user.role === 'manager' && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Assembly
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssemblies.map(assembly => (
          <AssemblyCard key={assembly.id} assembly={assembly} onOpenViewer={handleOpenViewer} />
        ))}
      </div>

      {filteredAssemblies.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No assemblies found</h3>
          <p className="text-gray-300">Try adjusting your search filters.</p>
        </div>
      )}

      <Dialog open={!!selectedAssembly} onOpenChange={(isOpen) => !isOpen && handleCloseViewer()}>
        {selectedAssembly && (
          <InteractiveDrawingViewer
            assembly={selectedAssembly}
            partsList={parts}
            onClose={handleCloseViewer}
            user={user}
            onQuickOrder={onQuickOrder}
            onUpdateAssembly={onUpdateAssembly}
          />
        )}
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        {isFormOpen && (
          <AssemblyForm
            onSubmit={handleSaveAssembly}
            onCancel={() => setIsFormOpen(false)}
            partsList={parts}
            mainGroups={mainGroups}
          />
        )}
      </Dialog>
    </motion.div>
  );
};

export default AssembliesTab;