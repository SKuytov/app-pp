import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const useApiHandlers = (refreshData, user) => {
  const { toast } = useToast();

  const handleApiResponse = useCallback(({ data, error, successMessage, errorMessage }) => {
    if (error) {
      console.error(errorMessage, error);
      toast({ variant: "destructive", title: "Error", description: error.message || errorMessage });
      return { error };
    }
    if (successMessage) {
      toast({ title: "Success", description: successMessage });
    }
    return { data };
  }, [toast]);

  const uploadFile = async (file, bucket, path) => {
    if (!file) return { data: null, error: null };
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
    return { data, error };
  };

  const getPublicUrl = (bucket, path) => {
    if (!path) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePartSubmit = useCallback(async (partData) => {
    const { imageFile, cadFile, ...partDetails } = partData;
    const isEditing = !!partDetails.id;

    try {
        if (imageFile instanceof File) {
            const imagePath = `part_images/${user.id}/${uuidv4()}`;
            const { error: uploadError } = await uploadFile(imageFile, 'part_files', imagePath);
            if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
            partDetails.image_url = getPublicUrl('part_files', imagePath);
        }

        if (cadFile instanceof File) {
            const cadPath = `part_cad/${user.id}/${uuidv4()}`;
            const { error: uploadError } = await uploadFile(cadFile, 'part_files', cadPath);
            if (uploadError) throw new Error(`CAD upload failed: ${uploadError.message}`);
            partDetails.cad_url = getPublicUrl('part_files', cadPath);
        }
    
        const apiCall = isEditing
          ? supabase.from('parts').update(partDetails).eq('id', partDetails.id)
          : supabase.from('parts').insert([partDetails]);
    
        const { data, error } = await apiCall.select().single();

        if (error) throw error;
        
        handleApiResponse({
          data,
          successMessage: `Part ${isEditing ? 'updated' : 'added'} successfully.`,
        });

        refreshData(['parts', 'hotspots']);
        return { data };

    } catch (error) {
        return handleApiResponse({
            error,
            errorMessage: `Error ${isEditing ? 'updating' : 'adding'} part.`,
        });
    }
  }, [handleApiResponse, refreshData, user]);

  const handleDeletePart = useCallback(async (partId) => {
    const { error } = await supabase.from('parts').delete().eq('id', partId);
    handleApiResponse({
        error,
        successMessage: 'Part successfully deleted.',
        errorMessage: 'Error deleting part.'
    });
    if (!error) {
        refreshData(['parts', 'hotspots', 'movements', 'assemblyParts']);
    }
  }, [handleApiResponse, refreshData]);

  const recordPartUsage = useCallback(async (partId, quantity, machineId) => {
  if (!partId || !quantity || !user) {
    toast({ variant: "destructive", title: "Error", description: "Missing information for part usage." });
    return false;
  }

  try {
    // First, get current part quantity
    const { data: currentPart, error: fetchError } = await supabase
      .from('parts')
      .select('quantity')
      .eq('id', partId)
      .single();

    if (fetchError) {
      handleApiResponse({ error: fetchError, errorMessage: 'Could not fetch current part quantity.' });
      return false;
    }

    // Check if we have enough quantity
    const usageQuantity = parseInt(quantity);
    if (currentPart.quantity < usageQuantity) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Inventory", 
        description: `Not enough quantity available. Current: ${currentPart.quantity}, Requested: ${usageQuantity}` 
      });
      return false;
    }

    // Calculate new quantity
    const newQuantity = currentPart.quantity - usageQuantity;

    let description = "Used part";
    if (machineId) {
      const { data: machine, error: machineError } = await supabase
        .from('machines')
        .select('name')
        .eq('id', machineId)
        .single();

      if (machineError) {
        handleApiResponse({ error: machineError, errorMessage: 'Could not fetch machine name.' });
        return false;
      }
      description = `Used on ${machine.name}`;
    }

    // Create movement record
    const { error: movementError } = await supabase.from('part_movements').insert([{
      part_id: partId,
      user_id: user.id,
      user_name: user.username,
      machine_id: machineId || null,
      type: 'OUT',
      quantity: usageQuantity,
      description: description,
      timestamp: new Date().toISOString(),
    }]);

    if (movementError) {
      handleApiResponse({ error: movementError, errorMessage: "Error recording part movement." });
      return false;
    }

    // Update the part's current quantity
    const { error: updateError } = await supabase
      .from('parts')
      .update({quantity: newQuantity })
      .eq('id', partId);

    if (updateError) {
      handleApiResponse({ error: updateError, errorMessage: "Error updating part quantity." });
      return false;
    }

    refreshData(['parts', 'movements']);
    toast({ 
      title: "✅ Part Used Successfully", 
      description: `Quantity updated: ${currentPart.quantity} → ${newQuantity}` 
    });
    return true;

  } catch (error) {
    handleApiResponse({ error, errorMessage: "Error recording part usage." });
    return false;
  }
}, [handleApiResponse, refreshData, user, toast]);


  const restockPart = useCallback(async (partId, quantity) => {
  if (!partId || !quantity || !user) {
    toast({ variant: "destructive", title: "Error", description: "Missing information for restock." });
    return;
  }

  try {
    // First, get current part quantity
    const { data: currentPart, error: fetchError } = await supabase
      .from('parts')
      .select('quantity')
      .eq('id', partId)
      .single();

    if (fetchError) {
      handleApiResponse({ error: fetchError, errorMessage: "Error fetching current part data." });
      return;
    }

    // Calculate new quantity
    const newQuantity = (currentPart.quantity || 0) + parseInt(quantity);

    // Update part quantity and create movement record in a transaction-like approach
    const { error: movementError } = await supabase.from('part_movements').insert([{
      part_id: partId,
      user_id: user.id,
      user_name: user.username,
      type: 'IN',
      quantity: parseInt(quantity),
      description: 'Manual restock',
      timestamp: new Date().toISOString(),
    }]);

    if (movementError) {
      handleApiResponse({ error: movementError, errorMessage: "Error creating movement record." });
      return;
    }

    // Update the part's current quantity
    const { error: updateError } = await supabase
      .from('parts')
      .update({quantity: newQuantity })
      .eq('id', partId);

    if (updateError) {
      handleApiResponse({ error: updateError, errorMessage: "Error updating part quantity." });
      return;
    }

    handleApiResponse({ 
      successMessage: `Part restocked successfully. New quantity: ${newQuantity}`,
      errorMessage: null 
    });
    refreshData(['parts', 'movements']);

  } catch (error) {
    handleApiResponse({ error, errorMessage: "Error restocking part." });
  }
}, [handleApiResponse, refreshData, toast, user]);

  const handleMachineSubmit = useCallback(async ({ machineData, assembliesData }) => {
    const isEditing = !!machineData.id;
    let machineResult;
    if (isEditing) {
        machineResult = await supabase.from('machines').update(machineData).eq('id', machineData.id).select().single();
    } else {
        machineResult = await supabase.from('machines').insert(machineData).select().single();
    }

    const { data: machine, error: machineError } = machineResult;

    if (machineError) {
        return handleApiResponse({ error: machineError, errorMessage: `Error ${isEditing ? 'updating' : 'creating'} machine.` });
    }

    if (assembliesData && assembliesData.length > 0) {
        const processNode = async (node, parentId = null) => {
            const { children, drawing_file, ...assemblyDetails } = node;
            
            if (drawing_file instanceof File) {
                const drawingPath = `assembly_drawings/${machine.id}/${uuidv4()}`;
                const { error: uploadError } = await uploadFile(drawing_file, 'part_files', drawingPath);
                if (uploadError) throw uploadError;
                assemblyDetails.drawing_url = getPublicUrl('part_files', drawingPath);
            }

            let savedAssembly;
            if (assemblyDetails.id && !String(assemblyDetails.id).startsWith('new_')) {
                const { data, error } = await supabase.from('machine_assemblies').update({ ...assemblyDetails, parent_assembly_id: parentId, machine_id: machine.id }).eq('id', assemblyDetails.id).select().single();
                if (error) throw error;
                savedAssembly = data;
            } else {
                const { id, ...newAssemblyData } = assemblyDetails;
                const { data, error } = await supabase.from('machine_assemblies').insert({ ...newAssemblyData, parent_assembly_id: parentId, machine_id: machine.id }).select().single();
                if (error) throw error;
                savedAssembly = data;
            }

            if (children && children.length > 0) {
                for (const childNode of children) {
                    await processNode(childNode, savedAssembly.id);
                }
            }
        };

        try {
            for (const rootNode of assembliesData) {
                await processNode(rootNode);
            }
        } catch (assemblyError) {
            return handleApiResponse({ error: assemblyError, errorMessage: 'Error saving assembly structure.' });
        }
    }

    refreshData(['machines', 'assemblies']);
    return handleApiResponse({ data: machine, successMessage: `Machine ${isEditing ? 'updated' : 'created'} successfully.` });
  }, [handleApiResponse, refreshData]);

  const handleDeleteMachine = useCallback(async (machineId) => {
    const { error } = await supabase.from('machines').delete().eq('id', machineId);
    handleApiResponse({ error, errorMessage: "Error deleting machine." });
    if (!error) refreshData(['machines', 'assemblies', 'hotspots']);
  }, [handleApiResponse, refreshData]);

  const handleFacilitySubmit = useCallback(async (facilityData, isEditing) => {
    const apiCall = isEditing
      ? supabase.from('facilities').update(facilityData).eq('id', facilityData.id)
      : supabase.from('facilities').insert([facilityData]);
    const { data, error } = await apiCall.select().single();
    const result = handleApiResponse({ data, error, successMessage: `Facility ${isEditing ? 'updated' : 'added'}.`, errorMessage: "Error saving facility." });
    if (!error) refreshData(['facilities']);
    return result;
  }, [handleApiResponse, refreshData]);

  const handleDeleteFacility = useCallback(async (facilityId) => {
    const { error } = await supabase.from('facilities').delete().eq('id', facilityId);
    handleApiResponse({ error, errorMessage: "Error deleting facility." });
    if (!error) refreshData(['facilities']);
  }, [handleApiResponse, refreshData]);

  const handleBomUpdate = useCallback(async (hotspotData) => {
    let response;
    // The `_delete` property is a flag to signify deletion.
    if (hotspotData._delete) {
        if (!hotspotData.id) {
            return handleApiResponse({ error: { message: "No ID provided for deletion." }, errorMessage: "Failed to update BOM."});
        }
        response = await supabase.from('drawing_hotspots').delete().eq('id', hotspotData.id);
    } else if (hotspotData.id && !String(hotspotData.id).startsWith('temp-')) {
        response = await supabase.from('drawing_hotspots').update(hotspotData).eq('id', hotspotData.id).select().single();
    } else {
        const { id, ...insertData } = hotspotData;
        response = await supabase.from('drawing_hotspots').insert(insertData).select().single();
    }
    
    const { data, error } = response;
    if (error) {
      return handleApiResponse({ error, errorMessage: "Failed to update BOM." });
    }
    
    // Always refresh hotspots after any successful BOM update.
    refreshData(['hotspots']);
    return { data, error: null };
  }, [refreshData, handleApiResponse]);

  const handleCreateOrder = useCallback(async (orderData) => {
    const { error } = await supabase.from('orders').insert([orderData]);
    handleApiResponse({ error, successMessage: "Order created successfully.", errorMessage: "Error creating order." });
    if (!error) refreshData(['orders']);
  }, [handleApiResponse, refreshData]);

  const handleUpdateOrder = useCallback(async (orderId, updates) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
    handleApiResponse({ error, successMessage: "Order updated.", errorMessage: "Error updating order." });
    if (!error) refreshData(['orders', 'quotations']);
  }, [handleApiResponse, refreshData]);

  const handleUpdateOrderStatus = useCallback(async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    handleApiResponse({ error, successMessage: `Order status updated to ${status}.`, errorMessage: "Error updating order status." });
    if (!error) refreshData(['orders']);
  }, [handleApiResponse, refreshData]);

  const handleAddSupplier = useCallback(async (supplierData) => {
    const { error } = await supabase.from('suppliers').insert([supplierData]);
    handleApiResponse({ error, successMessage: "Supplier added.", errorMessage: "Error adding supplier." });
    if (!error) refreshData(['suppliers']);
  }, [handleApiResponse, refreshData]);

  const handleEditSupplier = useCallback(async (supplierData) => {
    const { error } = await supabase.from('suppliers').update(supplierData).eq('id', supplierData.id);
    handleApiResponse({ error, successMessage: "Supplier updated.", errorMessage: "Error updating supplier." });
    if (!error) refreshData(['suppliers']);
  }, [handleApiResponse, refreshData]);

  return {
    handlePartSubmit,
    handleDeletePart,
    recordPartUsage,
    restockPart,
    handleMachineSubmit,
    handleDeleteMachine,
    handleFacilitySubmit,
    handleDeleteFacility,
    handleBomUpdate,
    handleCreateOrder,
    handleUpdateOrder,
    handleUpdateOrderStatus,
    handleAddSupplier,
    handleEditSupplier,
  };
};