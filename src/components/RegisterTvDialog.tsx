import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface RegisterTvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RegisterTvDialog: React.FC<RegisterTvDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [registrationCode, setRegistrationCode] = useState<string>('');
  const [tvDisplayId, setTvDisplayId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>(''); // This will likely come from context or JWT
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'register' | 'authorize'>('register');
  const { toast } = useToast();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('register_tv_display', { p_registration_code: registrationCode });
      if (error) {
        throw error;
      }
      setTvDisplayId(data as string);
      setStep('authorize');
      toast({
        title: "TV Registrada",
        description: "La TV ha sido registrada exitosamente. Ahora autorízala.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Error al registrar TV",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!tvDisplayId) return;
    setLoading(true);
    try {
      // In a real app, tenantId would come from the user's session/JWT
      // For now, we'll use a placeholder or fetch it if needed.
      // For demonstration, let's assume a default tenantId or fetch it from current user session
      const { data: userSession } = await supabase.auth.getSession();
      const currentTenantId = userSession?.session?.user?.app_metadata?.tenant_id || 'YOUR_DEFAULT_TENANT_ID'; // Replace with actual logic
      setTenantId(currentTenantId);

      const { error } = await supabase.rpc('authorize_tv_display', {
        p_tv_display_id: tvDisplayId,
        p_branch_id: branchId,
        p_tenant_id: currentTenantId,
      });
      if (error) {
        throw error;
      }
      toast({
        title: "TV Autorizada",
        description: "La TV ha sido autorizada y vinculada a la sucursal.",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error al autorizar TV",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 'register' ? 'Registrar Nueva TV' : 'Autorizar TV'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {step === 'register' ? (
            <div className="grid gap-2">
              <Label htmlFor="registrationCode">Código de Registro</Label>
              <Input
                id="registrationCode"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
                placeholder="Introduce el código de registro de la TV"
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="branchId">ID de Sucursal</Label>
              <Input
                id="branchId"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                placeholder="Introduce el ID de la sucursal"
              />
              {/* Tenant ID will be automatically determined */}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          {step === 'register' ? (
            <Button onClick={handleRegister} disabled={loading || !registrationCode}>
              {loading ? 'Registrando...' : 'Registrar TV'}
            </Button>
          ) : (
            <Button onClick={handleAuthorize} disabled={loading || !branchId}>
              {loading ? 'Autorizando...' : 'Autorizar TV'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterTvDialog;
