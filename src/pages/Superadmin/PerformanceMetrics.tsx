import React, { useEffect } from 'react';

export default function PerformanceMetrics() {
  useEffect(() => {
    console.log("PerformanceMetrics: Rendered.");
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Métricas de Rendimiento</h1>
      <p>Contenido de la página de Métricas de Rendimiento.</p>
    </div>
  );
}