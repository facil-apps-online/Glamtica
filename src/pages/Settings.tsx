import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Globe, DollarSign, Save, Package, Clock } from "lucide-react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { useLanguages } from "@/hooks/useTranslations";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SettingsForm {
  currency: string;
  currency_symbol: string;
  currency_position: string;
  decimal_places: string;
  business_name: string;
  default_language: string;
  date_format: string;
  time_format: string;
  costing_method: string;
  timezone: string;
  timezone_offset: string;
  daylight_saving: string;
  timezone_name: string;
}

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const { data: languages } = useLanguages();
  const updateMutation = useUpdateSetting();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
    reset,
  } = useForm<SettingsForm>({
    defaultValues: {
      currency: 'EUR',
      currency_symbol: '€',
      currency_position: 'before',
      decimal_places: '2',
      business_name: 'Salón de Belleza P&B',
      default_language: 'es',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      costing_method: 'average',
      timezone: 'Europe/Madrid',
      timezone_offset: '60',
      daylight_saving: 'true',
      timezone_name: 'Madrid (España)',
    }
  });

  // Cargar valores actuales cuando se obtienen los settings
  useEffect(() => {
    if (settings && settings.length > 0) {
      const formData: Partial<SettingsForm> = {};
      
      settings.forEach(setting => {
        if (setting.key in formData || [
          'currency', 'currency_symbol', 'currency_position', 'decimal_places', 
          'business_name', 'default_language', 'date_format', 'time_format', 
          'costing_method', 'timezone', 'timezone_offset', 'daylight_saving', 'timezone_name'
        ].includes(setting.key)) {
          formData[setting.key as keyof SettingsForm] = setting.value;
        }
      });

      // Resetear el formulario con los nuevos valores
      reset(formData);
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsForm) => {
    setIsSaving(true);
    
    try {
      // Actualizar cada configuración individualmente
      const updatePromises = Object.entries(data).map(([key, value]) => {
        if (value !== undefined && value !== null) {
          return updateMutation.mutateAsync({ key, value: String(value) });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente.",
      });
      
      // Resetear el estado de isDirty
      reset(data);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Función para manejar cambios en los selects
  const handleSelectChange = (key: keyof SettingsForm, value: string) => {
    setValue(key, value, { shouldDirty: true });
  };

  // Función para manejar cambios en el switch
  const handleSwitchChange = (key: keyof SettingsForm, checked: boolean) => {
    setValue(key, checked.toString(), { shouldDirty: true });
  };

  // Funciones para el selector de zona horaria
  const handleTimezoneChange = (timezone: string) => {
    setValue('timezone', timezone, { shouldDirty: true });
  };

  const handleTimezoneOffsetChange = (offset: number) => {
    setValue('timezone_offset', offset.toString(), { shouldDirty: true });
  };

  const handleTimezoneNameChange = (name: string) => {
    setValue('timezone_name', name, { shouldDirty: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Configuración
          </h1>
          <p className="text-slate-600 mt-2">
            Personaliza la configuración del salón
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Configuración
        </h1>
        <p className="text-slate-600 mt-2">
          Personaliza la configuración del salón
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Nombre del Negocio</Label>
                <Input
                  id="business_name"
                  {...register("business_name")}
                  placeholder="Salón de Belleza P&B"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_format">Formato de Fecha</Label>
                <Select 
                  value={watch("date_format") || "DD/MM/YYYY"} 
                  onValueChange={(value) => handleSelectChange("date_format", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_format">Formato de Hora</Label>
                <Select 
                  value={watch("time_format") || "24h"} 
                  onValueChange={(value) => handleSelectChange("time_format", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 horas</SelectItem>
                    <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Configuración de Zona Horaria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TimezoneSelector
                value={watch("timezone") || "Europe/Madrid"}
                onValueChange={handleTimezoneChange}
                onOffsetChange={handleTimezoneOffsetChange}
                onNameChange={handleTimezoneNameChange}
              />

              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch("daylight_saving") === "true"}
                  onCheckedChange={(checked) => handleSwitchChange("daylight_saving", checked)}
                />
                <Label>Ajuste automático de horario de verano</Label>
              </div>

              <div className="text-sm text-slate-600">
                <p><strong>Nota:</strong> Todas las fechas y horas se mostrarán en la zona horaria configurada, pero se almacenan en UTC en la base de datos para mantener la consistencia.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Configuración de Moneda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select 
                  value={watch("currency") || "EUR"} 
                  onValueChange={(value) => handleSelectChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="GBP">Libra (GBP)</SelectItem>
                    <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                    <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_symbol">Símbolo de Moneda</Label>
                <Input
                  id="currency_symbol"
                  {...register("currency_symbol")}
                  placeholder="€"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_position">Posición del Símbolo</Label>
                <Select 
                  value={watch("currency_position") || "before"} 
                  onValueChange={(value) => handleSelectChange("currency_position", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona posición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Antes del monto ($100)</SelectItem>
                    <SelectItem value="after">Después del monto (100 $)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimal_places">Decimales</Label>
                <Select 
                  value={watch("decimal_places") || "2"} 
                  onValueChange={(value) => handleSelectChange("decimal_places", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cantidad de decimales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 decimales (100)</SelectItem>
                    <SelectItem value="2">2 decimales (100.00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Configuración de Inventario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="costing_method">Método de Costeo</Label>
                <Select 
                  value={watch("costing_method") || "average"} 
                  onValueChange={(value) => handleSelectChange("costing_method", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="average">Promedio</SelectItem>
                    <SelectItem value="last_purchase">Última Compra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-600">
                <p><strong>Promedio:</strong> Calcula el costo promediando el costo anterior con el nuevo costo de compra.</p>
                <p><strong>Última Compra:</strong> Usa el costo de la última compra realizada como costo del producto.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Configuración de Idioma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_language">Idioma por Defecto</Label>
                <Select 
                  value={watch("default_language") || "es"} 
                  onValueChange={(value) => handleSelectChange("default_language", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages?.map((language) => (
                      <SelectItem key={language.id} value={language.code}>
                        {language.native_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-slate-600">
                <p>Idiomas disponibles:</p>
                <ul className="mt-2 space-y-1">
                  {languages?.map((language) => (
                    <li key={language.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${language.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {language.native_name} ({language.code})
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!isDirty || isSaving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}