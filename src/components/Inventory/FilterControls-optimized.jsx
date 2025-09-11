// components/FilterControls.jsx
import React, { memo } from 'react';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FilterControls = memo(({
  searchTerm,
  onSearchChange,
  selectedMainGroup,
  onMainGroupChange,
  selectedSubGroup,
  onSubGroupChange,
  mainGroups = [],
  subGroups = [],
  sortBy,
  sortOrder,
  onSortChange,
  onClearFilters,
  hasFilters,
  totalCount,
  filteredCount
}) => {
  const handleSortClick = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newOrder);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
      {/* Search and Clear Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search parts, numbers, or suppliers..."
            className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-200"
          />
        </div>
        
        {hasFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="border-slate-600/50 hover:bg-slate-700/50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters and Sort Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Main Group Filter */}
        <div className="flex items-center gap-2 min-w-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <Select value={selectedMainGroup} onValueChange={onMainGroupChange}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-600/50">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {mainGroups.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub Group Filter */}
        {selectedMainGroup && subGroups.length > 0 && (
          <Select value={selectedSubGroup} onValueChange={onSubGroupChange}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-600/50">
              <SelectValue placeholder="All Subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subcategories</SelectItem>
              {subGroups.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort Controls */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-sm text-slate-400 mr-2">Sort:</span>
          {[
            { key: 'name', label: 'Name' },
            { key: 'quantity', label: 'Stock' },
            { key: 'price', label: 'Price' },
            { key: 'part_number', label: 'Part #' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => handleSortClick(key)}
              variant={sortBy === key ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              {label}
              {sortBy === key && (
                sortOrder === 'asc' 
                  ? <SortAsc className="w-3 h-3 ml-1" />
                  : <SortDesc className="w-3 h-3 ml-1" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count and Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>
            Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} items
          </span>
          {hasFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
          )}
        </div>

        {/* Active Filters Display */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            {searchTerm && (
              <Badge variant="outline" className="text-xs">
                Search: "{searchTerm}"
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => onSearchChange('')}
                />
              </Badge>
            )}
            {selectedMainGroup && (
              <Badge variant="outline" className="text-xs">
                Category: {selectedMainGroup}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => onMainGroupChange('')}
                />
              </Badge>
            )}
            {selectedSubGroup && (
              <Badge variant="outline" className="text-xs">
                Sub: {selectedSubGroup}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => onSubGroupChange('')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

FilterControls.displayName = 'FilterControls';

export default FilterControls;