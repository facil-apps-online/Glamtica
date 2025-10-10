import React, { useState, useEffect, useMemo } from 'react';
import { useGetNotificationSettings, useUpdateNotificationSettings } from '@/hooks/useNotificationSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Bell } from 'lucide-react';

const notificationTemplateMap = {
  new_attention: { event: 'Citas', label: 'Nueva Cita', channel: 'Email' },
  new_attention_whatsapp: { event: 'Citas', label: 'Nueva Cita', channel: 'WhatsApp' },
  attention_cancelled: { event: 'Citas', label: 'Cita Cancelada', channel: 'Email' },
  attention_cancelled_whatsapp: { event: 'Citas', label: 'Cita Cancelada', channel: 'WhatsApp' },
  payment_receipt: { event: 'Pagos', label: 'Recibo de Pago', channel: 'Email' },
  payment_receipt_whatsapp: { event: 'Pagos', label: 'Recibo de Pago', channel: 'WhatsApp' },
  invoice_generated: { event: 'Pagos', label: 'Factura Generada', channel: 'Email' },
  invoice_generated_whatsapp: { event: 'Pagos', label: 'Factura Generada', channel: 'WhatsApp' },
};

const SkeletonLoader = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="h-4 w-2/3 mt-1" />
    </CardHeader>
    <CardContent className="space-y-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center justify-between rounded-lg border p-4">
                <Skeleton className="h-5 w-1/3" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </CardContent>
  </Card>
);

export function NotificationSettingsTab() {
  const { data: initialSettings, isLoading } = useGetNotificationSettings();
  const updateSettingsMutation = useUpdateNotificationSettings();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      const settingsMap = Object.keys(notificationTemplateMap).reduce((acc, key) => {
        const setting = initialSettings.find(s => s.template_type === key);
        acc[key] = setting ? setting.is_active : true; // Default to true if not set
        return acc;
      }, {} as Record<string, boolean>);
      setSettings(settingsMap);
      setIsDirty(false);
    }
  }, [initialSettings]);

  const handleToggle = (templateKey: string) => {
    setSettings(prev => {
      const newState = { ...prev, [templateKey]: !prev[templateKey] };
      
      const initialValue = initialSettings?.find(s => s.template_type === templateKey)?.is_active ?? true;
      const hasChanged = newState[templateKey] !== initialValue;

      // Check if any value is different from its initial state
      const anyChange = Object.keys(newState).some(key => {
        const initial = initialSettings?.find(s => s.template_type === key)?.is_active ?? true;
        return newState[key] !== initial;
      });
      setIsDirty(anyChange);

      return newState;
    });
  };

  const handleSaveChanges = () => {
    const settingsPayload = Object.keys(settings).map(key => ({
      template_type: key,
      is_active: settings[key],
    }));
    updateSettingsMutation.mutate(settingsPayload, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const groupedTemplates = useMemo(() => {
    return Object.entries(notificationTemplateMap).reduce((acc, [key, value]) => {
      const { event, label } = value;
      if (!acc[event]) acc[event] = {};
      if (!acc[event][label]) acc[event][label] = {};
      acc[event][label][value.channel.toLowerCase()] = key;
      return acc;
    }, {} as Record<string, Record<string, Record<string, string>>>);
  }, []);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Bell className="h-5 w-5" />
          Notificaciones
        </CardTitle>
        <CardDescription>
          Activa o desactiva las notificaciones automáticas por Email y WhatsApp para tus clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(groupedTemplates).map(([event, labels]) => (
          <Card key={event}>
            <CardHeader>
              <CardTitle className="text-lg">{event}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {Object.entries(labels).map(([label, channels]) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4 space-y-3 sm:space-y-0">
                  <Label htmlFor={label} className="text-base font-semibold">{label}</Label>
                  <div className="flex items-center space-x-6 self-end sm:self-center">
                    {channels.email && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={channels.email}
                          checked={settings[channels.email] ?? true}
                          onCheckedChange={() => handleToggle(channels.email)}
                        />
                        <Label htmlFor={channels.email}>Email</Label>
                      </div>
                    )}
                    {channels.whatsapp && (
                       <div className="flex items-center space-x-2">
                        <Switch
                          id={channels.whatsapp}
                          checked={settings[channels.whatsapp] ?? true}
                          onCheckedChange={() => handleToggle(channels.whatsapp)}
                        />
                        <Label htmlFor={channels.whatsapp}>WhatsApp</Label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={!isDirty || updateSettingsMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateSettingsMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
