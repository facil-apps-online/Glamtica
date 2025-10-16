import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Trash2,
  MoreHorizontal,
  FileEdit
} from "lucide-react";
import { useGetCombos, useUpdateCombo, useDeleteCombo, Combo } from "@/hooks/useCombos";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ComboDialog } from "@/components/ComboDialog";
import { ManageComboInBranchesDialog } from "@/components/ManageComboInBranchesDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useScreenSize } from "@/hooks/useScreenSize";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const ComboCard = ({ combo, formatPrice, handleToggleStatus, handleOpenComboDialog, handleOpenAssignDialog, handleDelete, calculateBasePrice }) => {
  const navigate = useNavigate();
  return (
    <Card>
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
              <DropdownMenuItem onClick={() => handleOpenComboDialog(combo)}>
                <Edit className="w-4 h-4 mr-2" />
                Edición rápida
              </DropdownMenuItem>
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
};

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

const ComboTableSkeleton = () => (
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
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const CombosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);

  const navigate = useNavigate();
  const { data: combos, isLoading, refetch } = useGetCombos();
  const { mutate: updateCombo } = useUpdateCombo();
  const { mutate: deleteCombo } = useDeleteCombo();
  const { formatPrice } = usePriceFormat();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';

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

  const renderContent = () => {
    if (isLoading) {
      return isMobile ? <div className="space-y-4 p-4">{[...Array(5)].map((_, i) => <ComboCardSkeleton key={i} />)}</div> : <ComboTableSkeleton />;
    }

    if (filteredCombos?.length === 0) {
      return (
        <EmptyState
          Icon={Combine}
          title="No se encontraron combos"
          description="Intenta cambiar los filtros o crea un nuevo combo."
          action={<Button onClick={() => handleOpenComboDialog()}>Nuevo Combo</Button>}
        />
      );
    }

    return isMobile ? (
      <div className="space-y-4 p-4">
        {filteredCombos?.map((combo: Combo) => (
          <ComboCard
            key={combo.id}
            combo={combo}
            formatPrice={formatPrice}
            handleToggleStatus={handleToggleStatus}
            handleOpenComboDialog={handleOpenComboDialog}
            handleOpenAssignDialog={handleOpenAssignDialog}
            handleDelete={handleDelete}
            calculateBasePrice={calculateBasePrice}
          />
        ))}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Nº de Ítems</TableHead>
            <TableHead>Precio Base</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCombos?.map((combo: Combo) => (
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
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenComboDialog(combo)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edición rápida
                    </DropdownMenuItem>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Combos" subtitle="Crea y edita los combos o kits de tu negocio.">
        <Button size="sm" onClick={() => handleOpenComboDialog()}>
          <Plus className="w-4 h-4" /><span className="hidden sm:inline ml-2">Nuevo Combo</span>
        </Button>
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
      
      <ComboDialog 
        isOpen={isComboDialogOpen}
        onOpenChange={setIsComboDialogOpen}
        combo={selectedCombo}
        onSuccess={handleDialogSuccess}
      />

      {selectedCombo && (
        <ManageComboInBranchesDialog 
          isOpen={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          combo={selectedCombo}
        />
      )}
    </div>
  );
};

export default CombosPage;