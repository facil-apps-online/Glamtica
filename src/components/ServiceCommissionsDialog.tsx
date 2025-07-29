
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
  const { data: users } = useSchedulableUsers();
  const createMutation = useCreateServiceCommission();
  const updateMutation = useUpdateServiceCommission();
  const deleteMutation = useDeleteServiceCommission();

  const availableUsers = users?.filter(user => 
    !commissions?.some(commission => commission.user_id === user.id)
  );

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

          {availableUsers && availableUsers.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Agregar Usuario</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">Usuario</Label>
                    <Select value={userId} onValueChange={setUserId}>
                      <SelectTrigger><SelectValue placeholder="Selecciona usuario" /></SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">Comisión (%)</Label>
                    <Input id="commission" type="number" value={commissionRate} onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)} required />
                  </div>
                </div>
                <Button type="submit" disabled={createMutation.isPending || !userId} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Usuario
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
