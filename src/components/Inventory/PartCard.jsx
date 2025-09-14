import React, { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Edit2,
  Trash2,
  ShoppingCart
} from 'lucide-react';

function PartCard({ part, onEdit, onDelete, onAddToCart, onViewDetails }) {
  const { status, statusColor, statusBg, isOutOfStock } = useMemo(() => {
    const qty = part.quantity || 0;
    const min = part.min_stock || 0;
    const isOut = qty <= 0;
    const isLow = qty <= min;
    const weekly = part.weekly_usage || 0;
    const monthly = part.monthly_usage || 0;
    const effWeekly = weekly || monthly / 4.33;
    const reorderLvl = effWeekly > 0
      ? Math.ceil(effWeekly * (part.lead_time_weeks || 2)
        + (part.safety_stock || Math.ceil(min * 0.2)))
      : 0;
    let st, sc, sb;
    if (isOut) {
      st = 'OUT'; sc = 'text-red-400'; sb = 'bg-red-500/20';
    } else if (isLow) {
      st = 'LOW'; sc = 'text-orange-400'; sb = 'bg-orange-500/20';
    } else if (reorderLvl > 0 && qty <= reorderLvl) {
      st = 'REORDER'; sc = 'text-yellow-400'; sb = 'bg-yellow-500/20';
    } else {
      st = 'OK'; sc = 'text-green-400'; sb = 'bg-green-500/20';
    }
    return { status: st, statusColor: sc, statusBg: sb, isOutOfStock: isOut };
  }, [
    part.quantity,
    part.min_stock,
    part.weekly_usage,
    part.monthly_usage,
    part.lead_time_weeks,
    part.safety_stock
  ]);

  const handleView = useCallback(() => onViewDetails(part), [onViewDetails, part]);
  const handleEditClick = useCallback(e => { e.stopPropagation(); onEdit(part); }, [onEdit, part]);
  const handleDeleteClick = useCallback(e => { e.stopPropagation(); onDelete(part); }, [onDelete, part]);
  const handleAdd = useCallback(e => {
    e.stopPropagation();
    if (!isOutOfStock) onAddToCart(part);
  }, [isOutOfStock, onAddToCart, part]);

  return (
    <div
      onClick={handleView}
      className="cursor-pointer rounded-lg border p-4 hover:shadow"
    >
      <div className="flex justify-between items-center">
        <Badge className={`${statusBg} ${statusColor}`}>{status}</Badge>
        <div className="flex space-x-2">
          <Button size="icon" variant="ghost" onClick={handleEditClick}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleDeleteClick}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <h3 className="mt-2 font-medium">{part.name}</h3>
      <p className="text-sm text-gray-500">{part.part_number}</p>
      <div className="mt-4 flex space-x-2">
        <Button size="icon" variant="outline" onClick={handleAdd}>
          <ShoppingCart className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default memo(
  PartCard,
  (prev, next) =>
    prev.part.id === next.part.id &&
    prev.part.quantity === next.part.quantity
);
