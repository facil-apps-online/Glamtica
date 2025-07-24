import React from 'react';

export const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <img 
          src="/glamtica.app.png" 
          alt="Glamtica Logo" 
          className="h-24 w-auto animate-pulse mx-auto mb-4"
        />
        <p className="text-lg font-semibold text-primary animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  );
};
