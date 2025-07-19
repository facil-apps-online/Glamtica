
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Trash2, Edit } from "lucide-react";
import { useStylists } from "@/hooks/useStylists";
import { 
  useProductCommissions, 
  useCreateProductCommission, 
  useUpdateProductCommission,
  useDeleteProductCommission 
} from "@/hooks/useProductCommissions";

interface ProductCommissionsDialogProps {
  productId: string;
  productName: string;
}

export const ProductCommissionsDialog = ({ productId, productName }: ProductCommissionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedStylistId, setSelectedStylistId] = useState("");
  const [commissionRate, setCommissionRate] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState(0);

  const { data: stylists } = useStylists();
  const { data: commissions, isLoading } = useProductCommissions(productId);
  const createMutation = useCreateProductCommission();
  const updateMutation = useUpdateProductCommission();
  const deleteMutation = useDeleteProductCommission();

  const availableStylists = stylists?.filter(stylist => 
    stylist.is_active && !commissions?.some(commission => commission.stylist_id === stylist.id)
  );

  const handleAddCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStylistId || commissionRate < 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        product_id: productId,
        stylist_id: selectedStylistId,
        commission_rate: commissionRate,
      });
      setSelectedStylistId("");
      setCommissionRate(0);
    } catch (error) {
      console.error('Error adding commission:', error);
    }
  };

  const handleUpdateCommission = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        commission_rate: editingRate,
        product_id: productId,
      });
      setEditingId(null);
      setEditingRate(0);
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
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Comisiones
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comisiones - {productName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Agregar nueva comisión */}
          {availableStylists && availableStylists.length > 0 && (
            <form onSubmit={handleAddCommission} className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Agregar Comisión</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estilista</Label>
                  <Select value={selectedStylistId} onValueChange={setSelectedStylistId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estilista" />
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
                  <Label>Comisión (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Comisión
              </Button>
            </form>
          )}

          {/* Lista de comisiones existentes */}
          <div className="space-y-4">
            <h3 className="font-medium">Comisiones Asignadas</h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando comisiones...</p>
            ) : commissions && commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{commission.stylists?.name}</span>
                      {editingId === commission.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editingRate}
                            onChange={(e) => setEditingRate(parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      ) : (
                        <Badge variant="secondary">
                          {commission.commission_rate}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === commission.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateCommission(commission.id)}
                            disabled={updateMutation.isPending}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(commission.id, commission.commission_rate)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCommission(commission.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay comisiones asignadas para este producto.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
