import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function FilterControls({ searchTerm, setSearchTerm, clearFilters }) {
  return (
    <div className="flex space-x-2">
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button variant="outline" onClick={clearFilters}>
        Clear
      </Button>
    </div>
  );
}

export default memo(
  FilterControls,
  (prev, next) => prev.searchTerm === next.searchTerm
);
