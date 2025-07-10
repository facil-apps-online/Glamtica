import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, Globe } from "lucide-react";

interface TimezoneSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  onOffsetChange: (offset: number) => void;
  onNameChange: (name: string) => void;
}

const TIMEZONES = [
  // América
  { value: 'America/New_York', name: 'Nueva York (EST/EDT)', offset: -300, region: 'América' },
  { value: 'America/Chicago', name: 'Chicago (CST/CDT)', offset: -360, region: 'América' },
  { value: 'America/Denver', name: 'Denver (MST/MDT)', offset: -420, region: 'América' },
  { value: 'America/Los_Angeles', name: 'Los Ángeles (PST/PDT)', offset: -480, region: 'América' },
  { value: 'America/Mexico_City', name: 'Ciudad de México (CST)', offset: -360, region: 'América' },
  { value: 'America/Bogota', name: 'Bogotá (COT)', offset: -300, region: 'América' },
  { value: 'America/Lima', name: 'Lima (PET)', offset: -300, region: 'América' },
  { value: 'America/Santiago', name: 'Santiago (CLT)', offset: -240, region: 'América' },
  { value: 'America/Argentina/Buenos_Aires', name: 'Buenos Aires (ART)', offset: -180, region: 'América' },
  { value: 'America/Sao_Paulo', name: 'São Paulo (BRT)', offset: -180, region: 'América' },
  
  // Europa
  { value: 'Europe/London', name: 'Londres (GMT/BST)', offset: 0, region: 'Europa' },
  { value: 'Europe/Paris', name: 'París (CET/CEST)', offset: 60, region: 'Europa' },
  { value: 'Europe/Berlin', name: 'Berlín (CET/CEST)', offset: 60, region: 'Europa' },
  { value: 'Europe/Madrid', name: 'Madrid (CET/CEST)', offset: 60, region: 'Europa' },
  { value: 'Europe/Rome', name: 'Roma (CET/CEST)', offset: 60, region: 'Europa' },
  { value: 'Europe/Moscow', name: 'Moscú (MSK)', offset: 180, region: 'Europa' },
  
  // Asia
  { value: 'Asia/Tokyo', name: 'Tokio (JST)', offset: 540, region: 'Asia' },
  { value: 'Asia/Shanghai', name: 'Shanghái (CST)', offset: 480, region: 'Asia' },
  { value: 'Asia/Seoul', name: 'Seúl (KST)', offset: 540, region: 'Asia' },
  { value: 'Asia/Dubai', name: 'Dubái (GST)', offset: 240, region: 'Asia' },
  { value: 'Asia/Kolkata', name: 'Mumbai (IST)', offset: 330, region: 'Asia' },
  
  // Oceanía
  { value: 'Australia/Sydney', name: 'Sídney (AEDT/AEST)', offset: 600, region: 'Oceanía' },
  { value: 'Pacific/Auckland', name: 'Auckland (NZDT/NZST)', offset: 720, region: 'Oceanía' },
];

export const TimezoneSelector = ({ value, onValueChange, onOffsetChange, onNameChange }: TimezoneSelectorProps) => {
  const handleTimezoneChange = (timezoneValue: string) => {
    const selectedTimezone = TIMEZONES.find(tz => tz.value === timezoneValue);
    if (selectedTimezone) {
      onValueChange(timezoneValue);
      onOffsetChange(selectedTimezone.offset);
      onNameChange(selectedTimezone.name);
    }
  };

  const getCurrentTime = () => {
    const selectedTimezone = TIMEZONES.find(tz => tz.value === value);
    if (selectedTimezone) {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const localTime = new Date(utc + (selectedTimezone.offset * 60000));
      return localTime.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    return '';
  };

  // Agrupar zonas horarias por región
  const groupedTimezones = TIMEZONES.reduce((acc, tz) => {
    if (!acc[tz.region]) {
      acc[tz.region] = [];
    }
    acc[tz.region].push(tz);
    return acc;
  }, {} as Record<string, typeof TIMEZONES>);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Zona Horaria
        </Label>
        <Select value={value} onValueChange={handleTimezoneChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una zona horaria" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {Object.entries(groupedTimezones).map(([region, timezones]) => (
              <div key={region}>
                <div className="px-2 py-1.5 text-sm font-semibold text-slate-600 bg-slate-50">
                  {region}
                </div>
                {timezones.map((timezone) => (
                  <SelectItem key={timezone.value} value={timezone.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{timezone.name}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        UTC{timezone.offset >= 0 ? '+' : ''}{(timezone.offset / 60).toFixed(timezone.offset % 60 === 0 ? 0 : 1)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Hora actual:</span>
            <span className="font-mono">{getCurrentTime()}</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {TIMEZONES.find(tz => tz.value === value)?.name}
          </p>
        </div>
      )}
    </div>
  );
};