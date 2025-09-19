// hooks/useInventoryData.js
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { filterParts, calculateStats, sortParts } from '../utils/inventoryUtils';

export const useInventoryData = (initialParts = [], initialFilters = {}) => {
  // Core state
  const [parts, setParts] = useState(initialParts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainGroup, setSelectedMainGroup] = useState('');
  const [selectedSubGroup, setSelectedSubGroup] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('inventory');
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered and sorted parts
  const processedParts = useMemo(() => {
    let filtered = filterParts(parts, debouncedSearchTerm, selectedMainGroup, selectedSubGroup);
    
    // Apply tab-specific filtering
    if (activeTab === 'reorder') {
      filtered = filtered.filter(part => {
        const reorderLevel = calculateReorderLevel(part);
        return part.quantity <= reorderLevel;
      });
    } else if (activeTab === 'lowstock') {
      filtered = filtered.filter(part => part.quantity <= (part.min_stock || 0));
    } else if (activeTab === 'outofstock') {
      filtered = filtered.filter(part => part.quantity === 0);
    }
    
    return sortParts(filtered, sortBy, sortOrder);
  }, [parts, debouncedSearchTerm, selectedMainGroup, selectedSubGroup, activeTab, sortBy, sortOrder]);

  // Memoized statistics
  const stats = useMemo(() => calculateStats(parts), [parts]);

  // Memoized groups for filters
  const { mainGroups, subGroups } = useMemo(() => {
    const mainGroupsSet = new Set();
    const subGroupsMap = new Map();

    parts.forEach(part => {
      if (part.main_group) {
        mainGroupsSet.add(part.main_group);
        
        if (part.sub_group) {
          if (!subGroupsMap.has(part.main_group)) {
            subGroupsMap.set(part.main_group, new Set());
          }
          subGroupsMap.get(part.main_group).add(part.sub_group);
        }
      }
    });

    return {
      mainGroups: Array.from(mainGroupsSet).sort(),
      subGroups: selectedMainGroup ? Array.from(subGroupsMap.get(selectedMainGroup) || []).sort() : []
    };
  }, [parts, selectedMainGroup]);

  // Optimized event handlers
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleMainGroupChange = useCallback((value) => {
    setSelectedMainGroup(value);
    setSelectedSubGroup(''); // Reset sub group when main group changes
  }, []);

  const handleSubGroupChange = useCallback((value) => {
    setSelectedSubGroup(value);
  }, []);

  const handleSortChange = useCallback((field, order = 'asc') => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedMainGroup('');
    setSelectedSubGroup('');
  }, []);

  // Batch update parts for better performance
  const updateParts = useCallback((updates) => {
    setParts(currentParts => {
      if (Array.isArray(updates)) {
        // Batch update
        const updateMap = new Map(updates.map(update => [update.id, update]));
        return currentParts.map(part => {
          const update = updateMap.get(part.id);
          return update ? { ...part, ...update } : part;
        });
      } else {
        // Single update
        return currentParts.map(part => 
          part.id === updates.id ? { ...part, ...updates } : part
        );
      }
    });
  }, []);

  // Add new part
  const addPart = useCallback((newPart) => {
    setParts(currentParts => [...currentParts, { ...newPart, id: newPart.id || Date.now() }]);
  }, []);

  // Remove part
  const removePart = useCallback((partId) => {
    setParts(currentParts => currentParts.filter(part => part.id !== partId));
  }, []);

  // Bulk operations
  const bulkUpdateQuantities = useCallback((quantityUpdates) => {
    const updates = quantityUpdates.map(({ id, quantity }) => ({ id, quantity }));
    updateParts(updates);
  }, [updateParts]);

  return {
    // State
    parts: processedParts,
    allParts: parts,
    stats,
    isLoading,
    
    // Filters
    searchTerm,
    selectedMainGroup,
    selectedSubGroup,
    mainGroups,
    subGroups,
    sortBy,
    sortOrder,
    activeTab,
    
    // Actions
    handleSearchChange,
    handleMainGroupChange,
    handleSubGroupChange,
    handleSortChange,
    handleTabChange,
    clearFilters,
    updateParts,
    addPart,
    removePart,
    bulkUpdateQuantities,
    setIsLoading,
    
    // Computed
    hasFilters: searchTerm || selectedMainGroup || selectedSubGroup,
    isEmpty: processedParts.length === 0,
    totalCount: parts.length,
    filteredCount: processedParts.length
  };
};