import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Clock } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { subDays } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const chartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#9ca3af' } },
    title: { display: true, text: title, color: '#e5e7eb', font: { size: 16 } },
  },
});

const FinancialAnalytics = ({ parts, machines, movements, suppliers }) => {
  const { formatCurrency } = useCurrency();

  const analyticsData = useMemo(() => {
    const safeParts = parts || [];
    const safeMachines = machines || [];
    const safeMovements = movements || [];
    const safeSuppliers = suppliers || [];

    const partPriceMap = new Map(safeParts.map(p => [p.id, p.price]));
    const thirtyDaysAgo = subDays(new Date(), 30);

    const recentMovements = safeMovements.filter(m => m.type === 'OUT' && new Date(m.timestamp) >= thirtyDaysAgo);
    const totalCostLast30Days = recentMovements.reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0);
    const dailyBurnRate = totalCostLast30Days / 30;
    
    const monthlyForecast = dailyBurnRate * 30;
    const annualProjection = monthlyForecast * 12;

    const operationalMachines = safeMachines.filter(m => m.status === 'Operational').length;
    const totalOperationalHoursPerWeek = operationalMachines * 112.5; // 5d*3s*7.5h
    const weeklyCost = dailyBurnRate * 7;
    const costPerMachineHour = totalOperationalHoursPerWeek > 0 ? weeklyCost / totalOperationalHoursPerWeek : 0;

    const supplierSpending = safeSuppliers.map(supplier => {
        const supplierParts = safeParts.filter(p => p.supplier === supplier.name);
        const spend = recentMovements
            .filter(m => supplierParts.some(p => p.id === m.part_id))
            .reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0);
        return { name: supplier.name, spend };
    }).sort((a, b) => b.spend - a.spend).slice(0, 5);

    const costBreakdown = safeParts.reduce((acc, part) => {
        const category = part.main_group || 'Uncategorized';
        const cost = recentMovements
            .filter(m => m.part_id === part.id)
            .reduce((sum, m) => sum + (m.quantity * part.price), 0);
        acc[category] = (acc[category] || 0) + cost;
        return acc;
    }, {});

    const machineCostAnalysis = safeMachines.map(machine => {
        const partsUsed = recentMovements.filter(m => m.machine_id === machine.id).reduce((sum, m) => sum + m.quantity, 0);
        const totalCost = recentMovements.filter(m => m.machine_id === machine.id).reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0);
        const costPerDay = totalCost / 30;
        return { name: machine.name, partsUsed, totalCost, costPerDay, status: machine.status };
    }).sort((a, b) => b.totalCost - a.totalCost).slice(0, 10);

    return {
      monthlyForecast,
      annualProjection,
      costPerMachineHour,
      supplierSpending,
      costBreakdown,
      machineCostAnalysis,
    };
  }, [parts, machines, movements, suppliers]);

  const kpiData = [
    { title: 'Monthly Forecast', value: formatCurrency(analyticsData.monthlyForecast), icon: TrendingUp, color: 'text-blue-400' },
    { title: 'Annual Projection', value: formatCurrency(analyticsData.annualProjection), icon: Target, color: 'text-green-400' },
    { title: 'Cost per Machine Hour', value: formatCurrency(analyticsData.costPerMachineHour), icon: Clock, color: 'text-yellow-400' },
  ];

  const supplierSpendingChartData = {
    labels: analyticsData.supplierSpending.map(s => s.name),
    datasets: [{ data: analyticsData.supplierSpending.map(s => s.spend), backgroundColor: ['#60a5fa', '#34d399', '#facc15', '#f87171', '#93c5fd'] }],
  };

  const costBreakdownChartData = {
    labels: Object.keys(analyticsData.costBreakdown),
    datasets: [{ data: Object.values(analyticsData.costBreakdown), backgroundColor: ['#818cf8', '#a78bfa', '#f472b6', '#fb923c', '#60a5fa', '#34d399'] }],
  };

  const machineCostChartData = {
    labels: analyticsData.machineCostAnalysis.map(m => m.name),
    datasets: [{ label: 'Total Cost (30d)', data: analyticsData.machineCostAnalysis.map(m => m.totalCost), backgroundColor: 'rgba(167, 139, 250, 0.6)' }],
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-white mb-6">Financial Analytics</h1>
      
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-slate-800/50 border-slate-700 h-96 p-4"><Doughnut options={chartOptions('Supplier Spending (30d)')} data={supplierSpendingChartData} /></Card>
        <Card className="bg-slate-800/50 border-slate-700 h-96 p-4"><Pie options={chartOptions('Cost Breakdown by Category (30d)')} data={costBreakdownChartData} /></Card>
        <Card className="bg-slate-800/50 border-slate-700 h-96 p-4"><Bar options={{ ...chartOptions('Machine Cost (30d)'), indexAxis: 'y' }} data={machineCostChartData} /></Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader><CardTitle className="text-white">Machine Cost Analysis (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-700">
                  <TableHead>Machine Name</TableHead>
                  <TableHead>Parts Used</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Cost/Day</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.machineCostAnalysis.map((machine, index) => (
                  <TableRow key={index} className="border-slate-800">
                    <TableCell className="font-medium text-white">{machine.name}</TableCell>
                    <TableCell className="text-slate-300">{machine.partsUsed}</TableCell>
                    <TableCell className="text-slate-300">{formatCurrency(machine.totalCost)}</TableCell>
                    <TableCell className="text-slate-300">{formatCurrency(machine.costPerDay)}</TableCell>
                    <TableCell>
                      <Badge variant={machine.status === 'Operational' ? 'secondary' : 'destructive'} className={machine.status === 'Operational' ? 'bg-green-500/20 text-green-300' : machine.status === 'Needs Maintenance' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}>
                        {machine.status}
                      </Badge>
                    </TableCell>
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

export default FinancialAnalytics;