import { useMutation, useQueryClient } from '@tanstack/react-query';
import { callTenantAction } from '@/lib/tenantActions';
import { useToast } from '@/hooks/use-toast';
import { DocumentSequence } from './useDocumentSequences'; // Import the type

// --- CREATE ---
export const useCreateDocumentSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sequenceData: Omit<DocumentSequence, 'id' | 'tenant_id' | 'created_at'>) => 
      callTenantAction('create_document_sequence', { sequenceData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_sequences'] });
      toast({ title: "Éxito", description: "Secuencia de numeración creada." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: 'destructive' });
    },
  });
};

// --- UPDATE ---
export const useUpdateDocumentSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ sequenceId, updates }: { sequenceId: string, updates: Partial<DocumentSequence> }) =>
      callTenantAction('update_document_sequence', { sequenceId, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_sequences'] });
      toast({ title: "Éxito", description: "Secuencia actualizada." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: 'destructive' });
    },
  });
};

// --- DELETE ---
export const useDeleteDocumentSequence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sequenceId: string) =>
      callTenantAction('delete_document_sequence', { sequenceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_sequences'] });
      toast({ title: "Éxito", description: "Secuencia eliminada." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: 'destructive' });
    },
  });
};
