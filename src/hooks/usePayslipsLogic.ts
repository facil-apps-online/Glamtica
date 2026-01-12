import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePayslips, Payslip } from '@/hooks/usePayslips';
import { CommissionFilters } from '@/hooks/useEarnedCommissions';
import { invokeTenantAction } from './useTenantUsers';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Helper to convert data URL to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

// Mutation to sign a payslip
export const useSignPayslip = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: { payslip_id: string; google_drive_file_id: string; file_name: string; mime_type: string; file_size: number }) => invokeTenantAction('sign_payslip', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
    onError: (error) => {
      toast({
        title: "Error al firmar liquidación",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error signing payslip:', error);
    },
  });
};

// Hook to upload signature via the centralized Google Drive edge function
const useUploadSignature = () => {
    const { toast } = useToast();
  
    return useMutation({
      mutationFn: async ({ fileBase64, payslip, tenantId, branchId, userId, fileName, mimeType }: { fileBase64: string; payslip: Payslip, tenantId: string, branchId: string, userId: string, fileName: string, mimeType: string }) => {
        if (!userId) throw new Error("User is not authenticated.");
        if (!tenantId || !branchId) throw new Error("Tenant or branch information is missing.");
  
        const { data, error } = await supabase.functions.invoke('google-drive-upload', {
          body: {
            tenantId,
            branchId,
            userId,
            fileBase64,
            mimeType,
            fileName,
            uploadContext: 'PayslipSignature',
            contextId: payslip.id,
          },
        });
  
        if (error) throw new Error(error.message);
        return data; // This should contain fileId, proxyUrl, etc.
      },
      onError: (error) => {
        toast({
          title: "Error al subir la firma",
          description: error.message,
          variant: "destructive",
        });
        console.error('Error uploading signature via Edge Function:', error);
      },
    });
  };

export const usePayslipsLogic = () => {
  const [filters, setFilters] = useState<CommissionFilters>({});
  const { data: payslips, isLoading, error } = usePayslips(filters);
  const { session, tenantId } = useAuth();
  const signPayslipMutation = useSignPayslip();
  const uploadSignatureMutation = useUploadSignature();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [signDialogState, setSignDialogState] = useState({ open: false, payslipToSign: null as Payslip | null });
  const [viewDialogState, setViewDialogState] = useState({ open: false, payslipToView: null as Payslip | null });

  const handleSignClick = (payslip: Payslip) => {
    setSignDialogState({ open: true, payslipToSign: payslip });
  };

  const handleViewClick = (payslip: Payslip) => {
    setViewDialogState({ open: true, payslipToView: payslip });
  };

  const onSignConfirm = useCallback(async (signatureDataUrl: string) => {
    if (!signDialogState.payslipToSign || !tenantId || !session?.user.id) {
        toast({ title: "Error", description: "No se pudo obtener la información de la sesión. Por favor, recarga la página.", variant: "destructive" });
        return;
    };

    try {
      const payslip = signDialogState.payslipToSign;
      const fileName = `firma-liquidacion-${payslip.id}.png`;
      const signatureFile = dataURLtoFile(signatureDataUrl, fileName);
      const fileBase64 = await fileToBase64(signatureFile);

      const uploadData = await uploadSignatureMutation.mutateAsync({
        fileBase64,
        payslip,
        tenantId,
        branchId: payslip.branch_id,
        userId: session.user.id,
        fileName: signatureFile.name,
        mimeType: signatureFile.type,
      });

      await signPayslipMutation.mutateAsync({
        payslip_id: payslip.id,
        google_drive_file_id: uploadData.fileId,
        file_name: signatureFile.name,
        mime_type: signatureFile.type,
        file_size: signatureFile.size,
      });

      toast({ title: "Éxito", description: "La liquidación ha sido firmada y guardada.", variant: "success" });
      setSignDialogState({ open: false, payslipToSign: null });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });

    } catch (e) {
        // Error is already handled by the mutation's onError
        console.error("Failed to sign payslip:", e)
    }
  }, [signDialogState.payslipToSign, tenantId, session, uploadSignatureMutation, signPayslipMutation, toast, queryClient]);

  return {
    payslips,
    isLoading,
    error,
    filters,
    setFilters,
    handleSignClick,
    signDialogState,
    onSignConfirm,
    setSignDialogState,
    handleViewClick,
    viewDialogState,
    setViewDialogState,
    isSigning: uploadSignatureMutation.isPending || signPayslipMutation.isPending,
  };
};
