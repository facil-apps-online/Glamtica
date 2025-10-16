import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, ChevronDown } from "lucide-react";
import { useCreateSupplier, useUpdateSupplier, Supplier } from "@/hooks/useSuppliers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBranches } from "@/hooks/useBranches";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useGetDocumentTypes } from '@/hooks/useDocumentTypes';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasterProducts } from "@/hooks/useProducts";
import { useProductsBySupplier, useAddSupplierProduct, useUpdateSupplierProduct, useToggleSupplierProductStatus } from "@/hooks/useSupplierProducts";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  document_type_id: z.string().min(1, "El tipo de documento es requerido."),
  identification_number: z.string().min(1, "El número de documento es requerido."),
  phone: z.string().optional(),
  email: z.string().email("Debe ser un email válido.").optional().or(z.literal('')),
  branch_ids: z.array(z.string()).optional(),
});

type SupplierFormValues = z.infer<typeof formSchema>;

interface SupplierDialogProps {
  supplier?: Supplier;
  trigger?: React.ReactNode;
}

export const SupplierDialog = ({ supplier: initialSupplier, trigger }: SupplierDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | undefined>(initialSupplier);

  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: branches } = useBranches(tenantId);
  const { data: documentTypes, isLoading: isLoadingDocumentTypes } = useGetDocumentTypes('supplier');
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const { data: allProducts } = useMasterProducts("", false, "", "");
  const { data: supplierProducts, isLoading: isLoadingSupplierProducts, refetch: refetchSupplierProducts } = useProductsBySupplier(currentSupplier?.id);
  const addSupplierProductMutation = useAddSupplierProduct();
  const updateSupplierProductMutation = useUpdateSupplierProduct();
  const toggleSupplierProductStatusMutation = useToggleSupplierProductStatus();
  const { formatPrice } = usePriceFormat();
  const [newProductId, setNewProductId] = useState("");
  const [newSupplierPrice, setNewSupplierPrice] = useState<number | string>(0);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      if (initialSupplier) {
        setCurrentSupplier(initialSupplier);
        form.reset({
            name: initialSupplier.name || '',
            document_type_id: initialSupplier.document_type_id || '',
            identification_number: initialSupplier.identification_number || '',
            phone: initialSupplier.phone || '',
            email: initialSupplier.email || '',
            branch_ids: initialSupplier.branch_ids || [],
        });
        refetchSupplierProducts();
      } else {
        form.reset({});
        setCurrentSupplier(undefined);
      }
    }
  }, [open, initialSupplier, form, refetchSupplierProducts]);

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      if (currentSupplier) {
        await updateMutation.mutateAsync({ id: currentSupplier.id!, ...values });
        setOpen(false);
      } else {
        const newSupplier = await createMutation.mutateAsync(values);
        if (newSupplier) {
          setCurrentSupplier(newSupplier);
        } else {
          setOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({ title: "Error", description: `No se pudo guardar el proveedor: ${(error as Error).message}`, variant: "destructive" });
    }
  };

  const handleAddSupplierProduct = async () => {
    if (!currentSupplier?.id || !newProductId || newSupplierPrice <= 0) return;
    await addSupplierProductMutation.mutateAsync({
      supplier_id: currentSupplier.id,
      product_id: newProductId,
      supplier_price: Number(newSupplierPrice),
    });
    setNewProductId("");
    setNewSupplierPrice(0);
  };

  const availableProducts = allProducts?.filter(p => !supplierProducts?.some(sp => sp.product_id === p.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button><Plus className="w-4 h-4 mr-2" />Nuevo Proveedor</Button>}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-primary">{initialSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="products" disabled={!currentSupplier}>Productos</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="document_type_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Identificación</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} required>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                        <SelectContent>{isLoadingDocumentTypes ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : documentTypes?.map((type) => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="identification_number" render={({ field }) => (<FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} placeholder="Ej: 900123456-7" required /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Proveedor</FormLabel><FormControl><Input {...field} placeholder="Ej: Distribuidora Beauty Pro" required /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="branch_ids" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sucursales</FormLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><FormControl><Button variant="outline" className="w-full justify-between"><span>{field.value?.length === 0 ? "Seleccionar sucursales" : `${field.value?.length} sucursal(es) seleccionada(s)`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></FormControl></DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-popover-trigger-width]">
                                <DropdownMenuLabel>Sucursales Disponibles</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {branches?.map((branch) => (<DropdownMenuCheckboxItem key={branch.id} checked={field.value?.includes(branch.id)} onCheckedChange={(checked) => { const newValue = checked ? [...(field.value || []), branch.id] : (field.value || []).filter(id => id !== branch.id); field.onChange(newValue);}}>{branch.name}</DropdownMenuCheckboxItem>))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <FormMessage />
                    </FormItem>
                )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} placeholder="+57 1 234-5678" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} placeholder="contacto@proveedor.com" /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </TabsContent>

              <TabsContent value="products" className="pt-4 space-y-4">
                <h3 className="text-lg font-semibold">Productos del Proveedor</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="product">Producto</Label>
                    <Select value={newProductId} onValueChange={setNewProductId}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                      <SelectContent>{availableProducts?.map((product) => (<SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label htmlFor="price">Precio ({formatPrice(0).replace(/\d|\.|,/g, '')})</Label>
                    <Input id="price" type="number" step="0.01" value={newSupplierPrice} onChange={(e) => setNewSupplierPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                  <Button type="button" onClick={handleAddSupplierProduct} className="mt-auto"><Plus className="w-4 h-4" /></Button>
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
                          <Input type="number" step="0.01" value={sp.supplier_price} onChange={(e) => handleUpdateSupplierProductPrice(sp.id, parseFloat(e.target.value) || 0)} className="w-24 text-right" />
                          <Badge variant={sp.is_active ? 'success' : 'destructive'}>{sp.is_active ? 'Activo' : 'Inactivo'}</Badge>
                          <Switch checked={sp.is_active} onCheckedChange={(checked) => handleToggleSupplierProductStatus(sp.id, checked)} aria-label={`Activar o desactivar ${sp.products?.name}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500">No hay productos asociados a este proveedor.</p>
                )}
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (initialSupplier && !isDirty)}>
                    {currentSupplier ? "Actualizar" : "Crear y Añadir Productos"}
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};