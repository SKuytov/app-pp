import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const IntegrationCard = ({ title, description, icon, status, onConnect }) => {
  const Icon = icon;
  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="bg-slate-700 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <CardTitle className="text-white">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow text-slate-400">
        <p>{description}</p>
      </CardContent>
      <CardFooter>
        {status === 'connected' ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span>Connected</span>
          </div>
        ) : (
          <Button onClick={onConnect}>Connect</Button>
        )}
      </CardFooter>
    </Card>
  );
};

const SharePointConnectModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Connect to SharePoint / OneDrive</DialogTitle>
          <DialogDescription className="text-slate-400 pt-2">
            To connect your SharePoint or OneDrive files, you need to create an App Registration in your Microsoft Azure portal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <p>Follow these steps in <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Azure Active Directory</a>:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>Go to <strong>App registrations</strong> and click <strong>New registration</strong>.</li>
            <li>Give it a name (e.g., "PartPulse Integration").</li>
            <li>For "Supported account types," select "Accounts in this organizational directory only."</li>
            <li>Under "Redirect URI," select "Single-page application (SPA)" and enter this exact URL: <code className="bg-slate-700 p-1 rounded text-xs">{window.location.origin}</code></li>
            <li>Click <strong>Register</strong>.</li>
            <li>Go to <strong>API permissions</strong>, click <strong>Add a permission</strong>, select <strong>Microsoft Graph</strong>, then <strong>Delegated permissions</strong>.</li>
            <li>Add the following permissions: <code className="bg-slate-700 p-1 rounded text-xs">Files.ReadWrite.All</code> and <code className="bg-slate-700 p-1 rounded text-xs">User.Read</code>.</li>
            <li>Click <strong>Grant admin consent for [Your Organization]</strong>.</li>
            <li>From the <strong>Overview</strong> page, copy the <strong>Application (client) ID</strong> and provide it to your administrator.</li>
          </ol>
          <div className="flex items-start gap-3 bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/50">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
            <p className="text-yellow-300">
              This is a complex integration. Once you have the Client ID, please contact support or your developer to complete the connection.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const IntegrationsTab = () => {
  const { toast } = useToast();
  const [isSharePointModalOpen, setIsSharePointModalOpen] = useState(false);

  const handleSharePointConnect = () => {
    setIsSharePointModalOpen(true);
  };

  return (
    <motion.div
      key="integrations"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Share2 className="h-8 w-8" />
          Integrations
        </h2>
      </div>
      <p className="text-slate-400 mb-8 max-w-2xl">
        Connect PartPulse to other services to streamline your workflow, sync data, and unlock new capabilities.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <IntegrationCard
          title="SharePoint & OneDrive"
          description="Access and link technical drawings, manuals, and other documents directly from your company's SharePoint or OneDrive."
          icon={Key}
          status="disconnected"
          onConnect={handleSharePointConnect}
        />
      </div>

      <SharePointConnectModal isOpen={isSharePointModalOpen} onClose={() => setIsSharePointModalOpen(false)} />
    </motion.div>
  );
};

export default IntegrationsTab;