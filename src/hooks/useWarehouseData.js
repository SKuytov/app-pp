import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useWarehouseData = () => {
    const [data, setData] = useState({
        parts: [],
        orders: [],
        suppliers: [],
        machines: [],
        quotations: [],
        facilities: [],
        movements: [],
        assemblies: [],
        assemblyParts: [],
        hotspots: [],
        maintenanceHistory: [],
    });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (tablesToRefresh = null) => {
        const isInitialLoad = !tablesToRefresh;
        if (isInitialLoad) {
            setLoading(true);
        }
        try {
            const { data: warehouseData, error } = await supabase.rpc('get_warehouse_data');
            if (error) throw error;
            
            // Full reload on any refresh request for simplicity and data consistency
            setData({
                parts: warehouseData.parts || [],
                orders: warehouseData.orders || [],
                suppliers: warehouseData.suppliers || [],
                machines: warehouseData.machines || [],
                quotations: warehouseData.quotations || [],
                facilities: warehouseData.facilities || [],
                movements: warehouseData.movements || [],
                assemblies: warehouseData.assemblies || [],
                assemblyParts: warehouseData.assembly_parts || [],
                hotspots: warehouseData.hotspots || [],
                maintenanceHistory: warehouseData.maintenance_history || [],
            });

        } catch (error) {
            console.error('Error fetching warehouse data:', error);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const lowStockParts = useMemo(() => (data.parts || []).filter(part => part.quantity <= part.min_stock), [data.parts]);

    return {
        ...data,
        lowStockParts,
        loading,
        refreshData: fetchData,
    };
};