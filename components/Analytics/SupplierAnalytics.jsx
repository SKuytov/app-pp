import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Percent, Clock } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { subDays } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

const chartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top', labels: { color: '#9ca3af' } }, title: { display: true, text: title, color: '#e5e7eb', font: { size: 16 } } },
  scales: { x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } } },
});

const radarOptions = (title) => ({
  ...chartOptions(title),
  scales: { r: { angleLines: { color: 'rgba(255,255,255,0.2)' }, grid: { color: 'rgba(255,255,255,0.2)' }, pointLabels: { color: '#d1d5db' }, ticks: { backdropColor: 'transparent', color: '#9ca3af', stepSize: 2 } } },
});

const SupplierAnalytics = ({ suppliers, parts, movements }) => {
  const { formatCurrency } = useCurrency();

  const analyticsData = useMemo(() => {
    const safeSuppliers = suppliers || [];
    const safeParts = parts || [];
    const safeMovements = movements || [];
    const partPriceMap = new Map(safeParts.map(p => [p.id, p.price]));
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentMovements = safeMovements.filter(m => m.type === 'OUT' && new Date(m.timestamp) >= thirtyDaysAgo);

    const activeSuppliers = new Set(safeParts.map(p => p.supplier)).size;

    const supplierSpending = safeSuppliers.map(supplier => {
        const supplierParts = safeParts.filter(p => p.supplier === supplier.name);
        const spend = recentMovements
            .filter(m => supplierParts.some(p => p.id === m.part_id))
            .reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0);
        return { name: supplier.name, spend };
    });

    const totalSpend = supplierSpending.reduce((sum, s) => sum + s.spend, 0);
    const topSupplierSpend = supplierSpending.length > 0 ? Math.max(...supplierSpending.map(s => s.spend)) : 0;
    const topSupplierDependency = totalSpend > 0 ? (topSupplierSpend / totalSpend) * 100 : 0;

    const performanceData = safeSuppliers.map(supplier => {
        const supplierParts = safeParts.filter(p => p.supplier === supplier.name);
        const partsCount = supplierParts.length;
        const totalValue = supplierParts.reduce((sum, p) => sum + (p.quantity * p.price), 0);
        // Mock data for lead time and score as it's not in DB
        const leadTime = 8 + Math.floor(Math.random() * 12);
        const score = 6 + Math.random() * 4;
        let risk = 'Low';
        if (score < 7) risk = 'High';
        else if (score < 8.5) risk = 'Medium';
        return { name: supplier.name, partsCount, totalValue, leadTime, score, risk };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const avgLeadTime = performanceData.length > 0 ? performanceData.reduce((sum, s) => sum + s.leadTime, 0) / performanceData.length : 0;

    return {
        activeSuppliers,
        topSupplierDependency,
        avgLeadTime,
        supplierSpending: supplierSpending.sort((a, b) => b.spend - a.spend).slice(0, 5),
        performanceData,
    };
  }, [suppliers, parts, movements]);

  const kpiData = [
    { title: 'Active Suppliers', value: analyticsData.activeSuppliers, icon: Users, color: 'text-blue-400' },
    { title: 'Top Supplier Dependency', value: `${analyticsData.topSupplierDependency.toFixed(1)}%`, icon: Percent, color: 'text-red-400' },
    { title: 'Average Lead Time', value: `${analyticsData.avgLeadTime.toFixed(1)} Days`, icon: Clock, color: 'text-yellow-400' },
  ];

  const supplierSpendingChartData = {
    labels: analyticsData.supplierSpending.map(s => s.name),
    datasets: [{ label: 'Total Spend (30d)', data: analyticsData.supplierSpending.map(s => s.spend), backgroundColor: 'rgba(139, 92, 246, 0.6)' }],
  };

  const riskAnalysisChartData = {
    labels: ['On-Time Delivery', 'Quality Score', 'Price', 'Financial Stability', 'Risk'],
    datasets: analyticsData.performanceData.slice(0, 2).map((s, i) => ({
        label: s.name,
        data: [s.score, s.score * 0.9, 10 - s.score, s.score * 0.8, (10 - s.score) * 0.5].map(v => Math.max(0, v).toFixed(1)),
        borderColor: i === 0 ? 'rgb(59, 130, 246)' : 'rgb(244, 63, 94)',
        backgroundColor: i === 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(244, 63, 94, 0.2)',
    })),
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-white mb-6">Supplier Analytics</h1>
      
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
        <Card className="bg-slate-800/50 border-slate-700 h-96 p-4"><Bar options={{ ...chartOptions('Supplier Spending Comparison (30d)'), indexAxis: 'y' }} data={supplierSpendingChartData} /></Card>
        <Card className="bg-slate-800/50 border-slate-700 h-96 p-4"><Radar options={radarOptions('Supply Chain Risk Analysis (Top 2)')} data={riskAnalysisChartData} /></Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader><CardTitle className="text-white">Supplier Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-700">
                  <TableHead>Supplier</TableHead>
                  <TableHead>Parts Count</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Avg. Lead Time</TableHead>
                  <TableHead>Performance Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.performanceData.map((supplier, index) => (
                  <TableRow key={index} className="border-slate-800">
                    <TableCell className="font-medium text-white">{supplier.name}</TableCell>
                    <TableCell className="text-slate-300">{supplier.partsCount}</TableCell>
                    <TableCell className="text-slate-300">{formatCurrency(supplier.totalValue)}</TableCell>
                    <TableCell className="text-slate-300">{supplier.leadTime} days</TableCell>
                    <TableCell className="font-bold text-white">{supplier.score.toFixed(1)}/10</TableCell>
                    <TableCell><Badge variant={supplier.risk === 'Low' ? 'secondary' : 'destructive'} className={supplier.risk === 'Low' ? 'bg-green-500/20 text-green-300' : supplier.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}>{supplier.risk}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SupplierAnalytics;