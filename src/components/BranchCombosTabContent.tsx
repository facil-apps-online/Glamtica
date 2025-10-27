import React, { useState, useMemo } from "react";
import { Boxes, Edit, Link, PlusCircle, DollarSign, MoreHorizontal, Search, Plus } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";
import { useBranchServicesAndCombos, useUpdateBranchCombo, BranchCombo } from "@/hooks/useServices";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ComboBranchPriceDialog } from "@/components/ComboBranchPriceDialog";
import AddCombosToBranchDialog from "@/components/AddCombosToBranchDialog";
import BulkEditBranchComboPricesDialog from "@/components/BulkEditBranchComboPricesDialog";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const CombosTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Combo</TableHead>
        <TableHead>Items</TableHead>
        <TableHead>Precio</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const ComboCardSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const BranchComboCard = ({ combo, formatPrice, handleToggleStatus, handleOpenPriceDialog, calculateBranchTotalPrice }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle className="text-base">{combo.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenPriceDialog(combo)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Precios
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Nº de Ítems</span>
        <Badge variant="secondary">{combo.items?.length || 0} Ítems</Badge>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Precio en Sucursal</span>
        <span>{formatPrice(calculateBranchTotalPrice(combo))}</span>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <label className="text-sm font-medium">Activo en Sucursal</label>
        <Switch checked={combo.is_branch_active} onCheckedChange={() => handleToggleStatus(combo)} />
      </div>
    </CardContent>
  </Card>
);

interface BranchCombosTabContentProps {
  branchId: string;
  branchName?: string;
}

const BranchCombosTabContent: React.FC<BranchCombosTabContentProps> = ({ branchId, branchName }) => {
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [selectedComboForPrices, setSelectedComboForPrices] = useState<BranchCombo | null>(null);
  const [isAddComboDialogOpen, setIsAddComboDialogOpen] = useState(false);
  const [isBulkEditPricesDialogOpen, setIsBulkEditPricesDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: branchServicesAndCombos, isLoading: isLoadingCombos } = useBranchServicesAndCombos(branchId);
  const branchCombos = branchServicesAndCombos?.filter((item): item is BranchCombo => item.type === 'combo') || [];

  const { mutate: updateBranchCombo } = useUpdateBranchCombo();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const handleToggleStatus = (combo: BranchCombo) => {
    updateBranchCombo({ 
      id: combo.id,
      branchId: branchId,
      updates: { is_active_in_branch: !combo.is_branch_active } 
    });
  };

  const handleOpenPriceDialog = (combo: BranchCombo) => {
    setSelectedComboForPrices(combo);
    setIsPriceDialogOpen(true);
  };

  const calculateBranchTotalPrice = (combo: BranchCombo) => {
    if (!combo.items) return 0;
    return combo.items.reduce((total, item) => total + (item.final_price * item.quantity), 0);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_services_and_combos', branchId] });
  };

  const filteredCombos = useMemo(() => {
    if (!branchCombos) return [];
    return branchCombos.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branchCombos, searchTerm]);

  if (!branchId) {
    return <EmptyState Icon={Link} title="Error: ID de sucursal no proporcionado" description="No se pueden cargar los combos sin un ID de sucursal válido." />;
  }

  const renderContent = () => {
    if (isLoadingCombos) {
      return isMobile ? <ComboCardSkeleton /> : <CombosTableSkeleton />;
    }

    if (filteredCombos.length === 0) {
      return (
        <EmptyState
          Icon={Boxes}
          title={searchTerm ? "No se encontraron combos" : "No hay combos en esta sucursal"}
          description={searchTerm ? "Intenta con otro término de búsqueda." : "Asigna combos desde el catálogo para empezar a vender."}
          action={!searchTerm && (
            <Button onClick={() => setIsAddComboDialogOpen(true)}><Plus className="w-4 h-4 mr-2"/>Añadir Combos</Button>
          )}
        />
      );
    }

    return isMobile ? (
      <div className="space-y-4">
        {filteredCombos.map((combo) => (
          <BranchComboCard 
            key={combo.id} 
            combo={combo} 
            formatPrice={formatPrice} 
            handleToggleStatus={handleToggleStatus} 
            handleOpenPriceDialog={handleOpenPriceDialog}
            calculateBranchTotalPrice={calculateBranchTotalPrice}
          />
        ))}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Combo</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Precio en Sucursal</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCombos.map((combo) => (
            <TableRow key={combo.id}>
              <TableCell>
                <div className="font-medium">{combo.name}</div>
                {combo.sku && <div className="text-sm text-muted-foreground">SKU: {combo.sku}</div>}
              </TableCell>
              <TableCell><Badge variant="secondary">{combo.items?.length || 0} Ítems</Badge></TableCell>
              <TableCell>{formatPrice(calculateBranchTotalPrice(combo))}</TableCell>
              <TableCell><Switch checked={combo.is_branch_active} onCheckedChange={() => handleToggleStatus(combo)} /></TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenPriceDialog(combo)}><Edit className="w-4 h-4 mr-2" /> Editar Precios</DropdownMenuItem>
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Boxes className="h-5 w-5" />
              Combos
            </CardTitle>
            <CardDescription>Añade, edita y gestiona los combos disponibles en esta sucursal.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsBulkEditPricesDialogOpen(true)} disabled={!branchCombos || branchCombos.length === 0}>
              <DollarSign className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar Precios</span>
            </Button>
            <Button size="sm" onClick={() => setIsAddComboDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Añadir</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      {selectedComboForPrices && (
        <ComboBranchPriceDialog
          isOpen={isPriceDialogOpen}
          onOpenChange={setIsPriceDialogOpen}
          combo={selectedComboForPrices}
          branch={{ id: branchId, name: branchName || "" }}
        />
      )}

      <AddCombosToBranchDialog
        isOpen={isAddComboDialogOpen}
        onOpenChange={setIsAddComboDialogOpen}
        branchId={branchId}
        onSuccess={handleSuccess}
      />

      {branchCombos && branchCombos.length > 0 && (
        <BulkEditBranchComboPricesDialog
          isOpen={isBulkEditPricesDialogOpen}
          onOpenChange={setIsBulkEditPricesDialogOpen}
          branchId={branchId}
          branchCombos={branchCombos.map(combo => ({
            id: combo.id,
            name: combo.name,
            selling_price: calculateBranchTotalPrice(combo),
            is_branch_active: combo.is_branch_active,
            branch_combo_id: combo.branch_combo_id,
          }))}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default BranchCombosTabContent;