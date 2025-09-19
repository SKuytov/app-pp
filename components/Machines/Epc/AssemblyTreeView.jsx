import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, File } from 'lucide-react';

const buildTree = (assemblies) => {
  const tree = [];
  const map = {};
  assemblies.forEach(asm => {
    map[asm.id] = { ...asm, children: [] };
  });

  assemblies.forEach(asm => {
    if (asm.parent_assembly_id && map[asm.parent_assembly_id]) {
      map[asm.parent_assembly_id].children.push(map[asm.id]);
    } else {
      tree.push(map[asm.id]);
    }
  });

  const sortChildren = (node) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  };

  tree.sort((a,b) => a.name.localeCompare(b.name));
  tree.forEach(sortChildren);
  
  return tree;
};

const AssemblyNode = ({ node, onAssemblySelect, currentAssemblyId, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = node.id === currentAssemblyId;
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    if(hasChildren) {
      setIsOpen(!isOpen);
    }
  }

  const handleSelect = (e) => {
    e.stopPropagation();
    onAssemblySelect(node.id);
  }

  return (
    <div>
      <div 
        onClick={handleSelect}
        className={`flex items-center p-1 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/30' : 'hover:bg-slate-700/50'}`}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        <div className="flex items-center" onClick={handleToggle}>
           {hasChildren ? (
            <ChevronRight 
              className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            />
          ) : <span className="w-4 h-4 flex-shrink-0"></span>}
          {hasChildren ? <Folder className="h-4 w-4 text-blue-400 flex-shrink-0 ml-1" /> : <File className="h-4 w-4 text-slate-400 flex-shrink-0 ml-1" />}
        </div>
        <span className="text-sm truncate flex-1 text-left ml-2">{node.name}</span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map(child => (
              <AssemblyNode 
                key={child.id}
                node={child}
                onAssemblySelect={onAssemblySelect}
                currentAssemblyId={currentAssemblyId}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AssemblyTreeView = ({ assemblies, onAssemblySelect, currentAssemblyId }) => {
  const assemblyTree = useMemo(() => buildTree(assemblies), [assemblies]);

  if (!assemblies || assemblies.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">No assemblies found.</p>;
  }

  return (
    <div className="flex-grow overflow-y-auto space-y-1 pr-1">
      {assemblyTree.map(node => (
        <AssemblyNode 
          key={node.id}
          node={node}
          onAssemblySelect={onAssemblySelect}
          currentAssemblyId={currentAssemblyId}
        />
      ))}
    </div>
  );
};

export default AssemblyTreeView;