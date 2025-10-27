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
import { Card, CardContent } from "@/components/ui/card";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, Search, MoreHorizontal } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTaxTypes, useCreateTaxType, useUpdateTaxType, useDeleteTaxType } from "@/hooks/useTaxTypes";
import { useScreenSize } from '@/hooks/useScreenSize';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface TaxType {
  id: string;
  name: string;
  rate: number | null;
  is_percentage: boolean;
  is_active: boolean;
}

// --- Skeleton Components ---
const TaxTypeCardSkeleton = () => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-9 w-9" />
        </CardContent>
    </Card>
);

const TaxTypeTableSkeleton = () => (
    <>
        {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-9 w-9" /></TableCell>
            </TableRow>
        ))}
    </>
);

// --- Card Component for Mobile View ---
const TaxTypeCard = ({ taxType, handleOpenDialog, handleDeleteClick }: { taxType: TaxType, handleOpenDialog: (t: TaxType) => void, handleDeleteClick: (t: TaxType) => void }) => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
                <p className="font-medium">{taxType.name}</p>
                <div className="flex items-center gap-2">
                    <Badge variant={taxType.is_active ? 'default' : 'outline'}>{taxType.is_active ? 'Activo' : 'Inactivo'}</Badge>
                    <Badge variant="secondary">{taxType.rate !== null ? (taxType.is_percentage ? `${(taxType.rate * 100).toFixed(2)}%` : taxType.rate.toFixed(2)) : 'N/A'}</Badge>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(taxType)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(taxType)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </CardContent>
    </Card>
);

export function TaxTypesManagement() {
  const { toast } = useToast();
  const { data: taxTypes, isLoading, refetch } = useTaxTypes();
  const { mutate: createTaxType, isPending: isCreating } = useCreateTaxType();
  const { mutate: updateTaxType, isPending: isUpdating } = useUpdateTaxType();
  const { mutate: deleteTaxType, isPending: isDeleting } = useDeleteTaxType();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

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

  const resetForm = () => { setEditingTaxType(null); setName(''); setRate(''); setIsPercentage(true); setIsActive(true); };
  const handleOpenDialog = (taxType?: TaxType) => { if (taxType) { setEditingTaxType(taxType); setName(taxType.name); setRate(taxType.rate !== null ? taxType.rate.toString() : ''); setIsPercentage(taxType.is_percentage); setIsActive(taxType.is_active); } else { resetForm(); } setIsDialogOpen(true); };
  const handleSubmit = () => { if (!name) { toast({ title: "Error", description: "El nombre del tipo de impuesto es requerido.", variant: "destructive" }); return; } const taxRate = rate === '' ? null : parseFloat(rate); if (isPercentage && taxRate !== null && (taxRate < 0 || taxRate > 1)) { toast({ title: "Error", description: "La tasa de porcentaje debe estar entre 0 y 1.", variant: "destructive" }); return; } const payload = { name, rate: taxRate, is_percentage: isPercentage, is_active: isActive, }; if (editingTaxType) { updateTaxType({ id: editingTaxType.id, ...payload }, { onSuccess: () => { toast({ title: "Éxito", description: "Tipo de impuesto actualizado correctamente.", variant: "success" }); refetch(); setIsDialogOpen(false); }, onError: (error) => { toast({ title: "Error", description: `Error al actualizar tipo de impuesto: ${error.message}` || "Error desconocido", variant: "destructive" }); }, }); } else { createTaxType(payload, { onSuccess: () => { toast({ title: "Éxito", description: "Tipo de impuesto creado correctamente.", variant: "success" }); refetch(); setIsDialogOpen(false); }, onError: (error) => { toast({ title: "Error", description: `Error al crear tipo de impuesto: ${error.message}` || "Error desconocido", variant: "destructive" }); }, }); } };
  const handleDeleteClick = (taxType: TaxType) => { setTaxTypeToDelete(taxType); setIsDeleteDialogOpen(true); };
  const handleConfirmDelete = () => { if (taxTypeToDelete) { deleteTaxType({ id: taxTypeToDelete.id }, { onSuccess: () => { toast({ title: "Éxito", description: "Tipo de impuesto eliminado correctamente.", variant: "success" }); refetch(); setIsDeleteDialogOpen(false); setTaxTypeToDelete(null); }, onError: (error) => { toast({ title: "Error", description: `Error al eliminar tipo de impuesto: ${error.message}` || "Error desconocido", variant: "destructive" }); }, }); } };

  return (
    <>
        <div className="flex items-center justify-between pb-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar tipo de impuesto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo</span>
            </Button>
        </div>
        
        {isMobile ? (
            <div className="space-y-3">
                {isLoading ? [...Array(3)].map((_, i) => <TaxTypeCardSkeleton key={i} />) : (
                    filteredTaxTypes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No se encontraron tipos de impuestos.</p>
                    ) : (
                        filteredTaxTypes.map((taxType) => <TaxTypeCard key={taxType.id} taxType={taxType} handleOpenDialog={handleOpenDialog} handleDeleteClick={handleDeleteClick} />)
                    )
                )}
            </div>
        ) : (
            <Table>
                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Tasa</TableHead><TableHead>Es Porcentaje</TableHead><TableHead>Activo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                    {isLoading ? <TaxTypeTableSkeleton /> : (
                        filteredTaxTypes.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No se encontraron tipos de impuestos.</TableCell></TableRow>
                        ) : (
                            filteredTaxTypes.map((taxType) => (
                                <TableRow key={taxType.id}>
                                    <TableCell className="font-medium">{taxType.name}</TableCell>
                                    <TableCell>{taxType.rate !== null ? (taxType.is_percentage ? `${(taxType.rate * 100).toFixed(2)}%` : taxType.rate.toFixed(2)) : 'N/A'}</TableCell>
                                    <TableCell><Badge variant={taxType.is_percentage ? "default" : "secondary"}>{taxType.is_percentage ? 'Sí' : 'No'}</Badge></TableCell>
                                    <TableCell><Badge variant={taxType.is_active ? "default" : "outline"}>{taxType.is_active ? 'Sí' : 'No'}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenDialog(taxType)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteClick(taxType)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )
                    )}
                </TableBody>
            </Table>
        )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTaxType ? 'Editar Tipo de Impuesto' : 'Nuevo Tipo de Impuesto'}</DialogTitle>
            <DialogDescription>{editingTaxType ? 'Modifica los detalles del tipo de impuesto.' : 'Crea un nuevo tipo de impuesto para tu negocio.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nombre</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="rate" className="text-right">Tasa</Label><Input id="rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} step={isPercentage ? "0.01" : "any"} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="isPercentage" className="text-right">Es Porcentaje</Label><Checkbox id="isPercentage" checked={isPercentage} onCheckedChange={(checked: boolean) => setIsPercentage(checked)} /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="isActive" className="text-right">Activo</Label><Checkbox id="isActive" checked={isActive} onCheckedChange={(checked: boolean) => setIsActive(checked)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>{editingTaxType ? (isUpdating ? 'Guardando...' : 'Guardar Cambios') : (isCreating ? 'Creando...' : 'Crear Tipo de Impuesto')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de impuesto '{taxTypeToDelete?.name}'.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? 'Eliminando...' : 'Eliminar'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}