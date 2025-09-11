import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ShoppingCart, Edit2, Trash2, Building2, TrendingUp, Eye, Zap } from 'lucide-react';
import PartDetailModal from '@/components/Inventory/PartDetailModal';

const PartCard = ({ part, onEdit, onDelete, user, movements, recordPartUsage, machines, restockPart, onAddToCart }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isLowStock = part.quantity <= part.min_stock;
  const needsReorder = part.quantity <= (part.reorder_level || 0);
  const isOutOfStock = part.quantity <= 0;
  const isHealthy = !isLowStock && !needsReorder && !isOutOfStock;

  // Dynamic status with better logic
  const getStockStatus = () => {
    if (isOutOfStock) return { label: 'Out', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50' };
    if (isLowStock) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50' };
    if (needsReorder) return { label: 'Reorder', color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/50' };
    return { label: 'Healthy', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/50' };
  };

  const stockStatus = getStockStatus();

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (part.quantity > 0) {
      onAddToCart(part);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(part);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(part);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    setIsDetailOpen(true);
  };

  return (
    <>
      <motion.div
        className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-600/50 hover:border-slate-400/70 transition-all duration-300 cursor-pointer overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          scale: 1.03,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600/50 to-slate-600/50">
          <motion.div 
            className={`h-full bg-gradient-to-r ${
              isOutOfStock ? 'from-red-500 to-red-600' :
              isLowStock ? 'from-red-400 to-orange-500' :
              needsReorder ? 'from-orange-400 to-yellow-500' :
              'from-green-400 to-emerald-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>

        {/* Status Indicators - Enhanced */}
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          {(isLowStock || needsReorder) && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className={`p-2 rounded-full backdrop-blur-sm shadow-lg ${
                isLowStock ? 'bg-red-500/90' : 'bg-orange-500/90'
              }`}
            >
              {isLowStock ? (
                <AlertTriangle className="w-3 h-3 text-white" />
              ) : (
                <TrendingUp className="w-3 h-3 text-white" />
              )}
            </motion.div>
          )}
          {isHealthy && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-2 rounded-full bg-green-500/90 backdrop-blur-sm shadow-lg"
            >
              <Zap className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* Admin Actions - Sleek Design */}
        {user.role === 'admin' && (
          <div className="absolute top-3 left-3 z-20 flex gap-1">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -20 }}
              onClick={handleEditClick}
              className="p-2 rounded-full bg-slate-700/90 hover:bg-blue-600/90 backdrop-blur-sm shadow-lg transition-colors duration-200"
            >
              <Edit2 className="w-3 h-3 text-slate-300 hover:text-white" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -20 }}
              transition={{ delay: 0.1 }}
              onClick={handleDeleteClick}
              className="p-2 rounded-full bg-slate-700/90 hover:bg-red-600/90 backdrop-blur-sm shadow-lg transition-colors duration-200"
            >
              <Trash2 className="w-3 h-3 text-slate-300 hover:text-white" />
            </motion.button>
          </div>
        )}

        <div className="p-4 relative z-10">
          {/* Premium Image Container */}
          <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/50 shadow-inner">
            {part.image_url ? (
              <>
                <img
                  src={part.image_url}
                  alt={part.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Quick View Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                  onClick={handleViewDetails}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </motion.button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="p-4 rounded-full bg-slate-600/30">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* Premium Content */}
          <div className="space-y-3">
            {/* Product Name with Gradient */}
            <div className="relative">
              <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                {part.name}
              </h3>
            </div>

            {/* Enhanced Info Grid */}
            <div className="space-y-2.5">
              {/* Part Number Row */}
              <div className="flex items-center justify-between group/row hover:bg-slate-700/30 -mx-2 px-2 py-1 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-500 group-hover/row:bg-blue-400 transition-colors" />
                  <span className="text-xs text-slate-400 font-medium">Part #</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono bg-slate-700/50 border-slate-500/50 hover:border-blue-400/50 transition-colors">
                  {part.part_number}
                </Badge>
              </div>

              {/* Supplier Row */}
              {part.supplier_id && (
                <div className="flex items-center justify-between group/row hover:bg-slate-700/30 -mx-2 px-2 py-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-slate-400 group-hover/row:text-purple-400 transition-colors" />
                    <span className="text-xs text-slate-400 font-medium">Supplier</span>
                  </div>
                  <span className="text-xs text-white font-mono bg-slate-700/50 px-2 py-1 rounded border border-slate-600/50">
                    {part.supplier_id}
                  </span>
                </div>
              )}

              {/* Stock Status Row - Premium Design */}
              <div className={`flex items-center justify-between p-2 rounded-xl border ${stockStatus.bg} ${stockStatus.border} backdrop-blur-sm`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stockStatus.color.replace('text-', 'bg-')} animate-pulse`} />
                  <span className="text-xs text-slate-300 font-medium">Stock</span>
                </div>
                <div className="flex items-center gap-3">
                  <motion.span 
                    className={`text-lg font-bold ${stockStatus.color}`}
                    key={part.quantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {part.quantity}
                  </motion.span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-medium ${stockStatus.bg} ${stockStatus.color} border-0`}
                  >
                    {stockStatus.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Premium Action Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="sm"
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className={`w-full h-9 text-sm font-medium transition-all duration-300 ${
                  isOutOfStock
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* Enhanced Detail Modal */}
      <PartDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        part={part}
        onEdit={onEdit}
        onDelete={onDelete}
        user={user}
        movements={movements}
        recordPartUsage={recordPartUsage}
        machines={machines}
        restockPart={restockPart}
        onAddToCart={onAddToCart}
      />
    </>
  );
};

export default PartCard;