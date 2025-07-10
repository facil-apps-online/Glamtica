
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
import { useActiveStylists } from "@/hooks/useStylists";

interface ServiceCommissionsDialogProps {
  serviceId: string;
  serviceName: string;
  trigger?: React.ReactNode;
}

export const ServiceCommissionsDialog = ({ serviceId, serviceName, trigger }: ServiceCommissionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [stylistId, setStylistId] = useState("");
  const [commissionRate, setCommissionRate] = useState(0);
  const [canPerform, setCanPerform] = useState(true);

  const { data: commissions } = useServiceCommissions(serviceId);
  const { data: stylists } = useActiveStylists();
  const createMutation = useCreateServiceCommission();
  const updateMutation = useUpdateServiceCommission();
  const deleteMutation = useDeleteServiceCommission();

  // Filtrar estilistas que ya tienen comisión para este servicio
  const availableStylists = stylists?.filter(stylist => 
    !commissions?.some(commission => commission.stylist_id === stylist.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stylistId || commissionRate < 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        service_id: serviceId,
        stylist_id: stylistId,
        commission_rate: commissionRate,
        can_perform: canPerform,
      });
      resetForm();
    } catch (error) {
      console.error('Error creating service commission:', error);
    }
  };

  const handleUpdateCommission = async (id: string, field: string, value: number | boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        updates: { [field]: value },
      });
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
    setStylistId("");
    setCommissionRate(0);
    setCanPerform(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Comisiones
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Comisiones del Servicio: {serviceName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Lista de comisiones existentes */}
          <div className="space-y-3">
            <h4 className="font-medium">Estilistas Asignados</h4>
            {commissions && commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{commission.stylists?.name}</span>
                      <Badge variant={commission.can_perform ? "default" : "secondary"}>
                        {commission.can_perform ? 'Puede realizar' : 'No puede realizar'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Comisión %:</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commission.commission_rate}
                          onChange={(e) => handleUpdateCommission(
                            commission.id, 
                            'commission_rate', 
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-20"
                        />
                      </div>
                      <Switch
                        checked={commission.can_perform}
                        onCheckedChange={(checked) => handleUpdateCommission(
                          commission.id, 
                          'can_perform', 
                          checked
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCommission(commission.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No hay estilistas asignados a este servicio.</p>
            )}
          </div>

          {/* Formulario para agregar nueva comisión */}
          {availableStylists && availableStylists.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Agregar Estilista</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stylist">Estilista</Label>
                    <Select value={stylistId} onValueChange={setStylistId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona estilista" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStylists.map((stylist) => (
                          <SelectItem key={stylist.id} value={stylist.id}>
                            {stylist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">Comisión (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="can-perform"
                    checked={canPerform}
                    onCheckedChange={setCanPerform}
                  />
                  <Label htmlFor="can-perform">Puede realizar este servicio</Label>
                </div>

                <Button
                  type="submit"
                  disabled={createMutation.isPending || !stylistId}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Estilista
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
