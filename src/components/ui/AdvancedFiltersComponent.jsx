import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Slider } from '@/components/ui/slider';
import { 
  Filter, X, Save, Upload, Download, RefreshCw,
  Calendar, DollarSign, Package, Settings, Search
} from 'lucide-react';

const AdvancedFiltersComponent = ({ 
  data, 
  onFilterChange, 
  savedFilters = [],
  onSaveFilter,
  onLoadFilter 
}) => {
  const [filters, setFilters] = useState({
    search: '',
    dateRange: { from: null, to: null },
    categories: [],
    priceRange: [0, 10000],
    quantityRange: [0, 1000],
    facilities: [],
    machines: [],
    suppliers: [],
    status: [],
    customFields: {}
  });

  const [activeFilters, setActiveFilters] = useState([]);
  const [filterPresets, setFilterPresets] = useState([
    { name: 'Low Stock', filters: { quantityRange: [0, 10] } },
    { name: 'High Usage', filters: { usageRange: [50, 1000] } },
    { name: 'Recent Activity', filters: { dateRange: { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { name: 'Critical Parts', filters: { status: ['critical', 'low-stock'] } }
  ]);

  // Extract unique values from data for filter options
  const getUniqueValues = (field) => {
    if (!data || !Array.isArray(data)) return [];
    return [...new Set(data.map(item => item[field]).filter(Boolean))];
  };

  const categories = getUniqueValues('category') || getUniqueValues('main_group') || [];
  const facilities = getUniqueValues('facility') || [];
  const machines = getUniqueValues('machine_name') || [];
  const suppliers = getUniqueValues('supplier') || [];

  // Apply filters to data
  const applyFilters = (filtersToApply = filters) => {
    if (!data) return [];

    let filtered = data.filter(item => {
      // Text search
      if (filtersToApply.search) {
        const searchLower = filtersToApply.search.toLowerCase();
        const searchableFields = ['name', 'part_number', 'description', 'category'];
        const matches = searchableFields.some(field => 
          item[field]?.toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }

      // Date range
      if (filtersToApply.dateRange.from) {
        const itemDate = new Date(item.created_at || item.timestamp || item.date);
        if (itemDate < filtersToApply.dateRange.from) return false;
        if (filtersToApply.dateRange.to && itemDate > filtersToApply.dateRange.to) return false;
      }

      // Categories
      if (filtersToApply.categories.length > 0) {
        const itemCategory = item.category || item.main_group;
        if (!filtersToApply.categories.includes(itemCategory)) return false;
      }

      // Price range
      if (item.price) {
        const price = parseFloat(item.price) || parseFloat(item.unit_cost) || 0;
        if (price < filtersToApply.priceRange[0] || price > filtersToApply.priceRange[1]) return false;
      }

      // Quantity range
      if (item.quantity !== undefined) {
        const qty = parseInt(item.quantity) || parseInt(item.current_quantity) || 0;
        if (qty < filtersToApply.quantityRange[0] || qty > filtersToApply.quantityRange[1]) return false;
      }

      // Multi-select filters
      ['facilities', 'machines', 'suppliers', 'status'].forEach(filterType => {
        if (filtersToApply[filterType].length > 0) {
          const itemValue = item[filterType.slice(0, -1)] || item[filterType];
          if (!filtersToApply[filterType].includes(itemValue)) return false;
        }
      });

      return true;
    });

    onFilterChange?.(filtered, filtersToApply);
    return filtered;
  };

  // Update active filters display
  useEffect(() => {
    const active = [];

    if (filters.search) active.push({ type: 'search', value: filters.search, label: `Search: "${filters.search}"` });
    if (filters.dateRange.from) active.push({ type: 'dateRange', value: filters.dateRange, label: 'Date Range' });
    if (filters.categories.length > 0) active.push({ type: 'categories', value: filters.categories, label: `Categories: ${filters.categories.length}` });

    setActiveFilters(active);
    applyFilters();
  }, [filters, data]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const removeFilter = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'search' ? '' : 
                   filterType === 'dateRange' ? { from: null, to: null } :
                   []
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      dateRange: { from: null, to: null },
      categories: [],
      priceRange: [0, 10000],
      quantityRange: [0, 1000],
      facilities: [],
      machines: [],
      suppliers: [],
      status: [],
      customFields: {}
    });
  };

  const saveCurrentFilter = () => {
    const filterName = prompt('Enter filter name:');
    if (filterName) {
      onSaveFilter?.({
        name: filterName,
        filters,
        createdAt: new Date().toISOString()
      });
    }
  };

  const applyPreset = (preset) => {
    setFilters(prev => ({ ...prev, ...preset.filters }));
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary">{activeFilters.length} active</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={saveCurrentFilter}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search parts, machines, or descriptions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DatePickerWithRange
                value={filters.dateRange}
                onChange={(range) => handleFilterChange('dateRange', range)}
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categories</Label>
              <Select
                value={filters.categories[0] || ''}
                onValueChange={(value) => handleFilterChange('categories', value ? [value] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Facilities */}
            <div className="space-y-2">
              <Label>Facilities</Label>
              <Select
                value={filters.facilities[0] || ''}
                onValueChange={(value) => handleFilterChange('facilities', value ? [value] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facility..." />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map(facility => (
                    <SelectItem key={facility} value={facility}>
                      {facility}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Machines */}
            <div className="space-y-2">
              <Label>Machines</Label>
              <Select
                value={filters.machines[0] || ''}
                onValueChange={(value) => handleFilterChange('machines', value ? [value] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select machine..." />
                </SelectTrigger>
                <SelectContent>
                  {machines.map(machine => (
                    <SelectItem key={machine} value={machine}>
                      {machine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Range Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Price Range</Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
                max={10000}
                min={0}
                step={100}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantity Range</Label>
              <Slider
                value={filters.quantityRange}
                onValueChange={(value) => handleFilterChange('quantityRange', value)}
                max={1000}
                min={0}
                step={10}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{filters.quantityRange[0]}</span>
                <span>{filters.quantityRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Filter Presets */}
          <div className="space-y-2">
            <Label>Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filterPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {filter.label}
              <button
                onClick={() => removeFilter(filter.type)}
                className="ml-1 hover:bg-gray-200 rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedFiltersComponent;