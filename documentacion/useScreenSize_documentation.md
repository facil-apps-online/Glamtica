# Documentación del Hook `useScreenSize`

El hook `useScreenSize` es una utilidad de React que permite determinar el tamaño de la pantalla y adaptar la interfaz de usuario en consecuencia. Este hook es fundamental para mantener la consistiencia del diseño responsivo a lo largo de toda la aplicación.

## Breakpoints

El hook utiliza los siguientes breakpoints para clasificar los tamaños de pantalla:

- **sm**: pantallas con un ancho menor a `640px`.
- **md**: pantallas con un ancho entre `640px` y `768px`.
- **lg**: pantallas con un ancho entre `768px` y `1024px`.
- **xl**: pantallas con un ancho entre `1024px` y `1280px`.
- **2xl**: pantallas con un ancho mayor o igual a `1280px`.

## Uso

Para utilizar el hook, simplemente impórtalo en tu componente y llama a la función `useScreenSize()`.

```tsx
import { useScreenSize } from '@/hooks/useScreenSize';

const MiComponente = () => {
  const screenSize = useScreenSize();

  // Lógica para adaptar la interfaz según el tamaño de la pantalla
  if (screenSize === 'sm' || screenSize === 'md') {
    // Renderizar la vista para pantallas pequeñas
  } else {
    // Renderizar la vista para pantallas grandes
  }

  return (
    <div>
      {/* ... */}
    </div>
  );
};
```

## Ejemplo de Caso de Uso

Un caso de uso común es mostrar un menú de navegación diferente en dispositivos móviles y de escritorio. En el siguiente ejemplo, se muestra un menú de hamburguesa en pantallas pequeñas y un menú de pestañas en pantallas grandes.

```tsx
import { useScreenSize } from '@/hooks/useScreenSize';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';

const MenuNavegacion = () => {
  const screenSize = useScreenSize();
  const isSmallScreen = screenSize === 'sm' || screenSize === 'md';

  return (
    <div>
      {isSmallScreen ? (
        <Select>
          {/* Opciones del menú para pantallas pequeñas */}
        </Select>
      ) : (
        <Tabs>
          {/* Pestañas del menú para pantallas grandes */}
        </Tabs>
      )}
    </div>
  );
};
```

## Consideraciones

- Este hook se basa en el ancho de la ventana del navegador (`window.innerWidth`).
- El valor de `screenSize` se actualiza automáticamente cada vez que el usuario redimensiona la ventana del navegador.
- Es importante utilizar este hook de manera consistente en toda la aplicación para garantizar una experiencia de usuario coherente.
