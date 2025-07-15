import React, { useEffect } from 'react';

export default function ErrorReports() {
  useEffect(() => {
    console.log("ErrorReports: Rendered.");
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Reportes de Errores</h1>
      <p>Contenido de la página de Reportes de Errores.</p>
    </div>
  );
}