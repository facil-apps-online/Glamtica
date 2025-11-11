import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenantClientSettings, useUpdateTenantClientSettings, TenantClientSettings } from "@/hooks/useTenantClientSettings";
import { useClientDocumentTemplates } from "@/hooks/useClientDocumentTemplates";
import { ManageFormTemplatesDialog } from '@/components/ManageFormTemplatesDialog';
import { ManageConsentTemplatesDialog } from '@/components/dialogs/ManageConsentTemplatesDialog'; // Import the new dialog
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';

export function ClientsTab() {
  const { toast } = useToast();
  const { currentAssignment, loading: authLoading } = useAuth();
  const { data: settings, isLoading: isLoadingSettings, isError: isErrorSettings } = useTenantClientSettings();
  const { data: templates, isLoading: isLoadingTemplates } = useClientDocumentTemplates();
  const { mutate: updateSettings, isLoading: isUpdating } = useUpdateTenantClientSettings();

  const [formState, setFormState] = useState<Partial<Omit<TenantClientSettings, 'id' | 'created_at' | 'updated_at'>>>({});
  const [isManageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [isManageConsentDialogOpen, setManageConsentDialogOpen] = useState(false); // Add state for the new dialog

  useEffect(() => {
    if (settings) {
      setFormState({
        default_intake_form_id: settings.default_intake_form_id,
        require_general_signature: settings.require_general_signature,
        require_image_consent: settings.require_image_consent,
      });
    }
  }, [settings]);

  const handleSave = () => {
    
    if (!currentAssignment?.tenant_id) return;
    
    updateSettings({ ...formState, tenant_id: currentAssignment.tenant_id }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Configuración guardada correctamente.", variant: "success" });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: `No se pudo guardar la configuración: ${error.message}`, variant: "destructive" });
      },
    });
  };

  const isLoading = isLoadingSettings || isLoadingTemplates;

  if (authLoading || !currentAssignment?.tenant_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando configuración de Clientes...</CardTitle>
          <CardDescription>
            Por favor, espera mientras cargamos los datos de tu tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>Cargando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            Configuración de Clientes
          </CardTitle>
          <CardDescription>
            Define los formularios por defecto y los consentimientos requeridos para tus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div>Cargando configuración...</div>
          ) : isErrorSettings ? (
            <div>Error al cargar la configuración.</div>
          ) : (
            <>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ficha Técnica</CardTitle>
                    <CardDescription>Selecciona la ficha técnica por defecto que se asociará a los nuevos clientes.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="intake-form">Ficha Técnica por Defecto</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                      <div className="w-full sm:w-auto flex-grow">
                        <Select
                          value={formState.default_intake_form_id?.toString() || 'none'}
                          onValueChange={(value) => setFormState(prev => ({ ...prev, default_intake_form_id: value === 'none' ? null : value }))}
                        >
                          <SelectTrigger id="intake-form" className="w-full">
                            <SelectValue placeholder="Selecciona una ficha..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ninguno</SelectItem>
                            {templates?.filter(t => t.is_active).map(template => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name} (v{template.version})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" onClick={() => setManageTemplatesOpen(true)} className="w-full sm:w-auto">Gestionar Plantillas</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Consentimientos y Firmas</CardTitle>
                    <CardDescription>Configura los consentimientos requeridos para tus clientes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="general-signature" className="text-base">Requerir Firma General</Label>
                        <p className="text-sm text-slate-600">
                          Solicita una firma digital general al cliente durante el proceso de registro o en su primera visita.
                        </p>
                      </div>
                      <Switch
                        id="general-signature"
                        checked={formState.require_general_signature ?? false}
                        onCheckedChange={(checked) => setFormState(prev => ({ ...prev, require_general_signature: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="image-consent" className="text-base">Requerir Consentimiento de Imagen</Label>
                        <p className="text-sm text-slate-600">
                          Solicita al cliente su consentimiento explícito para el uso de imágenes y fotografías.
                        </p>
                      </div>
                      <Switch
                        id="image-consent"
                        checked={formState.require_image_consent ?? false}
                        onCheckedChange={(checked) => setFormState(prev => ({ ...prev, require_image_consent: checked }))}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="consent-templates" className="text-base">Plantillas de Consentimiento Informado</Label>
                        <p className="text-sm text-slate-600">
                          Crea y administra las plantillas para los consentimientos que solicitas a tus clientes.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setManageConsentDialogOpen(true)} className="w-full sm:w-auto flex-shrink-0">Gestionar Plantillas</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <ManageFormTemplatesDialog open={isManageTemplatesOpen} onOpenChange={setManageTemplatesOpen} />
      <ManageConsentTemplatesDialog open={isManageConsentDialogOpen} onOpenChange={setManageConsentDialogOpen} />
    </>
  );
}