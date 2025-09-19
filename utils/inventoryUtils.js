// utils/inventoryUtils.js
import { useMemo } from 'react';

// Memoized calculation for reorder level
export const calculateReorderLevel = (part) => {
  const weeklyUsage = part.weekly_usage || 0;
  const monthlyUsage = part.monthly_usage || 0;
  const leadTimeWeeks = part.lead_time_weeks || 2;
  const safetyStock = part.safety_stock || Math.ceil((part.min_stock || 0) * 0.2);
  const effectiveWeeklyUsage = weeklyUsage || (monthlyUsage / 4.33);

  if (effectiveWeeklyUsage > 0 && leadTimeWeeks > 0) {
    return Math.ceil((effectiveWeeklyUsage * leadTimeWeeks) + safetyStock);
  }
  return part.reorder_level || 0;
};

// Optimized stock status calculation
export const getStockStatus = (part, reorderLevel) => {
  const quantity = part.quantity || 0;
  const minStock = part.min_stock || 0;

  if (quantity === 0) {
    return { label: 'Out', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', priority: 4 };
  }
  if (quantity <= minStock) {
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', priority: 3 };
  }
  if (quantity <= reorderLevel) {
    return { label: 'Reorder', color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/50', priority: 2 };
  }
  return { label: 'Healthy', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/50', priority: 1 };
};

// Fast filtering function
export const filterParts = (parts, searchTerm, selectedMainGroup, selectedSubGroup) => {
  if (!parts || parts.length === 0) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return parts.filter(part => {
    // Search filter
    if (searchTerm && !(
      part.name?.toLowerCase().includes(lowerSearchTerm) ||
      part.part_number?.toLowerCase().includes(lowerSearchTerm) ||
      part.supplier?.toLowerCase().includes(lowerSearchTerm)
    )) {
      return false;
    }
    
    // Main group filter
    if (selectedMainGroup && part.main_group !== selectedMainGroup) {
      return false;
    }
    
    // Sub group filter
    if (selectedSubGroup && part.sub_group !== selectedSubGroup) {
      return false;
    }
    
    return true;
  });
};

// Statistics calculation
export const calculateStats = (parts) => {
  if (!parts || parts.length === 0) {
    return { totalParts: 0, lowStockCount: 0, reorderCount: 0, outOfStockCount: 0 };
  }

  let lowStockCount = 0;
  let reorderCount = 0;
  let outOfStockCount = 0;

  for (const part of parts) {
    const quantity = part.quantity || 0;
    const minStock = part.min_stock || 0;
    const reorderLevel = calculateReorderLevel(part);

    if (quantity === 0) {
      outOfStockCount++;
    } else if (quantity <= minStock) {
      lowStockCount++;
    } else if (quantity <= reorderLevel) {
      reorderCount++;
    }
  }

  return {
    totalParts: parts.length,
    lowStockCount,
    reorderCount,
    outOfStockCount
  };
};

// Batch operations for better performance
export const batchUpdateParts = (parts, updates) => {
  const updateMap = new Map(updates.map(update => [update.id, update]));
  
  return parts.map(part => {
    const update = updateMap.get(part.id);
    return update ? { ...part, ...update } : part;
  });
};

// Sort parts efficiently
export const sortParts = (parts, sortBy = 'name', sortOrder = 'asc') => {
  const sortedParts = [...parts];
  
  sortedParts.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue?.toLowerCase() || '';
    }
    
    if (typeof aValue === 'number') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sortedParts;
};