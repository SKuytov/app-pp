import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';

const AssemblyCard = ({ assembly, onOpenViewer }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
      className="h-full"
    >
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 h-full flex flex-col">
        <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-slate-800">
          <img src={assembly.drawingUrl} alt={assembly.name} className="w-full h-full object-contain" />
        </div>
        
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-white mb-1 truncate">{assembly.name}</h3>
        </div>

        <div className="flex space-x-2 mt-4">
          <Button
            onClick={() => onOpenViewer(assembly)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
          >
            <Wrench className="mr-2 h-4 w-4" /> View Drawing
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default AssemblyCard;