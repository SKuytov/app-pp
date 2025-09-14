import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  X,
  MinusCircle,
  PlusCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';

function PartDetailModal({
  isOpen,
  onClose,
  part,
  onEdit,
  onDelete,
  machines,
  recordPartUsage,
  restockPart
}) {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [useQty, setUseQty] = useState(1);
  const [restockQty, setRestockQty] = useState(1);
  const [machine, setMachine] = useState('');

  const { totalValue, healthStatus, healthColor } = useMemo(() => {
    const qty = part.quantity || 0;
    const price = part.price || 0;
    const total = qty * price;
    const min = part.min_stock || 0;
    const status = qty === 0
      ? 'Out'
      : qty <= min
      ? 'Critical'
      : 'OK';
    const color = qty === 0 || qty <= min
      ? 'text-red-400'
      : 'text-green-400';
    return { totalValue: total, healthStatus: status, healthColor: color };
  }, [part.quantity, part.min_stock, part.price]);

  const handleUse = useCallback(async () => {
    if (useQty < 1 || useQty > part.quantity) {
      toast({ variant: 'destructive', title: 'Invalid Qty' });
      return;
    }
    await recordPartUsage(part.id, useQty, machine);
    toast({ title: 'Used', description: `${useQty} removed` });
    setUseQty(1);
    setMachine('');
  }, [useQty, part, recordPartUsage, machine, toast]);

  const handleRestock = useCallback(async () => {
    if (restockQty < 1) {
      toast({ variant: 'destructive', title: 'Invalid Qty' });
      return;
    }
    await restockPart(part.id, restockQty);
    toast({ title: 'Restocked', description: `${restockQty} added` });
    setRestockQty(1);
  }, [restockQty, part, restockPart, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-xl font-bold">{part.name}</h2>
        <Badge className={`mt-2 ${healthColor}`}>{healthStatus}</Badge>
        <p className="mt-2">Total Value: {formatCurrency(totalValue)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              min={1}
              max={part.quantity}
              value={useQty}
              onChange={(e) => setUseQty(Number(e.target.value))}
            />
            <Button onClick={handleUse} className="mt-2">
              <MinusCircle className="w-4 h-4 mr-1" /> Use
            </Button>
          </div>
          <div>
            <Input
              type="number"
              min={1}
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
            />
            <Button onClick={handleRestock} className="mt-2">
              <PlusCircle className="w-4 h-4 mr-1" /> Restock
            </Button>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onEdit(part)}>
            <Edit2 className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => onDelete(part)}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(
  PartDetailModal,
  (prev, next) => prev.part.id === next.part.id
);
