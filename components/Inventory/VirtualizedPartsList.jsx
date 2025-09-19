// components/VirtualizedPartsList.jsx
import React, { memo, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import OptimizedPartCard from './OptimizedPartCard';

const CARD_WIDTH = 320;
const CARD_HEIGHT = 280;
const GRID_PADDING = 16;

const GridItem = memo(({ columnIndex, rowIndex, style, data }) => {
  const { parts, columnsPerRow, ...itemProps } = data;
  const index = rowIndex * columnsPerRow + columnIndex;
  
  if (index >= parts.length) {
    return <div style={style} />;
  }

  const part = parts[index];
  
  return (
    <div style={style}>
      <OptimizedPartCard
        part={part}
        {...itemProps}
        style={{
          margin: '8px',
          height: CARD_HEIGHT - 16,
          width: CARD_WIDTH - 16
        }}
      />
    </div>
  );
});

GridItem.displayName = 'GridItem';

const VirtualizedPartsList = memo(({
  parts,
  onEdit,
  onDelete,
  onView,
  onAddToCart,
  user,
  containerHeight = 600
}) => {
  const memoizedItemData = useMemo(() => ({
    parts,
    onEdit,
    onDelete,
    onView,
    onAddToCart,
    user
  }), [parts, onEdit, onDelete, onView, onAddToCart, user]);

  if (!parts || parts.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-800/30 rounded-lg border border-slate-700/50"
        style={{ height: containerHeight }}
      >
        <div className="text-center text-slate-400">
          <div className="text-6xl mb-4">📦</div>
          <div className="text-lg font-medium mb-2">No parts found</div>
          <div className="text-sm">Try adjusting your search or filters</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: containerHeight }} className="w-full">
      <AutoSizer>
        {({ width, height }) => {
          const columnsPerRow = Math.max(1, Math.floor((width - GRID_PADDING) / CARD_WIDTH));
          const rowCount = Math.ceil(parts.length / columnsPerRow);
          
          return (
            <Grid
              columnCount={columnsPerRow}
              columnWidth={CARD_WIDTH}
              height={height}
              rowCount={rowCount}
              rowHeight={CARD_HEIGHT}
              width={width}
              itemData={{
                ...memoizedItemData,
                columnsPerRow
              }}
              overscanRowCount={2}
              overscanColumnCount={1}
            >
              {GridItem}
            </Grid>
          );
        }}
      </AutoSizer>
    </div>
  );
});

VirtualizedPartsList.displayName = 'VirtualizedPartsList';

export default VirtualizedPartsList;