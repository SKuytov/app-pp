import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, Package, Wrench, Truck, FileText, Users, Shield, Settings, AreaChart, PieChart, Activity, Boxes, BarChart3, ChevronDown, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Package, Wrench, Truck, FileText, Users, Shield, Settings, 
  AreaChart, PieChart, Activity, Boxes, BarChart3, ChevronDown, BrainCircuit,
  Network, TrendingUp  // 🎯 ADD THESE
} from 'lucide-react';

const NavTabs = ({ user, activeTab, setActiveTab }) => {
  const TABS_CONFIG = {
    dashboard: { label: 'Dashboard', icon: LayoutDashboard, roles: ['ceo', 'admin', 'technical_director'] },
    inventory: { label: 'Parts', icon: Package, roles: ['admin', 'head_technician', 'facility_tech', 'maintenance'] },
    machines: { label: 'Machines', icon: Wrench, roles: ['admin', 'technical_director', 'head_technician', 'facility_tech', 'maintenance'] },
    orders: { label: 'Orders', icon: Truck, roles: ['admin', 'technical_director', 'head_technician', 'facility_tech', 'maintenance'] },
    quotations: { label: 'Quotations', icon: FileText, roles: ['admin', 'technical_director'] },
    suppliers: { label: 'Contacts', icon: Users, roles: ['admin'] },
  };

  const ANALYTICS_TABS_CONFIG = {
    advanced_analytics: { label: 'Advanced BI', icon: BrainCircuit, roles: ['ceo', 'admin', 'technical_director'] },
  relationships: { label: 'Relations', icon: Activity, roles: ['admin', 'technical_director', 'head_technician'] },
    executive_dashboard: { label: 'Executive', icon: AreaChart, roles: ['ceo', 'admin'] },
    financial_analytics: { label: 'Financial', icon: PieChart, roles: ['ceo', 'admin'] },
    predictive_maintenance: { label: 'Predictive', icon: Activity, roles: ['admin', 'technical_director', 'head_technician'] },
    inventory_analytics: { label: 'Inventory', icon: Boxes, roles: ['admin'] },
    supplier_analytics: { label: 'Suppliers', icon: BarChart3, roles: ['admin'] },
  };

  const ADMIN_TABS_CONFIG = {
      credentials: { label: 'Users', icon: Shield, roles: ['admin'] },
      settings: { label: 'Settings', icon: Settings, roles: ['admin'] },
  }

  const userTabs = Object.entries(TABS_CONFIG)
    .filter(([, config]) => config.roles.includes(user.role))
    .map(([key, config]) => ({ value: key, ...config }));

  const userAnalyticsTabs = Object.entries(ANALYTICS_TABS_CONFIG)
    .filter(([, config]) => config.roles.includes(user.role))
    .map(([key, config]) => ({ value: key, ...config }));

  const userAdminTabs = Object.entries(ADMIN_TABS_CONFIG)
      .filter(([, config]) => config.roles.includes(user.role))
      .map(([key, config]) => ({ value: key, ...config }));


  return (
    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-11">
      {userTabs.map(tab => (
        <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2" onClick={() => setActiveTab(tab.value)}>
          <tab.icon className="h-5 w-5" />
          {tab.label}
        </TabsTrigger>
      ))}

      {userAnalyticsTabs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={Object.keys(ANALYTICS_TABS_CONFIG).includes(activeTab) ? "secondary" : "ghost"} className="flex items-center gap-2 w-full">
              <BrainCircuit className="h-5 w-5" />
              Analytics
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700 text-white">
            {userAnalyticsTabs.map(tab => (
              <DropdownMenuItem key={tab.value} onSelect={() => setActiveTab(tab.value)} className="cursor-pointer">
                <tab.icon className="mr-2 h-4 w-4" />
                <span>{tab.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {userAdminTabs.length > 0 && (
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant={Object.keys(ADMIN_TABS_CONFIG).includes(activeTab) ? "secondary" : "ghost"} className="flex items-center gap-2 w-full">
              <Settings className="h-5 w-5" />
              Admin
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700 text-white">
             {userAdminTabs.map(tab => (
              <DropdownMenuItem key={tab.value} onSelect={() => setActiveTab(tab.value)} className="cursor-pointer">
                <tab.icon className="mr-2 h-4 w-4" />
                <span>{tab.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </TabsList>
  );
};

export default NavTabs;