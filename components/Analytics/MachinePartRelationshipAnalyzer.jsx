import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ScatterChart, Scatter, TreeMapChart, TreeMap
} from 'recharts';
import { 
  Network, Share2, AlertTriangle, TrendingUp, Search, Filter,
  Download, Eye, EyeOff, Maximize2, Grid, List, BarChart3,
  Zap, Settings, RefreshCw, Star, AlertCircle
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const MachinePartRelationshipAnalyzer = ({ 
  machines = [], 
  parts = [], 
  movements = [], 
  onExport 
}) => {
  const [viewMode, setViewMode] = useState('sharing'); // sharing, usage, critical, network
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [selectedPart, setSelectedPart] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('sharingScore');
  const [showDetails, setShowDetails] = useState(false);

  // Advanced analysis of machine-part relationships
  const analysisData = useMemo(() => {
    // Part sharing analysis
    const partSharingAnalysis = parts.map(part => {
      const machinesUsingPart = machines.filter(machine => 
        movements.some(m => m.part_id === part.id && m.machine_id === machine.id)
      );

      const partMovements = movements.filter(m => m.part_id === part.id);
      const totalUsage = partMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
      const lastUsed = partMovements.length > 0 ? 
        new Date(Math.max(...partMovements.map(m => new Date(m.timestamp)))) : null;

      return {
        partId: part.id,
        partName: part.name,
        partNumber: part.part_number,
        category: part.main_group || part.category,
        currentQuantity: part.quantity || 0,
        minQuantity: part.minimum_quantity || 0,
        unitCost: part.unit_cost || 0,
        sharedAcross: machinesUsingPart.length,
        machines: machinesUsingPart.map(m => ({
          id: m.id,
          name: m.name,
          usage: partMovements.filter(mov => mov.machine_id === m.id && mov.type === 'OUT')
            .reduce((sum, mov) => sum + mov.quantity, 0)
        })),
        totalUsage,
        lastUsed,
        sharingScore: machinesUsingPart.length > 1 ? 
          (machinesUsingPart.length / machines.length) * 100 : 0,
        riskLevel: part.quantity <= part.minimum_quantity ? 'critical' : 
                  part.quantity <= (part.minimum_quantity * 2) ? 'warning' : 'normal',
        costImpact: (part.unit_cost || 0) * totalUsage,
        sharingEfficiency: machinesUsingPart.length > 1 ? 
          totalUsage / machinesUsingPart.length : 0
      };
    }).filter(p => p.sharedAcross > 0);

    // Machine dependency analysis
    const machineDependencyAnalysis = machines.map(machine => {
      const machineParts = movements
        .filter(m => m.machine_id === machine.id && m.type === 'OUT')
        .reduce((acc, m) => {
          const part = parts.find(p => p.id === m.part_id);
          if (part) {
            if (!acc[m.part_id]) {
              acc[m.part_id] = {
                ...part,
                usage: 0,
                lastUsed: null
              };
            }
            acc[m.part_id].usage += m.quantity;
            const moveDate = new Date(m.timestamp);
            if (!acc[m.part_id].lastUsed || moveDate > acc[m.part_id].lastUsed) {
              acc[m.part_id].lastUsed = moveDate;
            }
          }
          return acc;
        }, {});

      const partsArray = Object.values(machineParts);
      const criticalParts = partsArray.filter(p => p.quantity <= p.minimum_quantity);
      const totalCost = partsArray.reduce((sum, p) => sum + ((p.unit_cost || 0) * p.usage), 0);
      const avgUsagePerPart = partsArray.length > 0 ? 
        partsArray.reduce((sum, p) => sum + p.usage, 0) / partsArray.length : 0;

      return {
        machineId: machine.id,
        machineName: machine.name,
        machineType: machine.type || 'Unknown',
        totalParts: partsArray.length,
        criticalParts: criticalParts.length,
        totalCost,
        avgUsagePerPart,
        parts: partsArray.sort((a, b) => b.usage - a.usage),
        riskScore: (criticalParts.length / Math.max(partsArray.length, 1)) * 100,
        dependencyScore: partsArray.filter(p => p.usage > avgUsagePerPart * 1.5).length,
        lastActivity: partsArray.length > 0 ? 
          new Date(Math.max(...partsArray.map(p => p.lastUsed || 0))) : null
      };
    });

    // Cross-machine optimization opportunities
    const optimizationOpportunities = partSharingAnalysis
      .filter(p => p.sharedAcross > 1 && p.sharingScore > 20)
      .map(part => {
        const potentialSavings = part.machines.length > 1 ? 
          (part.unitCost * part.totalUsage) * 0.15 : 0; // Assume 15% savings from standardization

        return {
          ...part,
          potentialSavings,
          optimizationType: part.sharingScore > 50 ? 'standardization' : 'consolidation',
          priority: part.riskLevel === 'critical' ? 'high' : 
                   part.costImpact > 1000 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => b.potentialSavings - a.potentialSavings);

    return {
      partSharingAnalysis,
      machineDependencyAnalysis,
      optimizationOpportunities,
      summary: {
        totalParts: parts.length,
        sharedParts: partSharingAnalysis.filter(p => p.sharedAcross > 1).length,
        criticalParts: partSharingAnalysis.filter(p => p.riskLevel === 'critical').length,
        highValueParts: partSharingAnalysis.filter(p => p.costImpact > 1000).length,
        avgSharingScore: partSharingAnalysis.reduce((sum, p) => sum + p.sharingScore, 0) / partSharingAnalysis.length,
        totalOptimizationValue: optimizationOpportunities.reduce((sum, o) => sum + o.potentialSavings, 0)
      }
    };
  }, [machines, parts, movements]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let filtered = analysisData.partSharingAnalysis;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMachine !== 'all') {
      filtered = filtered.filter(item =>
        item.machines.some(m => m.id === selectedMachine)
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'sharingScore':
          return b.sharingScore - a.sharingScore;
        case 'usage':
          return b.totalUsage - a.totalUsage;
        case 'cost':
          return b.costImpact - a.costImpact;
        case 'machines':
          return b.sharedAcross - a.sharedAcross;
        default:
          return b.sharingScore - a.sharingScore;
      }
    });

    return filtered;
  }, [analysisData, searchTerm, selectedMachine, sortBy]);

  // Chart components
  const PartSharingChart = () => {
    const chartData = filteredData.slice(0, 10).map(part => ({
      name: part.partName.length > 15 ? part.partName.substring(0, 15) + '...' : part.partName,
      sharingScore: part.sharingScore,
      machines: part.sharedAcross,
      usage: part.totalUsage,
      cost: part.costImpact
    }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3,3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'sharingScore') return [`${value.toFixed(1)}%`, 'Sharing Score'];
              if (name === 'cost') return [`$${value.toFixed(0)}`, 'Cost Impact'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="sharingScore" fill="#3b82f6" name="Sharing Score (%)" />
          <Bar dataKey="machines" fill="#10b981" name="Machine Count" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const MachineDependencyChart = () => {
    const chartData = analysisData.machineDependencyAnalysis.map(machine => ({
      name: machine.machineName,
      totalParts: machine.totalParts,
      criticalParts: machine.criticalParts,
      riskScore: machine.riskScore,
      totalCost: machine.totalCost
    }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={chartData}>
          <CartesianGrid strokeDasharray="3,3" />
          <XAxis 
            dataKey="totalParts" 
            name="Total Parts"
            label={{ value: 'Total Parts', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            dataKey="riskScore" 
            name="Risk Score"
            label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3,3' }}
            formatter={(value, name, props) => {
              if (name === 'riskScore') return [`${value.toFixed(1)}%`, 'Risk Score'];
              if (name === 'totalCost') return [`$${value.toFixed(0)}`, 'Total Cost'];
              return [value, name];
            }}
            labelFormatter={(label, payload) => {
              return payload[0]?.payload.name || 'Machine';
            }}
          />
          <Scatter 
            dataKey="riskScore" 
            fill="#ef4444"
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  const OptimizationOpportunitiesTable = () => (
    <div className="space-y-4">
      {analysisData.optimizationOpportunities.slice(0, 10).map((opportunity, index) => (
        <Card key={opportunity.partId} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge variant={opportunity.priority === 'high' ? 'destructive' : 
                              opportunity.priority === 'medium' ? 'default' : 'secondary'}>
                  {opportunity.priority} priority
                </Badge>
                <h4 className="font-semibold">{opportunity.partName}</h4>
                <span className="text-sm text-gray-500">({opportunity.partNumber})</span>
              </div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Shared across:</span>
                  <span className="font-medium ml-1">{opportunity.sharedAcross} machines</span>
                </div>
                <div>
                  <span className="text-gray-600">Total usage:</span>
                  <span className="font-medium ml-1">{opportunity.totalUsage} units</span>
                </div>
                <div>
                  <span className="text-gray-600">Cost impact:</span>
                  <span className="font-medium ml-1">${opportunity.costImpact.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Potential savings:</span>
                  <span className="font-medium ml-1 text-green-600">
                    ${opportunity.potentialSavings.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  Machines: {opportunity.machines.map(m => m.name).join(', ')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline">
                {opportunity.optimizationType}
              </Badge>
              {opportunity.riskLevel === 'critical' && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Machine-Part Relationship Analysis</h2>
          <p className="text-muted-foreground">
            Analyze part sharing patterns and optimization opportunities across machines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onExport?.(analysisData)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shared Parts</p>
                <p className="text-2xl font-bold">{analysisData.summary.sharedParts}</p>
                <p className="text-xs text-gray-500">
                  of {analysisData.summary.totalParts} total
                </p>
              </div>
              <Share2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Sharing Score</p>
                <p className="text-2xl font-bold">
                  {analysisData.summary.avgSharingScore?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500">across all parts</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Parts</p>
                <p className="text-2xl font-bold">{analysisData.summary.criticalParts}</p>
                <p className="text-xs text-gray-500">need attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optimization Value</p>
                <p className="text-2xl font-bold">
                  ${analysisData.summary.totalOptimizationValue?.toFixed(0) || 0}
                </p>
                <p className="text-xs text-gray-500">potential savings</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select machine..." />
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sharingScore">Sharing Score</SelectItem>
                <SelectItem value="usage">Usage Count</SelectItem>
                <SelectItem value="cost">Cost Impact</SelectItem>
                <SelectItem value="machines">Machine Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sharing">Part Sharing</TabsTrigger>
          <TabsTrigger value="dependency">Machine Dependency</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="network">Network View</TabsTrigger>
        </TabsList>

        <TabsContent value="sharing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Part Sharing Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <PartSharingChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Machine Dependency Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <MachineDependencyChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Opportunities</CardTitle>
              <p className="text-sm text-gray-600">
                Ranked by potential cost savings from part standardization and consolidation
              </p>
            </CardHeader>
            <CardContent>
              <OptimizationOpportunitiesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Machine-Part Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <Network className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Network View</h3>
                  <p className="text-gray-600">
                    Visualize connections between machines and shared parts
                  </p>
                  <Button className="mt-4">
                    Enable Network Visualization
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MachinePartRelationshipAnalyzer;