# Documentación del Componente: Combobox

## Descripción General

El componente `Combobox` es un control de entrada de datos que combina un campo de texto con un menú desplegable. Permite a los usuarios seleccionar una opción de una lista predefinida o buscarla escribiendo en el campo de texto. Está construido sobre los componentes `Popover` y `Command` de `shadcn/ui`, lo que le confiere un diseño moderno y accesible.

## Características Técnicas

- **Reutilizable y Genérico:** Acepta una lista de opciones (`options`) con un `value` y un `label`, lo que lo hace adaptable a cualquier tipo de dato.
- **Búsqueda Integrada:** Incluye un campo de búsqueda para filtrar las opciones de la lista en tiempo real.
- **Controlado:** El estado del valor seleccionado es manejado externamente a través de las props `value` y `onChange`, siguiendo el patrón de componentes controlados de React.
- **Personalizable:** Permite personalizar los textos de placeholder, búsqueda y mensaje de lista vacía.
- **Desactivación:** Se puede desactivar completamente a través de la prop `disabled`.
- **Accesibilidad:** Utiliza roles ARIA (`combobox`, `aria-expanded`) para mejorar la accesibilidad.

## Props del Componente

El componente acepta las siguientes props a través de su interfaz `ComboboxProps`:

| Prop                | Tipo                               | Requerido | Por Defecto                        | Descripción                                                                                             |
| ------------------- | ---------------------------------- | --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `options`           | `ComboboxOption[]`                 | Sí        | -                                  | Un array de objetos, donde cada objeto debe tener las claves `value` (string) y `label` (string).       |
| `value`             | `string`                           | Opcional  | `undefined`                        | El valor de la opción actualmente seleccionada. Debe coincidir con el `value` de una de las `options`. |
| `onChange`          | `(value: string) => void`          | Sí        | -                                  | Función callback que se ejecuta cuando el usuario selecciona una opción. Recibe el `value` de la opción. |
| `placeholder`       | `string`                           | Opcional  | `"Selecciona una opción..."`       | Texto que se muestra en el botón cuando no hay ningún valor seleccionado.                               |
| `searchPlaceholder` | `string`                           | Opcional  | `"Buscar..."`                      | Texto que se muestra en el campo de búsqueda dentro del popover.                                        |
| `emptyPlaceholder`  | `string`                           | Opcional  | `"No se encontraron opciones."`    | Mensaje que se muestra cuando la búsqueda no arroja resultados.                                         |
| `disabled`          | `boolean`                          | Opcional  | `false`                            | Si es `true`, el `Combobox` se deshabilita y no permite interacción.                                      |

### Interfaz `ComboboxOption`

```typescript
export interface ComboboxOption {
  value: string;
  label: string;
}
```

## Ejemplo de Uso

A continuación, se muestra un ejemplo de cómo implementar el `Combobox` en un componente de React para seleccionar un país.

```tsx
import React, { useState } from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/Combobox';

const countries: ComboboxOption[] = [
  { value: 'es', label: 'España' },
  { value: 'us', label: 'Estados Unidos' },
  { value: 'mx', label: 'México' },
  { value: 'ar', label: 'Argentina' },
];

export function CountrySelector() {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
  };

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="country-combobox" className="block text-sm font-medium text-gray-700 mb-1">
        Selecciona un país
      </label>
      <Combobox
        options={countries}
        value={selectedCountry}
        onChange={handleCountryChange}
        placeholder="Elige tu país..."
        searchPlaceholder="Busca un país por nombre..."
        emptyPlaceholder="País no encontrado."
      />
      {selectedCountry && (
        <p className="mt-2 text-sm text-gray-500">
          Has seleccionado: {countries.find(c => c.value === selectedCountry)?.label}
        </p>
      )}
    </div>
  );
}
```
