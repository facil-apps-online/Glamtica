import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Edit, 
  Share2, 
  Plus, 
  Combine,
  Trash2,
  MoreHorizontal,
  FileEdit
} from "lucide-react";
import { useGetCombos, useUpdateCombo, useDeleteCombo, Combo } from "@/hooks/useCombos";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ComboDialog } from "@/components/ComboDialog";
import { ManageComboInBranchesDialog } from "@/components/ManageComboInBranchesDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const ComboCard = ({ combo, formatPrice, handleToggleStatus, handleOpenAssignDialog, handleDelete, calculateBasePrice, onSuccess }) => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDialogOpen) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="switch"]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }
    navigate(`/app/combos/edit/${combo.id}`);
  };

  return (
    <Card onClick={handleCardClick} className="cursor-pointer transition-colors hover:bg-muted/50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{combo.name}</CardTitle>
            {combo.sku && <p className="text-sm text-muted-foreground">SKU: {combo.sku}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ComboDialog 
                combo={combo} 
                onOpenChange={setIsDialogOpen}
                onSuccess={onSuccess}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edición rápida
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem onClick={() => navigate(`/app/combos/edit/${combo.id}`)}>
                <FileEdit className="w-4 h-4 mr-2" />
                Edición Completa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleOpenAssignDialog(combo)}>
                <Share2 className="w-4 h-4 mr-2" />
                Asignar a Sucursales
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
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
                    <AlertDialogAction onClick={() => handleDelete(combo.id)} className="bg-red-600 hover:bg-red-700">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nº de Ítems</span>
          <span><Badge variant="secondary">{combo.combo_items?.length || 0} Ítems</Badge></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Precio Base</span>
          <span>{formatPrice(calculateBasePrice(combo))}</span>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3 mt-4">
          <label className="text-sm font-medium">Activo</label>
          <Switch
            checked={combo.is_active || false}
            onCheckedChange={() => handleToggleStatus(combo)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

const ComboCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);



const CombosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedComboForAssign, setSelectedComboForAssign] = useState<Combo | null>(null);

  const navigate = useNavigate();
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

  const handleOpenAssignDialog = (combo: Combo) => {
    setSelectedComboForAssign(combo);
    setIsAssignDialogOpen(true);
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {[...Array(6)].map((_, i) => <ComboCardSkeleton key={i} />)}
        </div>
      );
    }

    if (filteredCombos?.length === 0) {
      return (
        <EmptyState
          Icon={Combine}
          title="No se encontraron combos"
          description="Intenta cambiar los filtros o crea un nuevo combo."
          action={<ComboDialog onSuccess={refetch} trigger={<Button>Nuevo Combo</Button>} />}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {filteredCombos?.map((combo: Combo) => (
          <ComboCard
            key={combo.id}
            combo={combo}
            formatPrice={formatPrice}
            handleToggleStatus={handleToggleStatus}
            handleOpenAssignDialog={handleOpenAssignDialog}
            handleDelete={handleDelete}
            calculateBasePrice={calculateBasePrice}
            onSuccess={refetch}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Combos" subtitle="Crea y edita los combos o kits de tu negocio.">
        <ComboDialog onSuccess={refetch} trigger={
          <Button size="sm">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline ml-2">Nuevo Combo</span>
          </Button>
        } />
      </PageHeader>

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
          {renderContent()}
        </CardContent>
      </Card>

      {selectedComboForAssign && (
        <ManageComboInBranchesDialog 
          isOpen={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          combo={selectedComboForAssign}
        />
      )}
    </div>
  );
};

export default CombosPage;