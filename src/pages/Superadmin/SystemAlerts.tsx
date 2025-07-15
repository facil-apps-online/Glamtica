import React, { useEffect } from 'react';

export default function SystemAlerts() {
  useEffect(() => {
    console.log("SystemAlerts: Rendered.");
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Alertas del Sistema</h1>
      <p>Contenido de la página de Alertas del Sistema.</p>
    </div>
  );
}