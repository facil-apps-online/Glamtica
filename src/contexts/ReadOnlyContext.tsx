import React, { createContext, useContext, ReactNode } from 'react';

interface ReadOnlyContextType {
  isReadOnly: boolean;
}

// Creamos el contexto con un valor por defecto.
const ReadOnlyContext = createContext<ReadOnlyContextType>({ isReadOnly: false });

/**
 * Provider que envuelve la aplicación del tenant y le provee el estado de solo lectura.
 */
export const ReadOnlyProvider: React.FC<{ isReadOnly: boolean; children: ReactNode }> = ({ isReadOnly, children }) => {
  return (
    <ReadOnlyContext.Provider value={{ isReadOnly }}>
      {children}
    </ReadOnlyContext.Provider>
  );
};

/**
 * Hook para consumir el estado de solo lectura desde cualquier componente.
 * Devuelve `true` si la aplicación debe estar en modo de solo lectura.
 */
export const useReadOnly = (): ReadOnlyContextType => {
  const context = useContext(ReadOnlyContext);
  // No necesitamos la comprobación de undefined porque proveemos un valor por defecto.
  return context;
};
