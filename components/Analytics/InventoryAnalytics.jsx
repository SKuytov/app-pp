import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingDown, Repeat } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { subDays } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const chartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top', labels: { color: '#9ca3af' } }, title: { display: true, text: title, color: '#e5e7eb', font: { size: 16 } } },
  scales: { x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } } },
});

const InventoryAnalytics = ({ parts, movements }) => {
  const { formatCurrency } = useCurrency();

  const analyticsData = useMemo(() => {
    const safeParts = parts || [];
    const safeMovements = movements || [];

    const reorderRequired = safeParts.filter(p => p.quantity <= p.min_stock).length;
    
    const excessStockValue = safeParts.reduce((sum, p) => {
        const excess = Math.max(0, p.quantity - 3 * p.min_stock);
        return sum + (excess * p.price);
    }, 0);

    const thirtyDaysAgo = subDays(new Date(), 30);
    const consumedLast30Days = safeMovements
        .filter(m => m.type === 'OUT' && new Date(m.timestamp) >= thirtyDaysAgo)
        .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalStock = safeParts.reduce((sum, p) => sum + p.quantity, 0);
    const avgStock = safeParts.length > 0 ? totalStock / safeParts.length : 0;
    const stockTurnover = avgStock > 0 ? consumedLast30Days / avgStock : 0;

    const stockLevels = safeParts
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 7)
        .map(p => ({ name: p.name, current: p.quantity, min: p.min_stock }));

    const abcAnalysis = safeParts.map(p => {
        const value = p.quantity * p.price;
        const volume = p.quantity;
        return { x: volume, y: value, name: p.name };
    });

    const inventoryTable = safeParts
        .map(p => {
            let status = 'OK';
            let recommendation = 'None';
            if (p.quantity <= p.min_stock) {
                status = 'Low Stock';
                recommendation = `Reorder ${Math.max(p.min_stock * 2 - p.quantity, p.min_stock)} units`;
            } else if (p.quantity > p.min_stock * 3) {
                status = 'Excess Stock';
                recommendation = 'Monitor usage, consider reducing stock';
            }
            return { ...p, status, recommendation };
        })
        .filter(p => p.status !== 'OK')
        .sort((a, b) => (a.status > b.status) ? -1 : 1)
        .slice(0, 10);

    return {
        reorderRequired,
        excessStockValue,
        stockTurnover,
        stockLevels,
        abcAnalysis,
        inventoryTable
    };
  }, [parts, movements]);

  const kpiData = [
    { title: 'Reorder Required', value: analyticsData.reorderRequired, icon: AlertCircle, color: 'text-red-400' },
    { title: 'Excess Stock Value', value: formatCurrency(analyticsData.excessStockValue), icon: TrendingDown, color: 'text-yellow-400' },
    { title: 'Stock Turnover (30d)', value: `${analyticsData.stockTurnover.toFixed(1)}x`, icon: Repeat, color: 'text-blue-400' },
  ];

  const stockLevelChartData = {
    labels: analyticsData.stockLevels.map(s => s.name),
    datasets: [
      { label: 'Current Stock', data: analyticsData.stockLevels.map(s => s.current), backgroundColor: 'rgba(96, 165, 250, 0.6)' },
      { label: 'Min Stock', data: analyticsData.stockLevels.map(s => s.min), backgroundColor: 'rgba(248, 113, 113, 0.6)' },
    ],
  };

  const abcAnalysisChartData = {
    datasets: [{ label: 'Parts', data: analyticsData.abcAnalysis, backgroundColor: 'rgba(59, 130, 246, 0.5)' }],
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-white mb-6">Inventory Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold text-white">{kpi.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-slate-800/50 border-slate-700 h-96 p-4"><Bar options={chartOptions('Stock Level Analysis (Top 7)')} data={stockLevelChartData} /></Card>
        <Card className="bg-slate-800/50 border-slate-700 h-96 p-4"><Scatter options={chartOptions('ABC Analysis (Volume vs. Value)')} data={abcAnalysisChartData} /></Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader><CardTitle className="text-white">Inventory Optimization</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-700">
                  <TableHead>Part Name / Number</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.inventoryTable.map((item, index) => (
                  <TableRow key={index} className="border-slate-800">
                    <TableCell>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.part_number}</p>
                    </TableCell>
                    <TableCell className="text-slate-300">{item.quantity}</TableCell>
                    <TableCell className="text-slate-300">{item.min_stock}</TableCell>
                    <TableCell><Badge variant={item.status === 'OK' ? 'secondary' : 'destructive'} className={item.status === 'OK' ? 'bg-green-500/20 text-green-300' : item.status === 'Low Stock' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}>{item.status}</Badge></TableCell>
                    <TableCell className="text-slate-300">{item.recommendation}</TableCell>
                    <TableCell className="text-center">
                      {item.status === 'Low Stock' ? (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Reorder</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="border-green-500/50 text-green-300 hover:bg-green-500/10 hover:text-green-200">OK</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                 {analyticsData.inventoryTable.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-400">No items require immediate action.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InventoryAnalytics;