import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Archive, Power, MapPin, Phone, Mail, Globe, Settings } from 'lucide-react';
import { ActivateBranchesBatchDialog } from './ActivateBranchesBatchDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useArchiveBranch } from '@/hooks/useBranches';
import { MapDisplay } from '@/components/MapDisplay';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  active: { label: 'Activa', color: 'bg-green-500' },
  pending_activation: { label: 'Pendiente de Activación', color: 'bg-yellow-500' },
  archived: { label: 'Archivada', color: 'bg-slate-500' },
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-center text-sm text-muted-foreground">
      {icon && React.cloneElement(icon as React.ReactElement, { className: "mr-2 h-4 w-4 flex-shrink-0" })}
      <span className="font-medium mr-1">{label}:</span>
      <span>{value}</span>
    </div>
  );
};

export function BranchCard({ branch, onSuccess, tenantId }) {
  const [isActivateDialogOpen, setActivateDialogOpen] = useState(false);
  const { toast } = useToast();
  const archiveBranchMutation = useArchiveBranch(tenantId);
  const navigate = useNavigate();

  const handleArchive = async () => {
    archiveBranchMutation.mutate(branch.id, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'La sucursal ha sido archivada.', variant: 'success' });
        onSuccess();
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo archivar la sucursal: ${error.message}`, variant: 'destructive' });
      }
    });
  };

  const config = statusConfig[branch.status] || statusConfig.archived;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-primary flex items-center">
              <Badge className={`mr-2 ${config.color} text-white`}>{config.label}</Badge>
              {branch.name}
            </CardTitle>
            {branch.is_main_branch && <Badge variant="secondary" className="ml-2">Principal</Badge>}
            <CardDescription className="mt-1">{branch.address}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigate(`/app/branches/${branch.id}/settings`)}>
                <Settings className="mr-2 h-4 w-4" />
                Configurar
              </DropdownMenuItem>
              {branch.status === 'pending_activation' && (
                <DropdownMenuItem onClick={() => setActivateDialogOpen(true)}>
                  <Power className="mr-2 h-4 w-4" />
                  Activar Sucursal
                </DropdownMenuItem>
              )}
              {branch.status === 'active' && !branch.is_main_branch && (
                <DropdownMenuItem onClick={handleArchive} disabled={archiveBranchMutation.isPending}>
                  <Archive className="mr-2 h-4 w-4" /> Archivar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <DetailItem icon={<Phone />} label="Teléfono" value={branch.contact_phone} />
        <DetailItem icon={<Phone />} label="WhatsApp" value={branch.whatsapp_phone} />
        <DetailItem icon={<Mail />} label="Email" value={branch.commercial_email} />
        <DetailItem icon={<Globe />} label="Web" value={branch.website} />
        <DetailItem icon={<MapPin />} label="Dirección Física" value={branch.physical_address_line1} />
        {branch.physical_address_line2 && <DetailItem icon={<MapPin />} label="" value={branch.physical_address_line2} />}
        {branch.physical_city && <DetailItem icon={<MapPin />} label="Ciudad" value={branch.physical_city} />}
        {branch.physical_state && <DetailItem icon={<MapPin />} label="Estado" value={branch.physical_state} />}
        {branch.physical_postal_code && <DetailItem icon={<MapPin />} label="C.P." value={branch.physical_postal_code} />}

        {branch.latitude !== null && branch.longitude !== null && (
          <div className="w-full h-[150px] rounded-lg overflow-hidden mt-4">
            <MapDisplay latitude={branch.latitude} longitude={branch.longitude} />
          </div>
        )}
        {branch.is_main_branch && <p className="text-sm text-slate-500 mt-2">Esta es tu sucursal principal.</p>}
      </CardContent>

      <ActivateBranchesBatchDialog
        isOpen={isActivateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        branchIds={[branch.id]}
        onSuccess={onSuccess}
        tenantId={tenantId}
      />
      
    </Card>
  );
}