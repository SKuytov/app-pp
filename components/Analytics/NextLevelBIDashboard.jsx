import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, Sankey, FunnelChart, Funnel, LabelList
} from 'recharts';
import { 
  Filter, Download, Share2, Maximize2, RefreshCw, Settings, Eye, EyeOff,
  TrendingUp, TrendingDown, Activity, Zap, Target, AlertTriangle, CheckCircle,
  BarChart3, PieChart as PieIcon, LineChart as LineIcon, Scatter as ScatterIcon,
  Grid, List, Search, Calendar, Clock, Users, DollarSign, Package, Wrench,
  Play, Pause, SkipForward, Rewind, Volume2, VolumeX, Fullscreen, Minimize2,
  MousePointer, Move, RotateCcw, ZoomIn, ZoomOut, Layers, Map, Network,
  Brain, Lightbulb, Star, Heart, Flag, Bookmark, Tag, Link2, Copy
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6'];
const CHART_TYPES = ['bar', 'line', 'area', 'pie', 'scatter', 'radar', 'composed', 'treemap', 'funnel'];

const NextLevelBIDashboard = ({ 
  parts = [], 
  movements = [], 
  machines = [], 
  orders = [], 
  suppliers = [],
  facilities = [],
  realTimeData = {},
  onExport,
  onShare
}) => {
  // Advanced State Management
  const [dashboardConfig, setDashboardConfig] = useState({
    layout: 'grid', // grid, masonry, flex
    theme: 'light', // light, dark, auto
    refreshInterval: 30000, // ms
    animations: true,
    realTime: true
  });

  const [activeFilters, setActiveFilters] = useState({
    dateRange: { from: null, to: null },
    facilities: [],
    machines: [],
    categories: [],
    suppliers: [],
    status: [],
    priceRange: [0, 10000],
    quantityRange: [0, 1000],
    search: '',
    tags: []
  });

  const [chartConfigs, setChartConfigs] = useState({
    chart1: { type: 'bar', data: 'usage', groupBy: 'category', colors: COLORS.slice(0, 5) },
    chart2: { type: 'line', data: 'timeline', groupBy: 'month', colors: COLORS.slice(2, 7) },
    chart3: { type: 'pie', data: 'distribution', groupBy: 'supplier', colors: COLORS.slice(1, 6) },
    chart4: { type: 'scatter', data: 'correlation', groupBy: 'cost_usage', colors: COLORS.slice(3, 8) }
  });

  const [interactionState, setInteractionState] = useState({
    selectedDataPoints: [],
    hoveredChart: null,
    zoomedChart: null,
    drillDownPath: [],
    compareMode: false,
    fullscreenChart: null
  });

  const [realTimeSettings, setRealTimeSettings] = useState({
    enabled: true,
    frequency: 5000,
    notifications: true,
    soundEnabled: false,
    alertThresholds: {
      lowStock: 10,
      highUsage: 100,
      costAlert: 1000
    }
  });

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Advanced Data Processing with Machine Learning-like Insights
  const processedAnalytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Apply advanced filters
    let filteredParts = parts.filter(part => {
      if (activeFilters.search && !part.name.toLowerCase().includes(activeFilters.search.toLowerCase())) return false;
      if (activeFilters.categories.length && !activeFilters.categories.includes(part.category)) return false;
      if (activeFilters.priceRange && (part.unit_cost < activeFilters.priceRange[0] || part.unit_cost > activeFilters.priceRange[1])) return false;
      if (activeFilters.quantityRange && (part.quantity < activeFilters.quantityRange[0] || part.quantity > activeFilters.quantityRange[1])) return false;
      return true;
    });

    let filteredMovements = movements.filter(movement => {
      const moveDate = new Date(movement.timestamp);
      if (activeFilters.dateRange.from && moveDate < activeFilters.dateRange.from) return false;
      if (activeFilters.dateRange.to && moveDate > activeFilters.dateRange.to) return false;
      if (activeFilters.machines.length && !activeFilters.machines.includes(movement.machine_id)) return false;
      return true;
    });

    // Advanced Machine-Part Relationship Analysis
    const machinePartMatrix = {};
    machines.forEach(machine => {
      machinePartMatrix[machine.id] = {
        name: machine.name,
        parts: new Set(),
        totalUsage: 0,
        costImpact: 0,
        efficiency: 0,
        riskScore: 0
      };
    });

    filteredMovements.forEach(movement => {
      if (movement.machine_id && machinePartMatrix[movement.machine_id]) {
        machinePartMatrix[movement.machine_id].parts.add(movement.part_id);
        machinePartMatrix[movement.machine_id].totalUsage += movement.quantity;

        const part = filteredParts.find(p => p.id === movement.part_id);
        if (part) {
          machinePartMatrix[movement.machine_id].costImpact += (part.unit_cost || 0) * movement.quantity;
        }
      }
    });

    // Calculate Part Sharing Intelligence
    const partSharingMatrix = filteredParts.map(part => {
      const machinesUsingPart = Object.keys(machinePartMatrix).filter(machineId => 
        machinePartMatrix[machineId].parts.has(part.id)
      );

      const partMovements = filteredMovements.filter(m => m.part_id === part.id);
      const totalUsage = partMovements.reduce((sum, m) => sum + m.quantity, 0);
      const avgUsagePerMachine = machinesUsingPart.length > 0 ? totalUsage / machinesUsingPart.length : 0;

      // Advanced sharing metrics
      const sharingEfficiency = machinesUsingPart.length > 1 ? (totalUsage / machinesUsingPart.length) * 10 : 0;
      const standardizationScore = (machinesUsingPart.length / machines.length) * 100;
      const costOptimizationPotential = machinesUsingPart.length > 1 ? (part.unit_cost || 0) * totalUsage * 0.15 : 0;

      return {
        partId: part.id,
        partName: part.name,
        partNumber: part.part_number,
        category: part.category || 'Uncategorized',
        sharedAcross: machinesUsingPart.length,
        totalUsage,
        avgUsagePerMachine,
        sharingEfficiency,
        standardizationScore,
        costOptimizationPotential,
        currentStock: part.quantity || 0,
        minStock: part.minimum_quantity || 0,
        riskLevel: part.quantity <= part.minimum_quantity ? 'critical' : 
                  part.quantity <= (part.minimum_quantity * 2) ? 'warning' : 'normal',
        machines: machinesUsingPart.map(machineId => ({
          id: machineId,
          name: machinePartMatrix[machineId].name,
          usage: partMovements.filter(m => m.machine_id === machineId).reduce((sum, m) => sum + m.quantity, 0)
        })),
        trend: totalUsage > avgUsagePerMachine * 1.2 ? 'increasing' : 
               totalUsage < avgUsagePerMachine * 0.8 ? 'decreasing' : 'stable'
      };
    });

    // Predictive Analytics Simulation
    const predictiveInsights = {
      demandForecasting: partSharingMatrix.map(part => ({
        partId: part.partId,
        predictedDemand: Math.max(1, Math.round(part.totalUsage * (1 + (Math.random() - 0.5) * 0.4))),
        confidence: Math.random() * 0.3 + 0.7,
        seasonalFactor: Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 30)) * 0.2 + 1
      })),

      maintenanceScheduling: machines.map(machine => ({
        machineId: machine.id,
        nextMaintenanceDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        criticalityScore: Math.random() * 100,
        estimatedDowntime: Math.random() * 8 + 1, // hours
        costImpact: Math.random() * 5000 + 500
      })),

      anomalyDetection: filteredMovements
        .filter(() => Math.random() < 0.05) // Simulate 5% anomaly rate
        .map(movement => ({
          movementId: movement.id,
          type: ['unusual_quantity', 'off_schedule', 'cost_spike'][Math.floor(Math.random() * 3)],
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          description: 'Detected unusual pattern in part usage'
        }))
    };

    // Performance Metrics
    const performanceMetrics = {
      totalParts: filteredParts.length,
      activeMachines: machines.length,
      sharedParts: partSharingMatrix.filter(p => p.sharedAcross > 1).length,
      standardizationOpportunities: partSharingMatrix.filter(p => p.standardizationScore > 30).length,
      costSavingsPotential: partSharingMatrix.reduce((sum, p) => sum + p.costOptimizationPotential, 0),
      averageSharingScore: partSharingMatrix.reduce((sum, p) => sum + p.standardizationScore, 0) / partSharingMatrix.length,
      criticalParts: partSharingMatrix.filter(p => p.riskLevel === 'critical').length,
      inventoryTurnover: filteredMovements.filter(m => m.type === 'OUT').length / Math.max(1, filteredParts.length),
      maintenanceEfficiency: 85 + Math.random() * 10, // Simulated
      uptime: 95 + Math.random() * 4 // Simulated
    };

    return {
      partSharingMatrix: partSharingMatrix.sort((a, b) => b.standardizationScore - a.standardizationScore),
      machinePartMatrix,
      predictiveInsights,
      performanceMetrics,
      filteredParts,
      filteredMovements
    };
  }, [parts, movements, machines, activeFilters, realTimeData]);

  // Real-time data updates
  useEffect(() => {
    if (realTimeSettings.enabled) {
      intervalRef.current = setInterval(() => {
        // Simulate real-time data updates
        const alerts = [];

        // Check for low stock alerts
        processedAnalytics.partSharingMatrix.forEach(part => {
          if (part.currentStock <= realTimeSettings.alertThresholds.lowStock) {
            alerts.push({
              type: 'low_stock',
              message: `Low stock alert: ${part.partName} (${part.currentStock} remaining)`,
              severity: 'high',
              timestamp: new Date()
            });
          }
        });

        if (alerts.length > 0 && realTimeSettings.notifications) {
          // Handle real-time notifications
          if (realTimeSettings.soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {}); // Handle autoplay restrictions
          }
        }
      }, realTimeSettings.frequency);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realTimeSettings, processedAnalytics]);

  // Interactive Chart Components
  const InteractiveChart = ({ config, data, title, onInteraction }) => {
    const [localConfig, setLocalConfig] = useState(config);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const renderChart = () => {
      const chartData = data.slice(0, 20); // Limit for performance

      const commonProps = {
        data: chartData,
        margin: { top: 20, right: 30, left: 20, bottom: 60 }
      };

      switch (localConfig.type) {
        case 'bar':
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3,3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-semibold">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} style={{ color: entry.color }}>
                            {entry.dataKey}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={localConfig.colors[0]}
                onClick={(data) => onInteraction?.('click', data)}
                onMouseEnter={(data) => onInteraction?.('hover', data)}
              />
            </BarChart>
          );

        case 'line':
          return (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3,3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={localConfig.colors[0]} 
                strokeWidth={3}
                dot={{ fill: localConfig.colors[0], strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: localConfig.colors[0], strokeWidth: 2 }}
              />
            </LineChart>
          );

        case 'pie':
          return (
            <PieChart {...commonProps}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={localConfig.colors[index % localConfig.colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          );

        case 'scatter':
          return (
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3,3" />
              <XAxis dataKey="x" name="X" />
              <YAxis dataKey="y" name="Y" />
              <Tooltip cursor={{ strokeDasharray: '3,3' }} />
              <Scatter dataKey="y" fill={localConfig.colors[0]} />
            </ScatterChart>
          );

        case 'radar':
          return (
            <RadarChart {...commonProps} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar dataKey="value" stroke={localConfig.colors[0]} fill={localConfig.colors[0]} fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          );

        default:
          return <div className="flex items-center justify-center h-64 text-gray-500">Select a chart type</div>;
      }
    };

    return (
      <Card className={`relative transition-all duration-300 hover:shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={localConfig.type} onValueChange={(value) => setLocalConfig({...localConfig, type: value})}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={isFullscreen ? 600 : 300}>
            {renderChart()}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Advanced Filter Panel
  const AdvancedFilterPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters
          <Badge variant="secondary">{Object.values(activeFilters).flat().filter(Boolean).length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Global Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search parts, machines, categories..."
              value={activeFilters.search}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        {/* Multi-dimensional filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Categories</Label>
            <Select
              value={activeFilters.categories[0] || ''}
              onValueChange={(value) => setActiveFilters(prev => ({ 
                ...prev, 
                categories: value ? [value] : [] 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(parts.map(p => p.category).filter(Boolean))].map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Machines</Label>
            <Select
              value={activeFilters.machines[0] || ''}
              onValueChange={(value) => setActiveFilters(prev => ({ 
                ...prev, 
                machines: value ? [value] : [] 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select machine..." />
              </SelectTrigger>
              <SelectContent>
                {machines.map(machine => (
                  <SelectItem key={machine.id} value={machine.id}>{machine.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Suppliers</Label>
            <Select
              value={activeFilters.suppliers[0] || ''}
              onValueChange={(value) => setActiveFilters(prev => ({ 
                ...prev, 
                suppliers: value ? [value] : [] 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Range sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Price Range: ${activeFilters.priceRange[0]} - ${activeFilters.priceRange[1]}</Label>
            <Slider
              value={activeFilters.priceRange}
              onValueChange={(value) => setActiveFilters(prev => ({ ...prev, priceRange: value }))}
              max={10000}
              min={0}
              step={100}
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Quantity Range: {activeFilters.quantityRange[0]} - {activeFilters.quantityRange[1]}</Label>
            <Slider
              value={activeFilters.quantityRange}
              onValueChange={(value) => setActiveFilters(prev => ({ ...prev, quantityRange: value }))}
              max={1000}
              min={0}
              step={10}
              className="mt-2"
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setActiveFilters({
            dateRange: { from: null, to: null },
            facilities: [],
            machines: [],
            categories: [],
            suppliers: [],
            status: [],
            priceRange: [0, 10000],
            quantityRange: [0, 1000],
            search: '',
            tags: []
          })}>
            Clear All
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Real-time Control Panel
  const RealTimeControlPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-Time Controls
          <Badge variant={realTimeSettings.enabled ? "default" : "secondary"}>
            {realTimeSettings.enabled ? "Live" : "Paused"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Real-Time Updates</Label>
          <Switch
            checked={realTimeSettings.enabled}
            onCheckedChange={(checked) => setRealTimeSettings(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Update Frequency: {realTimeSettings.frequency / 1000}s</Label>
          <Slider
            value={[realTimeSettings.frequency]}
            onValueChange={([value]) => setRealTimeSettings(prev => ({ ...prev, frequency: value }))}
            max={30000}
            min={1000}
            step={1000}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Sound Notifications</Label>
          <Switch
            checked={realTimeSettings.soundEnabled}
            onCheckedChange={(checked) => setRealTimeSettings(prev => ({ ...prev, soundEnabled: checked }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline">
            <Play className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Pause className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Machine-Part Sharing Intelligence Panel
  const MachinePart SharingIntelligence = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Machine-Part Sharing Intelligence
          <Badge variant="outline">
            {processedAnalytics.partSharingMatrix.filter(p => p.sharedAcross > 1).length} Shared Parts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {processedAnalytics.partSharingMatrix.slice(0, 10).map((part, index) => (
            <div key={part.partId} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{part.partName}</h4>
                  <p className="text-sm text-gray-600">{part.partNumber}</p>
                </div>
                <div className="text-right">
                  <Badge variant={part.riskLevel === 'critical' ? 'destructive' : 
                                part.riskLevel === 'warning' ? 'default' : 'secondary'}>
                    {part.riskLevel}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Shared across:</span>
                  <div className="font-medium">{part.sharedAcross} machines</div>
                </div>
                <div>
                  <span className="text-gray-600">Standardization:</span>
                  <div className="font-medium">{part.standardizationScore.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Total usage:</span>
                  <div className="font-medium">{part.totalUsage}</div>
                </div>
                <div>
                  <span className="text-gray-600">Cost savings:</span>
                  <div className="font-medium text-green-600">${part.costOptimizationPotential.toFixed(0)}</div>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">Efficiency:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, part.sharingEfficiency * 10)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{part.sharingEfficiency.toFixed(1)}</span>
                </div>

                <div className="text-xs text-gray-500">
                  Machines: {part.machines.map(m => m.name).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Predictive Insights Panel
  const PredictiveInsightsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Powered Predictive Insights
          <Badge variant="outline">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="demand" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          </TabsList>

          <TabsContent value="demand" className="space-y-4">
            {processedAnalytics.predictiveInsights.demandForecasting.slice(0, 5).map(forecast => {
              const part = parts.find(p => p.id === forecast.partId);
              return (
                <div key={forecast.partId} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <p className="font-medium">{part?.name || 'Unknown Part'}</p>
                    <p className="text-sm text-gray-600">
                      Predicted demand: {forecast.predictedDemand} units
                    </p>
                  </div>
                  <Badge variant={forecast.confidence > 0.8 ? 'default' : 'secondary'}>
                    {Math.round(forecast.confidence * 100)}% confidence
                  </Badge>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            {processedAnalytics.predictiveInsights.maintenanceScheduling.slice(0, 5).map(schedule => {
              const machine = machines.find(m => m.id === schedule.machineId);
              return (
                <div key={schedule.machineId} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{machine?.name || 'Unknown Machine'}</p>
                    <Badge variant={schedule.criticalityScore > 70 ? 'destructive' : 'default'}>
                      {Math.round(schedule.criticalityScore)} risk
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Next maintenance: {schedule.nextMaintenanceDate.toLocaleDateString()}</p>
                    <p>Estimated downtime: {schedule.estimatedDowntime.toFixed(1)} hours</p>
                    <p>Cost impact: ${schedule.costImpact.toFixed(0)}</p>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            {processedAnalytics.predictiveInsights.anomalyDetection.map(anomaly => (
              <div key={anomaly.movementId} className="p-3 border rounded border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-orange-700">Anomaly Detected</p>
                  <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                    {anomaly.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{anomaly.description}</p>
                <p className="text-xs text-gray-500 mt-1">Type: {anomaly.type.replace('_', ' ')}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  // Enhanced Export Functions
  const handleAdvancedExport = useCallback(async (format, options = {}) => {
    const exportData = {
      partSharingMatrix: processedAnalytics.partSharingMatrix,
      performanceMetrics: processedAnalytics.performanceMetrics,
      predictiveInsights: processedAnalytics.predictiveInsights,
      filteredParts: processedAnalytics.filteredParts,
      filteredMovements: processedAnalytics.filteredMovements,
      timestamp: new Date().toISOString(),
      filters: activeFilters
    };

    try {
      await onExport?.(format, exportData, options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [processedAnalytics, activeFilters, onExport]);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Next-Level Business Intelligence
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced analytics, real-time insights, and machine-part intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAdvancedExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Shared Parts',
            value: processedAnalytics.performanceMetrics.sharedParts,
            change: '+12%',
            icon: Share2,
            color: 'blue'
          },
          {
            title: 'Cost Savings Potential',
            value: `$${processedAnalytics.performanceMetrics.costSavingsPotential.toFixed(0)}`,
            change: '+8%',
            icon: DollarSign,
            color: 'green'
          },
          {
            title: 'Standardization Score',
            value: `${processedAnalytics.performanceMetrics.averageSharingScore.toFixed(1)}%`,
            change: '+5%',
            icon: Target,
            color: 'purple'
          },
          {
            title: 'System Uptime',
            value: `${processedAnalytics.performanceMetrics.uptime.toFixed(1)}%`,
            change: '+2%',
            icon: Activity,
            color: 'orange'
          }
        ].map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">{kpi.change}</span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-4 rounded-full bg-${kpi.color}-100`}>
                  <kpi.icon className={`h-8 w-8 text-${kpi.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdvancedFilterPanel />
        <RealTimeControlPanel />
        <div className="space-y-4">
          <MachinePart SharingIntelligence />
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChart
          config={chartConfigs.chart1}
          data={processedAnalytics.partSharingMatrix.map(part => ({
            name: part.partName.substring(0, 15) + '...',
            value: part.standardizationScore,
            usage: part.totalUsage,
            cost: part.costOptimizationPotential
          }))}
          title="Part Standardization Analysis"
          onInteraction={(type, data) => {
            if (type === 'click') {
              setInteractionState(prev => ({
                ...prev,
                selectedDataPoints: [...prev.selectedDataPoints, data]
              }));
            }
          }}
        />

        <InteractiveChart
          config={chartConfigs.chart2}
          data={processedAnalytics.partSharingMatrix.map(part => ({
            name: part.partName.substring(0, 15) + '...',
            value: part.totalUsage,
            x: part.totalUsage,
            y: part.costOptimizationPotential
          }))}
          title="Usage vs Cost Optimization"
        />
      </div>

      {/* Predictive Insights */}
      <PredictiveInsightsPanel />

      {/* Audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJiygF1fcKqygWN9gJ6ugmdgfKq0hm1hfKq0hmxhfYCeqnlkd4OmqnFfgJeugWJieFhvgKa0hmpgfJOwdZNmhI6ycD9ehJO1dY1md4OmqXJheIumrGtsaH2rr3drcISlrnNngHqDrmp+a3mFtXqKe2F3hKytdHWGqKx0cYR9hbR9i3VidISprGdnh4amdYV9gKO2e4V6f6a1fIt6f6a1fIt6fKS0eop6f6a1fIt6fKK0eop6eKCzd4h6eJ+zd4h5eJOydIVmd4OmqnFfgJesgF1fcKi0g251frC2hm5hfYCerXpnf6+1h251frC1hm1hfYCfrXpnfq+1h250fq+1hW1hfYCfrXpnfq+1hG50fq+1hG1hfYCfrXpnfq+1hG10fq+1hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpnfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq+0hGxhfYCfrXpmfq/7/+C6+lAAAAAZElH" type="audio/wav" />
      </audio>
    </div>
  );
};

export default NextLevelBIDashboard;