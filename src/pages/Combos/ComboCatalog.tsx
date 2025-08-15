import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Edit, 
  Share2, 
  Plus, 
  Combine,
  Trash2
} from "lucide-react";
import { useGetCombos, useUpdateCombo, useDeleteCombo, Combo } from "@/hooks/useCombos";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ComboDialog } from "@/components/ComboDialog";
import { ManageComboInBranchesDialog } from "@/components/ManageComboInBranchesDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ComboCatalog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);

  const { data: combos, isLoading, refetch } = useGetCombos();
  const { mutate: updateCombo } = useUpdateCombo();
  const { mutate: deleteCombo } = useDeleteCombo();
  const { formatPrice } = usePriceFormat();

  const handleToggleStatus = (combo: Combo) => {
    updateCombo({ id: combo.id, is_active: !combo.is_active });
  };

  const calculateBasePrice = (combo: Combo) => {
    if (!combo.combo_items) return 0;
    return combo.combo_items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOpenComboDialog = (combo: Combo | null = null) => {
    setSelectedCombo(combo);
    setIsComboDialogOpen(true);
  };

  const handleOpenAssignDialog = (combo: Combo) => {
    setSelectedCombo(combo);
    setIsAssignDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setIsComboDialogOpen(false);
    refetch();
  };

  const handleDelete = (comboId: string) => {
    deleteCombo(comboId);
  };

  const filteredCombos = combos?.filter(combo => {
    const searchMatch = searchTerm.toLowerCase() === '' ||
      combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      combo.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const activityMatch = showInactive ? true : combo.is_active;
    return searchMatch && activityMatch;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Catálogo de Combos</h2>
          <p className="text-muted-foreground">Crea y edita los combos o kits de tu negocio.</p>
        </div>
        <Button size="sm" onClick={() => handleOpenComboDialog()}>
          <Plus className="w-4 h-4 mr-2" />Nuevo Combo
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-3"
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <span className="text-sm text-muted-foreground">Mostrar inactivos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Nº de Ítems</TableHead>
                <TableHead>Precio Base</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center">Cargando...</TableCell></TableRow>}
              {!isLoading && filteredCombos?.map((combo: Combo) => (
                <TableRow key={combo.id}>
                  <TableCell className="font-medium">{combo.name}</TableCell>
                  <TableCell>{combo.sku || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{combo.combo_items?.length || 0} Ítems</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(calculateBasePrice(combo))}</TableCell>
                  <TableCell>
                    <Switch
                      checked={combo.is_active || false}
                      onCheckedChange={() => handleToggleStatus(combo)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenComboDialog(combo)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenAssignDialog(combo)}><Share2 className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará el combo permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(combo.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredCombos?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Combine className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">No se encontraron combos</h3>
                    <p>Intenta cambiar los filtros o crea un nuevo combo.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <ComboDialog 
        isOpen={isComboDialogOpen}
        onOpenChange={setIsComboDialogOpen}
        combo={selectedCombo}
        onSuccess={handleDialogSuccess}
      />

      <ManageComboInBranchesDialog 
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        combo={selectedCombo}
      />
    </div>
  );
};

export default ComboCatalog;
