import React, { useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

const FilterControls = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedMainGroup, 
  setSelectedMainGroup,
  selectedSubGroup,
  setSelectedSubGroup,
  mainGroups,
  subGroups,
}) => (
  <div className="flex flex-col md:flex-row gap-4 mb-6">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <Input
        placeholder="Search parts by name or part number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400"
      />
    </div>
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
      <select
        value={selectedMainGroup}
        onChange={(e) => {
          setSelectedMainGroup(e.target.value);
          setSelectedSubGroup('all');
        }}
        className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white appearance-none cursor-pointer w-full md:w-auto md:min-w-[200px]"
      >
        <option value="all" className="bg-gray-800 text-white">All Main Groups</option>
        {mainGroups.map(group => (
          <option key={group} value={group} className="bg-gray-800 text-white">
            {group}
          </option>
        ))}
      </select>
    </div>
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
      <select
        value={selectedSubGroup}
        onChange={(e) => setSelectedSubGroup(e.target.value)}
        className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white appearance-none cursor-pointer w-full md:w-auto md:min-w-[200px]"
        disabled={selectedMainGroup === 'all'}
      >
        <option value="all" className="bg-gray-800 text-white">All Sub-Groups</option>
         {subGroups.map(group => (
          <option key={group} value={group} className="bg-gray-800 text-white">
            {group}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default FilterControls;