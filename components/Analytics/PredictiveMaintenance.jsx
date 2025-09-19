import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Calendar } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, addDays } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: true, text: title, color: '#e5e7eb', font: { size: 16 } },
  },
  scales: {
    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } },
  },
});

const PredictiveMaintenance = ({ machines, movements, parts }) => {
  const { formatCurrency } = useCurrency();

  const analyticsData = useMemo(() => {
    const safeMachines = machines || [];
    const safeMovements = movements || [];
    const safeParts = parts || [];
    const partPriceMap = new Map(safeParts.map(p => [p.id, p.price]));

    const riskData = safeMachines.map(machine => {
      let baseRisk = 0.2;
      if (machine.status?.toLowerCase().includes('out') || machine.status?.toLowerCase().includes('service')) baseRisk = 1.0;
      else if (machine.status?.toLowerCase().includes('maintenance') || machine.status?.toLowerCase().includes('repair')) baseRisk = 0.8;

      const partsUsed = safeMovements.filter(m => m.machine_id === machine.id && m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
      const usageRisk = Math.min(0.5, partsUsed / 200);
      const finalRisk = Math.min(1.0, baseRisk + usageRisk);
      
      let level = 'Low';
      if (finalRisk >= 0.7) level = 'High';
      else if (finalRisk >= 0.3) level = 'Medium';

      return { name: machine.name, score: Math.round(finalRisk * 100), level, description: `Based on status '${machine.status}' and ${partsUsed} parts used.` };
    }).sort((a, b) => b.score - a.score);

    const maintenanceSchedule = riskData
      .filter(r => r.level !== 'Low')
      .map((r, i) => ({
        machine: r.name,
        task: r.level === 'High' ? 'Immediate Inspection' : 'Preventive Check',
        date: format(addDays(new Date(), i + 1), 'yyyy-MM-dd'),
        priority: r.level,
      }))
      .slice(0, 5);

    const highRiskMachine = riskData.find(r => r.level === 'High');
    const failureForecast = highRiskMachine ? 
      Array.from({ length: 7 }, (_, i) => highRiskMachine.score + (i * (100 - highRiskMachine.score) / 6.5)) :
      Array.from({ length: 7 }, () => 0);

    const costAvoidance = safeMovements
      .filter(m => m.description?.toLowerCase().includes('maintenance'))
      .reduce((sum, m) => sum + (m.quantity * (partPriceMap.get(m.part_id) || 0)), 0) * 1.5; // Assuming avoided cost is 1.5x maintenance cost

    return { riskData, maintenanceSchedule, failureForecast, costAvoidance, highRiskMachineName: highRiskMachine?.name };
  }, [machines, movements, parts]);

  const getRiskColor = (level) => {
    if (level === 'High') return 'border-red-500/50 bg-red-900/20';
    if (level === 'Medium') return 'border-yellow-500/50 bg-yellow-900/20';
    return 'border-green-500/50 bg-green-900/20';
  };

  const failureForecastData = {
    labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
    datasets: [{
      label: 'Failure Probability',
      data: analyticsData.failureForecast,
      borderColor: 'rgb(248, 113, 113)',
      backgroundColor: 'rgba(248, 113, 113, 0.2)',
      fill: true,
    }],
  };

  const costAvoidanceData = {
    labels: ['Estimated Cost Avoidance'],
    datasets: [{
      label: 'Cost Avoided',
      data: [analyticsData.costAvoidance],
      backgroundColor: 'rgba(52, 211, 153, 0.5)',
    }],
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-white mb-6">Predictive Maintenance</h1>
      
      <Card className="mb-6 bg-slate-800/50 border-slate-700">
        <CardHeader><CardTitle className="flex items-center gap-2 text-white"><ShieldAlert /> Machine Risk Assessment</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsData.riskData.slice(0, 4).map((risk, index) => (
            <Card key={index} className={`p-4 ${getRiskColor(risk.level)}`}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-white">{risk.name}</h3>
                <Badge variant={risk.level === 'High' ? 'destructive' : 'secondary'} className={risk.level === 'Medium' ? 'bg-yellow-500/80' : ''}>{risk.level}</Badge>
              </div>
              <p className="text-3xl font-bold my-2 text-white">{risk.score}% <span className="text-lg font-normal">Risk</span></p>
              <p className="text-sm text-slate-300">{risk.description}</p>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Calendar /> Upcoming Maintenance Schedule</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analyticsData.maintenanceSchedule.map((item, index) => (
                <li key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded-md">
                  <div>
                    <p className="font-semibold text-white">{item.machine}</p>
                    <p className="text-sm text-slate-400">{item.task}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{item.date}</p>
                    <Badge variant={item.priority === 'High' ? 'destructive' : 'secondary'} className={item.priority === 'Medium' ? 'bg-yellow-500/80' : ''}>{item.priority}</Badge>
                  </div>
                </li>
              ))}
              {analyticsData.maintenanceSchedule.length === 0 && <p className="text-center text-slate-400 py-4">No high-risk maintenance scheduled.</p>}
            </ul>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white">{analyticsData.highRiskMachineName || 'Highest Risk Machine'} - Failure Probability</CardTitle></CardHeader>
          <CardContent className="h-72"><Line options={chartOptions('7-Day Forecast')} data={failureForecastData} /></CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader><CardTitle className="text-white">Maintenance Cost Avoidance</CardTitle></CardHeader>
        <CardContent className="h-80"><Bar options={chartOptions(`Estimated Savings: ${formatCurrency(analyticsData.costAvoidance)}`)} data={costAvoidanceData} /></CardContent>
      </Card>
    </motion.div>
  );
};

export default PredictiveMaintenance;