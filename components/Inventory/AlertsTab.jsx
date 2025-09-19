import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AlertsTab = ({ lowStockParts }) => (
  <motion.div
    key="alerts"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <AlertTriangle className="h-6 w-6 text-red-400 mr-2" />
        Low Stock Alerts
      </h3>
      
      {lowStockParts.length > 0 ? (
        <div className="space-y-4">
          {lowStockParts.map((part) => (
            <motion.div
              key={part.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{part.name}</h4>
                    <p className="text-gray-300">{part.partNumber}</p>
                    <p className="text-red-300 text-sm mt-1">
                      Current: {part.quantity} | Minimum: {part.minStock}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">
                      {part.category}
                    </Badge>
                    <p className="text-gray-300 text-sm mt-2">Location: {part.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-green-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">All Good!</h4>
          <p className="text-gray-300">No low stock alerts at the moment.</p>
        </div>
      )}
    </Card>
  </motion.div>
);

export default AlertsTab;