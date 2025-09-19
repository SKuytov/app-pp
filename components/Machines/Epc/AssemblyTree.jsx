import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, File } from 'lucide-react';

const AssemblyNode = ({ node, onSelect, currentAssemblyId, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(level < 1); // Auto-expand first level
    const hasChildren = node.children && node.children.length > 0;

    const handleToggle = (e) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsOpen(!isOpen);
        }
        onSelect(node);
    };

    const handleSelect = (e) => {
        e.stopPropagation();
        onSelect(node);
    };

    return (
        <div className="text-sm">
            <div 
                onClick={handleSelect}
                className={`flex items-center p-1.5 rounded-md cursor-pointer transition-colors
                    ${currentAssemblyId === node.id ? 'bg-blue-500/20 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`}
                style={{ paddingLeft: `${level * 16 + 4}px` }}
            >
                {hasChildren ? (
                    <ChevronRight 
                        className={`h-4 w-4 mr-1 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
                        onClick={handleToggle}
                    />
                ) : (
                    <div className="w-5 mr-1 flex-shrink-0" />
                )}
                {hasChildren ? <Folder className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" /> : <File className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />}
                <span className="truncate">{node.name}</span>
            </div>
            <AnimatePresence initial={false}>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        {node.children.map(child => (
                            <AssemblyNode 
                                key={child.id} 
                                node={child} 
                                onSelect={onSelect} 
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

const AssemblyTree = ({ tree, onSelectAssembly, currentAssemblyId }) => {
    return (
        <div className="bg-slate-800/50 rounded-lg h-full overflow-y-auto p-2">
            <h3 className="text-lg font-semibold text-white p-2 mb-2">Assembly Explorer</h3>
            <div className="space-y-1">
                {tree.map(rootNode => (
                    <AssemblyNode 
                        key={rootNode.id} 
                        node={rootNode} 
                        onSelect={onSelectAssembly} 
                        currentAssemblyId={currentAssemblyId}
                    />
                ))}
            </div>
        </div>
    );
};

export default AssemblyTree;