import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Edit, Trash2, Layers, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';

const MachineCard = ({ machine, maintenanceCost, user, onEdit, onDelete, onViewDetails }) => {
    const { formatCurrency } = useCurrency();
    const isAdmin = user.role === 'admin';

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(machine);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(machine);
    };

    const statusStyles = {
        'Running': 'bg-green-500/20 text-green-300 border-green-500/30',
        'Idle': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'Down': 'bg-red-500/20 text-red-300 border-red-500/30',
        'Under Maintenance': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300 flex flex-col group cursor-pointer"
            onClick={onViewDetails}
        >
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <Bot className="h-8 w-8 text-purple-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-white truncate">{machine.name}</h3>
                            <p className="text-xs text-slate-400">{machine.facility_name}</p>
                        </div>
                    </div>
                     <Badge className={`text-xs ${statusStyles[machine.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>{machine.status}</Badge>
                </div>
                
                <p className="text-sm text-slate-400 mb-4 flex-grow min-h-[40px]">{machine.description}</p>
                
                <div className="flex justify-between items-center text-sm mt-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span>Maint. Cost:</span>
                    </div>
                    <span className="font-semibold text-white">{formatCurrency(maintenanceCost)}</span>
                </div>
            </div>
            {isAdmin && (
                <div className="bg-slate-800 p-2 flex justify-end gap-2 border-t border-slate-700">
                    <Button size="sm" variant="ghost" onClick={handleEditClick}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-400 hover:bg-red-500/10" onClick={handleDeleteClick}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

export default MachineCard;