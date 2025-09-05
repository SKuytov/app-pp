import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Settings } from 'lucide-react';

const SettingsTab = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Application Settings</h1>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-white">General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-4">
            <div>
              <Label htmlFor="currency-select" className="text-slate-300">Display Currency</Label>
              <p className="text-xs text-slate-400 mb-2">Choose the currency to display for all monetary values. This does not perform any conversion.</p>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency-select" className="w-[180px] bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="BGN">BGN (лв)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SettingsTab;