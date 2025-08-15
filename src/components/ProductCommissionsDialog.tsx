
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Trash2, Edit } from "lucide-react";
import { useSchedulableUsers } from "@/hooks/useSchedulableUsers";
import { useProductCommissionsByProduct, useCreateProductCommission, useUpdateProductCommission, useDeleteProductCommission } from "@/hooks/useProductCommissions";
import { useAuth } from "@/contexts/AuthContext";

interface ProductCommissionsDialogProps {
  productId: string;
  productName: string;
}

export const ProductCommissionsDialog = ({ productId, productName }: ProductCommissionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [commissionRate, setCommissionRate] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState(0);
  const { currentAssignment } = useAuth();
  const branchId = currentAssignment?.branch_id;

  const { data: users } = useSchedulableUsers();
  const { data: commissions, isLoading } = useProductCommissionsByProduct(productId, branchId);
  const createMutation = useCreateProductCommission();
  const updateMutation = useUpdateProductCommission();
  const deleteMutation = useDeleteProductCommission();

  const availableUsers = users?.filter(user => 
    !commissions?.some(commission => commission.user_id === user.id)
  );

  const handleAddCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || commissionRate < 0 || !branchId) return;

    try {
      await createMutation.mutateAsync({
        product_id: productId,
        user_id: selectedUserId,
        branch_id: branchId,
        commission_rate: commissionRate,
      });
      setSelectedUserId("");
      setCommissionRate(0);
    } catch (error) {
      console.error('Error adding commission:', error);
    }
  };

  const handleUpdateCommission = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, commission_rate: editingRate });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating commission:', error);
    }
  };

  const handleDeleteCommission = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, product_id: productId });
    } catch (error) {
      console.error('Error deleting commission:', error);
    }
  };

  const startEditing = (id: string, currentRate: number) => {
    setEditingId(id);
    setEditingRate(currentRate);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" />Comisiones</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>Comisiones - {productName}</DialogTitle></DialogHeader>
        <div className="space-y-6">
          {availableUsers && availableUsers.length > 0 && (
            <form onSubmit={handleAddCommission} className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Agregar Comisión</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
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
                  <Label>Comisión (%)</Label>
                  <Input type="number" value={commissionRate} onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending}><Plus className="w-4 h-4 mr-2" />Agregar</Button>
            </form>
          )}
          <div className="space-y-4">
            <h3 className="font-medium">Comisiones Asignadas</h3>
            {isLoading ? <p>Cargando...</p> : commissions && commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{`${commission.users?.first_name || ''} ${commission.users?.last_name || ''}`.trim()}</span>
                    <div className="flex items-center gap-2">
                      {editingId === commission.id ? (
                        <>
                          <Input type="number" value={editingRate} onChange={(e) => setEditingRate(parseFloat(e.target.value) || 0)} className="w-20" />
                          <Button size="sm" onClick={() => handleUpdateCommission(commission.id)} disabled={updateMutation.isPending}>Guardar</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary">{commission.commission_rate}%</Badge>
                          <Button size="icon" variant="ghost" onClick={() => startEditing(commission.id, commission.commission_rate)}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteCommission(commission.id)} disabled={deleteMutation.isPending}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay comisiones asignadas.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
