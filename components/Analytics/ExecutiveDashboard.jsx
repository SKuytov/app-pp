import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, Percent, Activity, Clock } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { subDays, format, startOfYear, eachMonthOfInterval, getMonth } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } },
  },
};

const ExecutiveDashboard = ({ parts, machines, movements }) => {
  const { formatCurrency } = useCurrency();

  const analyticsData = useMemo(() => {
    const safeParts = parts || [];
    const safeMachines = machines || [];
    const safeMovements = movements || [];

    const partPriceMap = new Map(safeParts.map(p => [p.id, p.price]));
    const today = new Date();
    const ytdStart = startOfYear(today);

    const ytdMovements = safeMovements.filter(m => m.type === 'OUT' && new Date(m.timestamp) >= ytdStart);
    const ytdCost = ytdMovements.reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0);
    
    const daysInYtd = (today - ytdStart) / (1000 * 60 * 60 * 24);
    const dailyBurnRate = daysInYtd > 0 ? ytdCost / daysInYtd : 0;

    const machineAvailability = safeMachines.length > 0 ? (safeMachines.filter(m => m.status === 'Operational').length / safeMachines.length) * 100 : 0;
    
    const inventoryValue = safeParts.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    const machineCosts = safeMachines.map(machine => {
        const cost = ytdMovements
            .filter(m => m.machine_id === machine.id)
            .reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0);
        return { name: machine.name, cost };
    }).sort((a, b) => b.cost - a.cost).slice(0, 7);

    const monthlySpending = eachMonthOfInterval({ start: ytdStart, end: today }).map(monthStart => {
        const month = getMonth(monthStart);
        const total = ytdMovements
            .filter(m => getMonth(new Date(m.timestamp)) === month)
            .reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0);
        return { month: format(monthStart, 'MMM'), total };
    });

    const machineRiskScores = safeMachines.map(machine => {
        let baseRisk = 0.2;
        if (machine.status?.toLowerCase().includes('out') || machine.status?.toLowerCase().includes('service')) baseRisk = 1.0;
        else if (machine.status?.toLowerCase().includes('maintenance') || machine.status?.toLowerCase().includes('repair')) baseRisk = 0.8;

        const partsUsed = safeMovements.filter(m => m.machine_id === machine.id && m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
        const usageRisk = Math.min(0.5, partsUsed / 200);
        const finalRisk = Math.min(1.0, baseRisk + usageRisk);
        return { ...machine, riskScore: finalRisk };
    });

    const criticalAlerts = [
        ...safeParts.filter(p => p.quantity <= p.min_stock).map(p => ({
            priority: 'High', message: `${p.name} is low on stock`, impact: 'Potential Stockout', action: 'Create purchase order', status: 'Pending'
        })),
        ...machineRiskScores.filter(m => m.riskScore >= 0.7).map(m => ({
            priority: 'High', message: `${m.name} has high failure risk`, impact: 'Production Halt', action: 'Schedule immediate maintenance', status: 'Pending'
        }))
    ].slice(0, 5);

    return {
      ytdCost,
      dailyBurnRate,
      machineAvailability,
      inventoryValue,
      machineCosts,
      monthlySpending,
      criticalAlerts,
    };
  }, [parts, machines, movements]);

  const kpiData = [
    { title: 'Critical Alerts', value: analyticsData.criticalAlerts.length, icon: AlertTriangle, color: 'text-red-400' },
    { title: 'YTD Cost', value: formatCurrency(analyticsData.ytdCost), icon: DollarSign, color: 'text-green-400' },
    { title: 'Machine Availability', value: `${analyticsData.machineAvailability.toFixed(1)}%`, icon: Percent, color: 'text-blue-400' },
    { title: 'Inventory Value', value: formatCurrency(analyticsData.inventoryValue), icon: DollarSign, color: 'text-yellow-400' },
    { title: 'Daily Burn Rate', value: formatCurrency(analyticsData.dailyBurnRate), icon: Activity, color: 'text-purple-400' },
  ];

  const machineCostChartData = {
    labels: analyticsData.machineCosts.map(m => m.name),
    datasets: [{
      label: 'YTD Cost',
      data: analyticsData.machineCosts.map(m => m.cost),
      backgroundColor: 'rgba(129, 140, 248, 0.6)',
      borderColor: 'rgba(129, 140, 248, 1)',
      borderWidth: 1,
    }],
  };

  const monthlySpendingChartData = {
    labels: analyticsData.monthlySpending.map(m => m.month),
    datasets: [{
      label: 'Total Spending',
      data: analyticsData.monthlySpending.map(m => m.total),
      fill: false,
      borderColor: 'rgb(52, 211, 153)',
      tension: 0.1,
    }],
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Executive Dashboard</h1>
        <div className="flex items-center text-sm text-slate-400">
          <Clock className="h-4 w-4 mr-2" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white">Machine Cost Analysis (YTD)</CardTitle></CardHeader>
          <CardContent className="h-80"><Bar options={chartOptions} data={machineCostChartData} /></CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white">Monthly Spending Trend (YTD)</CardTitle></CardHeader>
          <CardContent className="h-80"><Line options={chartOptions} data={monthlySpendingChartData} /></CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader><CardTitle className="text-white">Critical Alerts</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-700">
                  <TableHead>Priority</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Required Action</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.criticalAlerts.map((alert, index) => (
                  <TableRow key={index} className="border-slate-800">
                    <TableCell>
                      <Badge variant='destructive'>{alert.priority}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-white">{alert.message}</TableCell>
                    <TableCell className="text-slate-300">{alert.impact}</TableCell>
                    <TableCell className="text-slate-300">{alert.action}</TableCell>
                    <TableCell><Badge variant="outline">{alert.status}</Badge></TableCell>
                  </TableRow>
                ))}
                 {analyticsData.criticalAlerts.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-slate-400">No critical alerts.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExecutiveDashboard;