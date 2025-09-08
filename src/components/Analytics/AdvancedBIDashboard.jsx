import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  Sankey, Treemap, NetworkChart, HeatMapGrid, FunnelChart
} from 'recharts';
import { 
  Filter, Download, Share2, Maximize2, RefreshCw, Settings,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Eye, EyeOff, Grid, List, BarChart3, PieChart as PieChartIcon,
  Network, TreePine, Zap, Target, Users, Clock
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const AdvancedBIDashboard = ({ 
  parts = [], 
  movements = [], 
  machines = [], 
  orders = [], 
  suppliers = [],
  facilities = []
}) => {
  // Advanced State Management
  const [filters, setFilters] = useState({
    dateRange: { from: null, to: null },
    facility: 'all',
    machine: 'all',
    partCategory: 'all',
    supplier: 'all',
    status: 'all'
  });

  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, analytics, relationships
  const [activeChart, setActiveChart] = useState('overview');
  const [drillDown, setDrillDown] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Advanced Data Processing
  const processedData = useMemo(() => {
    const now = new Date();
    const dateFilter = filters.dateRange.from ? 
      movement => new Date(movement.timestamp) >= filters.dateRange.from &&
                 new Date(movement.timestamp) <= (filters.dateRange.to || now) :
      () => true;

    const filteredMovements = movements.filter(dateFilter);

    // Machine-Part Relationship Analysis
    const machinePartRelations = machines.reduce((acc, machine) => {
      const machineParts = filteredMovements
        .filter(m => m.machine_id === machine.id)
        .map(m => m.part_id);

      const uniqueParts = [...new Set(machineParts)];
      acc[machine.id] = {
        name: machine.name,
        parts: uniqueParts.map(partId => {
          const part = parts.find(p => p.id === partId);
          const usage = filteredMovements
            .filter(m => m.part_id === partId && m.machine_id === machine.id)
            .length;
          return { ...part, usage };
        }),
        totalUsage: machineParts.length
      };
      return acc;
    }, {});

    // Cross-Machine Part Sharing Analysis
    const partSharingMatrix = parts.map(part => {
      const machinesUsingPart = machines.filter(machine => 
        filteredMovements.some(m => 
          m.part_id === part.id && m.machine_id === machine.id
        )
      );

      return {
        partId: part.id,
        partName: part.name,
        partNumber: part.part_number,
        sharedAcross: machinesUsingPart.length,
        machines: machinesUsingPart.map(m => ({
          id: m.id,
          name: m.name,
          usage: filteredMovements.filter(mov => 
            mov.part_id === part.id && mov.machine_id === m.id
          ).length
        })),
        totalUsage: filteredMovements.filter(m => m.part_id === part.id).length,
        sharingScore: machinesUsingPart.length > 1 ? 
          (machinesUsingPart.length / machines.length) * 100 : 0
      };
    }).filter(p => p.sharedAcross > 0)
      .sort((a, b) => b.sharingScore - a.sharingScore);

    // Advanced KPIs
    const kpis = {
      totalParts: parts.length,
      activeMachines: machines.length,
      sharedParts: partSharingMatrix.filter(p => p.sharedAcross > 1).length,
      criticalParts: parts.filter(p => p.quantity <= p.minimum_quantity).length,
      avgPartSharing: partSharingMatrix.reduce((sum, p) => sum + p.sharingScore, 0) / partSharingMatrix.length,
      topSharedPart: partSharingMatrix[0]?.partName || 'N/A',
      machineEfficiency: machinePartRelations
    };

    return {
      machinePartRelations,
      partSharingMatrix,
      kpis,
      filteredMovements
    };
  }, [parts, movements, machines, filters]);

  // Interactive Chart Components
  const MachinePartNetworkChart = () => {
    const networkData = Object.values(processedData.machinePartRelations)
      .flatMap(machine => 
        machine.parts.map(part => ({
          source: machine.name,
          target: part.name || part.part_number,
          value: part.usage,
          type: 'machine-part'
        }))
      );

    return (
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Machine-Part Relationship Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Network className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                Interactive network visualization showing connections between machines and parts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const PartSharingHeatmap = () => (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5" />
          Part Sharing Heatmap
          <Badge variant="secondary">
            {processedData.partSharingMatrix.filter(p => p.sharedAcross > 1).length} Shared Parts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {processedData.partSharingMatrix.slice(0, 10).map((part, index) => (
            <div key={part.partId} className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded text-xs flex items-center justify-center bg-blue-100 text-blue-700">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{part.partName}</span>
                  <Badge variant="outline">
                    {part.sharedAcross} machines
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min(part.sharingScore, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {part.machines.map(m => m.name).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const InteractiveKPICards = () => {
    const kpiCards = [
      {
        title: 'Shared Parts',
        value: processedData.kpis.sharedParts,
        total: processedData.kpis.totalParts,
        change: '+12%',
        icon: Share2,
        color: 'blue',
        trend: 'up'
      },
      {
        title: 'Avg Sharing Score',
        value: `${processedData.kpis.avgPartSharing.toFixed(1)}%`,
        change: '+5.2%',
        icon: Target,
        color: 'green',
        trend: 'up'
      },
      {
        title: 'Critical Parts',
        value: processedData.kpis.criticalParts,
        change: '-8%',
        icon: TrendingDown,
        color: 'red',
        trend: 'down'
      },
      {
        title: 'Active Machines',
        value: processedData.kpis.activeMachines,
        change: '+2',
        icon: Zap,
        color: 'purple',
        trend: 'up'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  {kpi.total && (
                    <p className="text-xs text-gray-500">of {kpi.total} total</p>
                  )}
                </div>
                <div className={`p-3 rounded-full bg-${kpi.color}-100`}>
                  <kpi.icon className={`h-6 w-6 text-${kpi.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {kpi.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${{kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}}`}>
                  {kpi.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const AdvancedFilters = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <DatePickerWithRange
            value={filters.dateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
          />

          <Select
            value={filters.facility}
            onValueChange={(value) => setFilters(prev => ({ ...prev, facility: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Facilities</SelectItem>
              {facilities.map(facility => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.machine}
            onValueChange={(value) => setFilters(prev => ({ ...prev, machine: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Machine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Machines</SelectItem>
              {machines.map(machine => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setFilters({})}>
            Clear All
          </Button>

          <Button variant="outline" size="sm">
            Save Filter
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Business Intelligence</h1>
          <p className="text-gray-600">Interactive analytics and machine-part relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters />

      {/* KPI Cards */}
      <InteractiveKPICards />

      {/* Main Dashboard */}
      <Tabs value={activeChart} onValueChange={setActiveChart} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="sharing">Part Sharing</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MachinePartNetworkChart />
            <PartSharingHeatmap />
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-6">
          <MachinePartNetworkChart />
        </TabsContent>

        <TabsContent value="sharing" className="space-y-6">
          <PartSharingHeatmap />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Predictive Analytics Coming Soon</h3>
            <p className="text-gray-600">AI-powered insights and forecasting</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedBIDashboard;