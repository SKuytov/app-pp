import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { Badge } from '@/components/ui/badge';
import PartPopover from '@/components/Machines/Epc/PartPopover';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const Hotspot = ({ hotspot, isSelected, isHovered, isEditMode, selectedItemToPlace, onClick, onHover }) => {
    const { scale } = useTransformContext();

    const pulseAnimation = {
      scale: [1, 1.4, 1],
      opacity: [0.5, 0.8, 0.5],
    };

    return (
        <div 
          className="absolute"
          style={{ 
            left: `${hotspot.x_position * 100}%`, 
            top: `${hotspot.y_position * 100}%`,
            transform: `translate(-50%, -50%)`
          }}
          onMouseEnter={() => onHover(hotspot.id)}
        >
          <div 
            className="relative flex items-center justify-center"
            style={{ transform: `scale(${1 / scale})` }}
          >
            {isSelected && (
              <motion.div
                className="absolute h-5 w-5 rounded-full bg-sky-400"
                animate={pulseAnimation}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
            )}
            <motion.button 
              onClick={(e) => onClick(e, hotspot)}
              className={`relative h-4 w-4 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200
                ${isSelected ? 'bg-blue-400 border-white text-black scale-125 shadow-lg' : 'bg-white/90 border-black/70 text-black'}
                ${isHovered && !isSelected ? 'ring-2 ring-blue-400' : ''}
                ${isEditMode && selectedItemToPlace?.hotspotId === hotspot.id ? 'ring-4 ring-yellow-400' : ''}
                cursor-pointer`}
            >
              <span className="scale-[0.8]">{hotspot.item_number}</span>
            </motion.button>
          </div>
        </div>
    );
};

const DrawingViewer = ({
  currentAssembly,
  assemblyHotspots,
  isEditMode,
  selectedItemToPlace,
  onImageClick,
  onHotspotClick,
  onHotspotHover,
  hoveredHotspotId,
  selectedHotspotId,
  parts,
  onAddToCart,
  onClosePopover,
  activePopoverId,
  zoomToHotspot,
}) => {
  const imageRef = useRef(null);
  const transformRef = useRef(null);

  useEffect(() => {
    if (zoomToHotspot && transformRef.current && imageRef.current) {
      const { setTransform } = transformRef.current;
      const hotspot = assemblyHotspots.find(h => h.id === zoomToHotspot);
      if (hotspot && hotspot.x_position >= 0) {
        const { naturalWidth, naturalHeight } = imageRef.current;
        const newScale = 2;
        const x = -(hotspot.x_position * naturalWidth * newScale) + (imageRef.current.offsetWidth / 2);
        const y = -(hotspot.y_position * naturalHeight * newScale) + (imageRef.current.offsetHeight / 2);
        setTransform(x, y, newScale, 300, 'easeOut');
      }
    }
  }, [zoomToHotspot, assemblyHotspots]);

  const handleImageClick = (e) => {
    if (!isEditMode || !selectedItemToPlace || !imageRef.current || !transformRef.current || !transformRef.current.state) return;

    const { state } = transformRef.current;
    const image = imageRef.current;
    const rect = image.getBoundingClientRect();
    
    // Calculate click position relative to the viewport
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Undo the scaling and panning to find the coordinates on the original image
    const originalX = (clickX - state.positionX) / state.scale;
    const originalY = (clickY - state.positionY) / state.scale;
    
    // Normalize coordinates to a 0-1 range based on the image's natural dimensions
    const x_position = originalX / image.naturalWidth;
    const y_position = originalY / image.naturalHeight;

    // Ensure the coordinates are within the valid range [0, 1]
    const clampedX = Math.max(0, Math.min(1, x_position));
    const clampedY = Math.max(0, Math.min(1, y_position));

    onImageClick(clampedX, clampedY);
  };

  return (
    <div className="flex-grow w-2/3 bg-slate-900 rounded-lg p-2 relative overflow-hidden">
      <TransformWrapper
        ref={transformRef}
        minScale={0.5}
        maxScale={10}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        doubleClick={{ mode: 'zoomIn' }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                <Button size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/80" onClick={() => zoomIn()}><ZoomIn className="h-4 w-4" /></Button>
                <Button size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/80" onClick={() => zoomOut()}><ZoomOut className="h-4 w-4" /></Button>
                <Button size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/80" onClick={() => resetTransform()}><RotateCcw className="h-4 w-4" /></Button>
            </div>
            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
              <div 
                className={`relative ${isEditMode && selectedItemToPlace ? 'cursor-crosshair' : 'cursor-grab'}`} 
                onClick={handleImageClick}
                onMouseLeave={() => onHotspotHover(null)}
              >
                <img ref={imageRef} src={currentAssembly.drawing_url} alt={currentAssembly.name} className="max-w-full max-h-full object-contain pointer-events-none" />
                {assemblyHotspots.filter(h => h.x_position >= 0).map((hotspot) => (
                  <React.Fragment key={hotspot.id}>
                    <Hotspot
                      hotspot={hotspot}
                      isSelected={selectedHotspotId === hotspot.id}
                      isHovered={hoveredHotspotId === hotspot.id}
                      isEditMode={isEditMode}
                      selectedItemToPlace={selectedItemToPlace}
                      onClick={onHotspotClick}
                      onHover={onHotspotHover}
                    />
                    <AnimatePresence>
                      {activePopoverId === hotspot.id && hotspot.part_id && (
                        <PartPopover
                          hotspot={hotspot}
                          part={parts.find(p => p.id === hotspot.part_id)}
                          onAddToCart={onAddToCart}
                          onClose={onClosePopover}
                        />
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      {isEditMode && selectedItemToPlace && (
        <div className="absolute bottom-4 left-4 bg-black/60 p-2 px-4 rounded-lg text-sm text-white shadow-lg backdrop-blur-sm">
          Click on the drawing to place item <Badge variant="secondary">{selectedItemToPlace.item_number}</Badge>.
        </div>
      )}
    </div>
  );
};

export default DrawingViewer;