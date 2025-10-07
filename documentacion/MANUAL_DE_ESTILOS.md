# Manual de Estilos y Convenciones de UI

Este documento define los patrones y estándares de diseño y código para la interfaz de usuario de la aplicación. El objetivo es mantener la consistencia visual y estructural en todas las secciones.

## 1. Títulos de Página y Secciones

Existen dos tipos de títulos estandarizados.

### 1.1. Título de Página Principal

Para las páginas principales (Dashboard, Productos, Servicios, etc.), se debe utilizar el componente `<PageHeader>`.

**Características:**
- Provee un título grande y un subtítulo descriptivo.
- Puede contener botones de acción principales.

**Ejemplo (`ProductCatalog.tsx`):**
```jsx
<PageHeader title="Productos" subtitle="Crea y edita los productos base de tu negocio.">
  <div className="flex items-center gap-2">
    <MasterProductDialog 
      trigger={<Button size="sm"><Plus className="w-4 h-4" /><span className="hidden sm:inline ml-2">Nuevo Producto</span></Button>} 
    />
  </div>
</PageHeader>
```

### 1.2. Título de Sección Interna / Pestaña de Configuración

Para las pestañas dentro de una página de configuración (ej. en `Settings`), cada sección debe estar contenida en una `<Card>`. El título se construye con `<CardHeader>` y `<CardTitle>`.

**Características:**
- El `<CardTitle>` debe tener el `className="flex items-center gap-2 text-primary"`.
- Debe incluir un ícono de `lucide-react` de 20x20px (`h-5 w-5`) antes del texto.

**Ejemplo (`GeneralSettingsTab.tsx`):
```jsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-primary">
      <Building className="h-5 w-5" />
      Configuración General
    </CardTitle>
    <CardDescription>Administra la información principal y regional de tu negocio.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* ... */}
  </CardContent>
</Card>
```

## 2. Listas de Datos (Responsivas)

Las listas de datos (productos, usuarios, etc.) deben adaptarse al tamaño de la pantalla.

### 2.1. Estructura General

Se debe usar el hook `useScreenSize` para obtener un booleano `isMobile`. La renderización se bifurca usando un operador ternario.

```jsx
const { isMobile } = useScreenSize();
// ...
return isMobile ? <VistaMovil /> : <VistaEscritorio />;
```

### 2.2. Vista de Escritorio (`<Table>`)

En escritorio, los datos se presentan en un componente `<Table>` de ShadCN.

### 2.3. Vista Móvil (Tarjetas)

En móvil, los datos se presentan como una lista de tarjetas. Para mantener el código limpio, la lógica de una tarjeta individual debe extraerse a un componente definido localmente.

**Ejemplo (`ProductCatalog.tsx`):**

1.  **Definir el componente de la tarjeta:**
    ```jsx
    const ProductCard = ({ product, ...props }) => (
      <Card>
        {/* ... JSX para una tarjeta de producto ... */}
      </Card>
    );
    ```

2.  **Usar el componente en la vista móvil:**
    ```jsx
    // ...
    return isMobile ? (
      <div className="space-y-4 p-4">
        {filteredProducts?.map((product) => (
          <ProductCard key={product.id} product={product} {...props} />
        ))}
      </div>
    ) : (
      <Table>{/* ... */}</Table>
    );
    ```

### 2.4. Estándar de Layout para Tarjetas Móviles

Para mantener la uniformidad en la vista móvil, todas las tarjetas que representan un elemento de una lista deben seguir la siguiente estructura jerárquica:

1.  **`CardHeader`**:
    *   Contiene el título principal del elemento (`<CardTitle>`).
    *   A su derecha, se deben ubicar las acciones principales de la tarjeta, contenidas en un `<DropdownMenu>` que se activa con un botón de ícono (`<MoreHorizontal />`).

2.  **`CardContent`**:
    *   **Datos Relevantes:** La información principal del elemento, presentada en pares de `label`/`value`.
    *   **Switches / Toggles:** Al final del contenido, se deben colocar los interruptores (`<Switch>`) para cambiar estados (ej. "Activo", "Agendable"). Estos deben estar claramente separados del resto de los datos, preferiblemente dentro de un `div` con borde para agruparlos visualmente.

**Ejemplo de Estructura en JSX:**

```jsx
const MiElementoCard = ({ elemento }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle>{elemento.nombre}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* ... DropdownMenuItems ... */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* ... Datos relevantes ... */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Dato 1</span>
        <span>{elemento.dato1}</span>
      </div>
      
      {/* ... Switches al final ... */}
      <div className="flex items-center justify-between rounded-md border p-3 mt-4">
        <label className="text-sm font-medium">Activo</label>
        <Switch
          checked={elemento.activo}
          onCheckedChange={...}
        />
      </div>
    </CardContent>
  </Card>
);
```

## 3. Estados de Carga

### 3.1. El Estándar: Skeletons

El método estándar para mostrar estados de carga en listas es usar **componentes Skeleton**. Cada vista (Tabla y Tarjetas) debe tener su propio componente de esqueleto.

**Nota:** El uso de spinners (íconos giratorios) como en el Dashboard se considera una excepción y debe evitarse en nuevos desarrollos en favor de los skeletons para mantener la consistencia.

### 3.2. Implementación

Se deben crear componentes para el esqueleto de la tabla y de la tarjeta.

**Ejemplo (`ProductCatalog.tsx`):**

1.  **Definir los Skeletons:**
    ```jsx
    const ProductCardSkeleton = () => (
      <Card>{/* ... JSX para el esqueleto de la tarjeta ... */}</Card>
    );

    const ProductTableSkeleton = () => (
      <Table>{/* ... JSX para el esqueleto de la tabla ... */}</Table>
    );
    ```

2.  **Usarlos en la lógica de carga:**
    ```jsx
    if (isLoading) {
      return isMobile 
        ? <div className="space-y-4 p-4">{[...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        : <ProductTableSkeleton />;
    }
    ```

## 4. Botones y Acciones

### 4.1. Botones de Acción Principal

Los botones para acciones principales de la página (ej. "Nuevo Producto") deben colocarse dentro del componente `<PageHeader>`.

Para mantener la consistencia a través de la aplicación, todos los botones de acción dentro del `<PageHeader>` (tanto primarios como secundarios) deben usar el tamaño pequeño: `size="sm"`.

### 4.2. Botones Responsivos

Los botones en el `<PageHeader>` deben ser responsivos, mostrando texto en escritorio y colapsando a solo un ícono en móvil. Esto se logra con clases de utilidades de Tailwind dentro de un `<span>`.

**Ejemplo:**
```jsx
<Button size="sm">
  <Plus className="w-4 h-4" />
  <span className="hidden sm:inline ml-2">Nuevo Producto</span>
</Button>
```

### 4.3. Acciones en Filas / Tarjetas

Las acciones secundarias para un elemento específico de una lista (Editar, Eliminar, etc.) deben agruparse en un `<DropdownMenu>` que se activa con un botón de ícono (`<MoreHorizontal />`).

**Ejemplo (`ProductCatalog.tsx` en la tabla):**
```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Acción 1</DropdownMenuItem>
    <DropdownMenuItem>Acción 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```