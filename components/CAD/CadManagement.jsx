import React from 'react';
import { motion } from 'framer-motion';
import { FolderGit2, HardHat, File, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CadManagement = ({ user }) => {
    const { toast } = useToast();

    const handleConnectSharePoint = () => {
        toast({
            title: "🚀 SharePoint Integration Coming Soon!",
            description: "To enable this, I'll need the Microsoft Graph API credentials. You can provide them in a future prompt!",
            duration: 5000,
        });
    };

    return (
        <motion.div
            key="cad"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <FolderGit2 className="h-8 w-8 text-blue-400" />
                    <h1 className="text-3xl font-bold text-white">CAD File Management</h1>
                </div>
                <Button onClick={handleConnectSharePoint}>Connect SharePoint/OneDrive</Button>
            </div>

            <Card className="bg-blue-900/20 border-blue-500/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-300">
                        <Info className="h-5 w-5" />
                        <span>How it Works</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-200">
                    <p>
                        This section will integrate directly with a shared folder in your organization's SharePoint or OneDrive account. Once connected, technical drawings (.dwg, .step, .pdf) will be accessible here and can be linked to machines and parts throughout the PartPulse system for quick reference during maintenance and ordering.
                    </p>
                </CardContent>
            </Card>

            <div className="mt-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Linked Folders (Example)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-slate-800/50 border-slate-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Machine Schematics</h3>
                            <HardHat className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 mt-2">Contains all primary machine design files.</p>
                        <p className="text-xs text-slate-500 mt-4">/Shared Documents/Technical/Machine_Schematics</p>
                    </Card>
                    <Card className="p-6 bg-slate-800/50 border-slate-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Part CAD Models</h3>
                            <File className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 mt-2">Individual part models for 3D viewing.</p>
                        <p className="text-xs text-slate-500 mt-4">/Shared Documents/Technical/Part_Models_CAD</p>
                    </Card>
                    <Card className="p-6 bg-slate-800/50 border-slate-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Assembly Diagrams</h3>
                            <FolderGit2 className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 mt-2">PDF diagrams for machine assemblies.</p>
                        <p className="text-xs text-slate-500 mt-4">/Shared Documents/Technical/Assembly_PDFs</p>
                    </Card>
                </div>
            </div>

        </motion.div>
    );
};

export default CadManagement;