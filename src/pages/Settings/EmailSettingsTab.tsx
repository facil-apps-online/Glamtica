// src/pages/settings/EmailSettingsTab.tsx
import React from 'react';

export const EmailSettingsTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Configuración de Envíos de Correo</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Activa o desactiva las notificaciones y asigna la plantilla que se usará para cada tipo de correo.
      </p>
      {/* Aquí irá la lista de configuraciones de envío */}
    </div>
  );
};
