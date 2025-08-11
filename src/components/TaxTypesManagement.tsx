import React, { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTaxTypes, useCreateTaxType, useUpdateTaxType, useDeleteTaxType } from "@/hooks/useTaxTypes"; // Estos hooks se crearán después

interface TaxType {
  id: string;
  name: string;
  rate: number | null;
  is_percentage: boolean;
  is_active: boolean;
}

export function TaxTypesManagement() {
  const { toast } = useToast();
  const { data: taxTypes, isLoading, refetch } = useTaxTypes();
  const { mutate: createTaxType, isPending: isCreating } = useCreateTaxType();
  const { mutate: updateTaxType, isPending: isUpdating } = useUpdateTaxType();
  const { mutate: deleteTaxType, isPending: isDeleting } = useDeleteTaxType();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTaxType, setEditingTaxType] = useState<TaxType | null>(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState<string>('');
  const [isPercentage, setIsPercentage] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taxTypeToDelete, setTaxTypeToDelete] = useState<TaxType | null>(null);

  const filteredTaxTypes = useMemo(() => {
    if (!taxTypes) return [];
    return taxTypes.filter(taxType =>
      taxType.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [taxTypes, searchTerm]);

  const resetForm = () => {
    setEditingTaxType(null);
    setName('');
    setRate('');
    setIsPercentage(true);
    setIsActive(true);
  };

  const handleOpenDialog = (taxType?: TaxType) => {
    if (taxType) {
      setEditingTaxType(taxType);
      setName(taxType.name);
      setRate(taxType.rate !== null ? taxType.rate.toString() : '');
      setIsPercentage(taxType.is_percentage);
      setIsActive(taxType.is_active);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name) {
      toast({ title: "Error", description: "El nombre del tipo de impuesto es requerido.", variant: "destructive" });
      return;
    }

    const taxRate = rate === '' ? null : parseFloat(rate);
    if (isPercentage && taxRate !== null && (taxRate < 0 || taxRate > 1)) {
      toast({ title: "Error", description: "La tasa de porcentaje debe estar entre 0 y 1.", variant: "destructive" });
      return;
    }

    const payload = {
      name,
      rate: taxRate,
      is_percentage: isPercentage,
      is_active: isActive,
    };

    if (editingTaxType) {
      updateTaxType({ id: editingTaxType.id, ...payload }, {
        onSuccess: () => {
          toast({ title: "Éxito", description: "Tipo de impuesto actualizado correctamente.", variant: "success" });
          refetch();
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast({ title: "Error", description: `Error al actualizar tipo de impuesto: ${error.message}` || "Error desconocido", variant: "destructive" });
        },
      });
    } else {
      createTaxType(payload, {
        onSuccess: () => {
          toast({ title: "Éxito", description: "Tipo de impuesto creado correctamente.", variant: "success" });
          refetch();
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast({ title: "Error", description: `Error al crear tipo de impuesto: ${error.message}` || "Error desconocido", variant: "destructive" });
        },
      });
    }
  };

  const handleDeleteClick = (taxType: TaxType) => {
    setTaxTypeToDelete(taxType);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taxTypeToDelete) {
      deleteTaxType({ id: taxTypeToDelete.id }, {
        onSuccess: () => {
          toast({ title: "Éxito", description: "Tipo de impuesto eliminado correctamente.", variant: "success" });
          refetch();
          setIsDeleteDialogOpen(false);
          setTaxTypeToDelete(null);
        },
        onError: (error) => {
          toast({ title: "Error", description: `Error al eliminar tipo de impuesto: ${error.message}` || "Error desconocido", variant: "destructive" });
        },
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Gestión de Tipos de Impuestos</CardTitle>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Tipo de Impuesto
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipo de impuesto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {isLoading ? (
          <div className="text-center">Cargando tipos de impuestos...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tasa</TableHead>
                  <TableHead>Es Porcentaje</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaxTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No se encontraron tipos de impuestos.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTaxTypes.map((taxType) => (
                    <TableRow key={taxType.id}>
                      <TableCell className="font-medium">{taxType.name}</TableCell>
                      <TableCell>{taxType.rate !== null ? (taxType.is_percentage ? `${(taxType.rate * 100).toFixed(2)}%` : taxType.rate.toFixed(2)) : 'N/A'}</TableCell>
                      <TableCell>{taxType.is_percentage ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{taxType.is_active ? 'Sí' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(taxType)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(taxType)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTaxType ? 'Editar Tipo de Impuesto' : 'Nuevo Tipo de Impuesto'}</DialogTitle>
            <DialogDescription>
              {editingTaxType ? 'Modifica los detalles del tipo de impuesto.' : 'Crea un nuevo tipo de impuesto para tu negocio.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rate" className="text-right">Tasa</Label>
              <Input id="rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} step={isPercentage ? "0.01" : "any"} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isPercentage" className="text-right">Es Porcentaje</Label>
              <Checkbox id="isPercentage" checked={isPercentage} onCheckedChange={(checked: boolean) => setIsPercentage(checked)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Activo</Label>
              <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked: boolean) => setIsActive(checked)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
              {editingTaxType ? (isUpdating ? 'Guardando...' : 'Guardar Cambios') : (isCreating ? 'Creando...' : 'Crear Tipo de Impuesto')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de impuesto '{taxTypeToDelete?.name}'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
