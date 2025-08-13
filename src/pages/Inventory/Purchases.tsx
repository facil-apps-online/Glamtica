import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { Plus, CheckCircle2 } from "lucide-react";
import { usePurchases } from "@/hooks/usePurchases";
import { useCompletePurchase } from "@/hooks/useCompletePurchase";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { Badge } from "@/components/ui/badge";

export default function Purchases() {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: purchases, isLoading, error } = usePurchases(tenantId);
  const completePurchaseMutation = useCompletePurchase();
  const { formatPrice } = usePriceFormat();

  const handleCompletePurchase = (purchaseId: string) => {
    completePurchaseMutation.mutate({ purchase_id: purchaseId });
  };

  if (isLoading) return <div className="text-center p-8">Cargando compras...</div>;
  if (error) return <div className="text-red-500 text-center p-8">Error al cargar compras: {error.message}</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Compras</h1>
          <p className="text-muted-foreground mt-2">
            Registra las compras de productos a proveedores.
          </p>
        </div>
        <PurchaseDialog
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Compra
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases && purchases.length > 0 ? (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{purchase.supplier?.name || "Sin Proveedor"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(purchase.purchase_date).toLocaleDateString()} - {formatPrice(purchase.total_amount)}
                    </p>
                    {purchase.invoice_number && (
                      <p className="text-xs text-muted-foreground">Factura: {purchase.invoice_number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={purchase.status === 'completed' ? 'success' : purchase.status === 'cancelled' ? 'destructive' : 'secondary'}>
                      {purchase.status === 'completed' ? 'Completada' : purchase.status === 'cancelled' ? 'Cancelada' : 'Borrador'}
                    </Badge>
                    {purchase.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompletePurchase(purchase.id)}
                        disabled={completePurchaseMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Completar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay compras registradas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}