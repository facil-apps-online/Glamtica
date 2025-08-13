import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Check, X, ChevronDown } from "lucide-react";
import { useCreateSupplier, useUpdateSupplier, useSuppliers } from "@/hooks/useSuppliers";
import { useMasterProducts } from "@/hooks/useProducts";
import { useProductsBySupplier, useAddSupplierProduct, useUpdateSupplierProduct, useToggleSupplierProductStatus } from "@/hooks/useSupplierProducts";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useBranches } from "@/hooks/useBranches";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface Supplier {
  id?: string;
  identification_type: string;
  identification_number: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  branch_ids?: string[];
}

interface SupplierDialogProps {
  supplier?: Supplier;
  trigger?: React.ReactNode;
}

const IDENTIFICATION_TYPES = [
  { value: 'NIT', label: 'NIT' },
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'Pasaporte', label: 'Pasaporte' },
];

export const SupplierDialog = ({ supplier: initialSupplier, trigger }: SupplierDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | undefined>(initialSupplier);

  const [identificationType, setIdentificationType] = useState(currentSupplier?.identification_type || "");
  const [identificationNumber, setIdentificationNumber] = useState(currentSupplier?.identification_number || "");
  const [name, setName] = useState(currentSupplier?.name || "");
  const [address, setAddress] = useState(currentSupplier?.address || "");
  const [phone, setPhone] = useState(currentSupplier?.phone || "");
  const [email, setEmail] = useState(currentSupplier?.email || "");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(currentSupplier?.branch_ids || []);

  // State for new supplier product
  const [newProductId, setNewProductId] = useState("");
  const [newSupplierPrice, setNewSupplierPrice] = useState<number | string>(0);

  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: branches } = useBranches(tenantId);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const { data: allProducts } = useMasterProducts("", false, "", ""); // All products in the system
  const { data: supplierProducts, isLoading: isLoadingSupplierProducts, refetch: refetchSupplierProducts } = useProductsBySupplier(currentSupplier?.id);
  const addSupplierProductMutation = useAddSupplierProduct();
  const updateSupplierProductMutation = useUpdateSupplierProduct();
  const toggleSupplierProductStatusMutation = useToggleSupplierProductStatus();
  const { formatPrice } = usePriceFormat();

  useEffect(() => {
    setCurrentSupplier(initialSupplier);
    setSelectedBranchIds(initialSupplier?.branch_ids || []);
  }, [initialSupplier]);

  useEffect(() => {
    if (open && currentSupplier?.id) {
      refetchSupplierProducts();
    }
  }, [open, currentSupplier?.id, refetchSupplierProducts]);

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchIds(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId) 
        : [...prev, branchId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identificationType || !identificationNumber || !name) {
      toast({ title: "Error", description: "Los campos de identificación y nombre son requeridos.", variant: "destructive" });
      return;
    }

    const supplierData = {
      identification_type: identificationType,
      identification_number: identificationNumber,
      name,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      branch_ids: selectedBranchIds,
    };

    try {
      if (currentSupplier) {
        await updateMutation.mutateAsync({
          id: currentSupplier.id!,
          ...supplierData,
        });
        setOpen(false); // Close on update
      } else {
        const newSupplier = await createMutation.mutateAsync(supplierData);
        if (newSupplier) {
          setCurrentSupplier(newSupplier);
          // Keep dialog open to add products
        } else {
          setOpen(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({ title: "Error", description: `No se pudo guardar el proveedor: ${error.message}`, variant: "destructive" });
    }
  };

  const resetForm = () => {
    if (!initialSupplier) {
      setIdentificationType("");
      setIdentificationNumber("");
      setName("");
      setAddress("");
      setPhone("");
      setEmail("");
      setSelectedBranchIds([]);
      setNewProductId("");
      setNewSupplierPrice(0);
      setCurrentSupplier(undefined);
    }
  };
  
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);


  const handleAddSupplierProduct = async () => {
    if (!currentSupplier?.id) {
        toast({ title: "Error", description: "Se requiere un proveedor para agregar un producto.", variant: "destructive" });
        return;
    }
    if (!newProductId) {
        toast({ title: "Error", description: "Por favor, seleccione un producto.", variant: "destructive" });
        return;
    }
    if (typeof newSupplierPrice !== 'number' || newSupplierPrice < 0) {
        toast({ title: "Error", description: "Por favor, ingrese un precio válido.", variant: "destructive" });
        return;
    }

    await addSupplierProductMutation.mutateAsync({
      supplier_id: currentSupplier.id,
      product_id: newProductId,
      supplier_price: Number(newSupplierPrice),
    });

    setNewProductId("");
    setNewSupplierPrice(0);
  };

  const handleUpdateSupplierProductPrice = async (supplierProductId: string, price: number) => {
    await updateSupplierProductMutation.mutateAsync({ id: supplierProductId, supplier_price: price });
  };

  const handleToggleSupplierProductStatus = async (supplierProductId: string, isActive: boolean) => {
    await toggleSupplierProductStatusMutation.mutateAsync({ id: supplierProductId, is_active: isActive });
  };

  const availableProducts = allProducts?.filter(p => 
    !supplierProducts?.some(sp => sp.product_id === p.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {currentSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields remain the same */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identification_type">Tipo de Identificación</Label>
              <Select value={identificationType} onValueChange={setIdentificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {IDENTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identification_number">Número de Identificación</Label>
              <Input
                id="identification_number"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(e.target.value)}
                placeholder="Ej: 900123456-7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proveedor</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Distribuidora Beauty Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branches">Sucursales</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedBranchIds.length === 0
                      ? "Seleccionar sucursales"
                      : `${selectedBranchIds.length} sucursal(es) seleccionada(s)`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuLabel>Sucursales Disponibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {branches?.map((branch) => (
                  <DropdownMenuCheckboxItem
                    key={branch.id}
                    checked={selectedBranchIds.includes(branch.id)}
                    onCheckedChange={() => handleBranchSelect(branch.id)}
                  >
                    {branch.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección completa del proveedor..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 1 234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@proveedor.com"
              />
            </div>
          </div>

          {currentSupplier && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold">Productos del Proveedor</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="product">Producto</Label>
                  <Select value={newProductId} onValueChange={setNewProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label htmlFor="price">Precio ({formatPrice(0).replace(/\d|\.|,/g, '')})</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newSupplierPrice}
                    onChange={(e) => setNewSupplierPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button type="button" onClick={handleAddSupplierProduct} className="mt-auto">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {isLoadingSupplierProducts ? (
                <div>Cargando productos asociados...</div>
              ) : supplierProducts && supplierProducts.length > 0 ? (
                <div className="space-y-2">
                  {supplierProducts.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex-1">
                        <p className="font-medium">{sp.products.name}</p>
                        <p className="text-sm text-slate-500">{sp.suppliers.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={sp.supplier_price}
                          onChange={(e) => handleUpdateSupplierProductPrice(sp.id, parseFloat(e.target.value) || 0)}
                          className="w-24 text-right"
                        />
                        <Badge variant={sp.is_active ? 'success' : 'destructive'}>
                          {sp.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Switch
                          checked={sp.is_active}
                          onCheckedChange={(checked) => handleToggleSupplierProductStatus(sp.id, checked)}
                          aria-label={`Activar o desactivar ${sp.products?.name}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500">No hay productos asociados a este proveedor.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {currentSupplier ? "Actualizar" : "Crear y Añadir Productos"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};