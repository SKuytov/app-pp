import React from 'react';
import { Bot, X } from 'lucide-react';
import { DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EPCViewer from '@/components/Machines/Epc/EPCViewer';

const MachineDetailView = ({ machine, parts, assemblies, hotspots, user, addToCart, onBomUpdate, onClose, movements, recordPartUsage, restockPart, initialPartSelection }) => {
  return (
    <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0">
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Bot className="h-8 w-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">{machine.name}</h2>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <EPCViewer
          machine={machine}
          parts={parts}
          assemblies={assemblies}
          hotspots={hotspots}
          onBomUpdate={onBomUpdate}
          addToCart={addToCart}
          user={user}
          movements={movements}
          recordPartUsage={recordPartUsage}
          restockPart={restockPart}
          initialPartSelection={initialPartSelection}
        />
      </div>
    </DialogContent>
  );
};

export default MachineDetailView;