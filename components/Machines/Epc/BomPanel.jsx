import React, { useState } from 'react';
import { PlusCircle, Search, CheckCircle, AlertCircle, Trash2, ChevronsRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const BomPanel = ({
  currentAssembly,
  bom,
  isEditMode,
  onItemClick,
  onItemInfoClick,
  onRemoveHotspot,
  onAddPartClick,
  selectedHotspotId,
  selectedItemToPlace,
  onItemHover,
}) => {
  const [bomSearchTerm, setBomSearchTerm] = useState('');

  const filteredBom = bom.filter(item => {
    if (!item.details) return false;
    const term = bomSearchTerm.toLowerCase();
    return (item.item_number && item.item_number.toLowerCase().includes(term)) ||
           (item.details.name && item.details.name.toLowerCase().includes(term)) ||
           (item.details.part_number && item.details.part_number.toLowerCase().includes(term));
  });

  return (
    <div className="flex-grow w-1/3 flex flex-col gap-4 overflow-hidden">
      <div className="bg-slate-800/50 rounded-lg overflow-y-auto flex-1 flex flex-col">
        <div className="p-3 sticky top-0 bg-slate-800/80 backdrop-blur-sm z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white truncate">{currentAssembly.name} BOM</h3>
            {isEditMode && (
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={onAddPartClick}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Part
                </Button>
              </DialogTrigger>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search BOM..."
              value={bomSearchTerm}
              onChange={e => setBomSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
        <ul className="divide-y divide-slate-700 flex-1 overflow-y-auto" onMouseLeave={() => onItemHover(null)}>
          {filteredBom.length === 0 && <li className="p-4 text-center text-slate-400">No parts found.</li>}
          {filteredBom.map(item => (
            <li
              key={item.id}
              onClick={() => onItemClick(item)}
              onMouseEnter={() => onItemHover(item.id)}
              className={`p-3 flex items-center justify-between transition-colors duration-150 cursor-pointer
                ${selectedHotspotId === item.id ? 'bg-blue-500/30' : 'hover:bg-slate-700/50'}
                ${selectedItemToPlace?.hotspotId === item.id && isEditMode ? 'bg-yellow-500/30' : ''}`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Badge className="text-sm flex-shrink-0 w-12 justify-center">{item.item_number}</Badge>
                <div className="overflow-hidden">
                  <p className="font-medium text-white truncate">{item.details.name}</p>
                  {item.type === 'part' && <p className="text-xs text-slate-400 truncate">{item.details.part_number}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {item.x_position >= 0 ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.x_position >= 0 ? 'Positioned on drawing' : 'Not positioned'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isEditMode ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the item "{item.details.name}" from the BOM.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => {e.stopPropagation(); onRemoveHotspot(item.id);}}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={(e) => { e.stopPropagation(); item.type === 'part' ? onItemInfoClick(item.details) : onItemClick(item); }}>
                    {item.type === 'sub-assembly' ? <ChevronsRight className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BomPanel;