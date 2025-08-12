
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Users } from "lucide-react";
import { useServiceCommissions, useCreateServiceCommission, useUpdateServiceCommission, useDeleteServiceCommission } from "@/hooks/useServiceCommissions";
import { useSchedulableUsers } from "@/hooks/useSchedulableUsers";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceCommissionsDialogProps {
  serviceId: string;
  serviceName: string;
  trigger?: React.ReactNode;
}

export const ServiceCommissionsDialog = ({ serviceId, serviceName, trigger }: ServiceCommissionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [commissionRate, setCommissionRate] = useState(0);
  const { currentAssignment } = useAuth();
  const branchId = currentAssignment?.branch_id;

  const { data: commissions } = useServiceCommissions(serviceId, branchId);
  
  const createMutation = useCreateServiceCommission();
  const updateMutation = useUpdateServiceCommission();
  const deleteMutation = useDeleteServiceCommission();

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || commissionRate < 0 || !branchId) return;

    try {
      await createMutation.mutateAsync({
        service_id: serviceId,
        user_id: userId,
        branch_id: branchId,
        commission_rate: commissionRate,
      });
      resetForm();
    } catch (error) {
      console.error('Error creating service commission:', error);
    }
  };

  const handleUpdateCommission = async (id: string, value: number) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { commission_rate: value } });
    } catch (error) {
      console.error('Error updating commission:', error);
    }
  };

  const handleDeleteCommission = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting commission:', error);
    }
  };

  const handleToggleCanPerform = async (id: string, canPerform: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { can_perform: canPerform } });
    } catch (error) {
      console.error('Error updating can_perform:', error);
    }
  };

  const resetForm = () => {
    setUserId("");
    setCommissionRate(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm"><Users className="w-4 h-4 mr-2" />Comisiones</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Comisiones del Servicio: {serviceName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-medium">Usuarios Asignados</h4>
            {commissions && commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{`${commission.users?.first_name || ''} ${commission.users?.last_name || ''}`.trim()}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id={`can-perform-${commission.id}`} 
                          checked={commission.can_perform}
                          onCheckedChange={(checked) => handleToggleCanPerform(commission.id, checked)}
                          disabled={updateMutation.isPending}
                        />
                        <Label htmlFor={`can-perform-${commission.id}`} className="text-xs">Puede Realizar</Label>
                      </div>
                      <Label className="text-xs">Comisión %:</Label>
                      <Input
                        type="number"
                        value={commission.commission_rate}
                        onChange={(e) => handleUpdateCommission(commission.id, parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCommission(commission.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No hay usuarios asignados a este servicio.</p>
            )}
          </div>

          
        </div>
      </DialogContent>
    </Dialog>
  );
};
