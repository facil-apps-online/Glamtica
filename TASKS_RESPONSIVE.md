# Tareas: Corrección de Responsividad Mobile y Bugs de UI — Glamtica.app

Generado a partir de una auditoría de código (estática) + verificación visual en desktop (1440px) realizada el 2026-08-10. El layout general (sidebar) ya es responsive (patrón shadcn con Sheet/drawer bajo el breakpoint `md`) — NO tocar `src/components/ui/sidebar.tsx` ni `src/components/AppSidebar.tsx`.

## Reglas generales para quien ejecute este archivo

1. Cada tarea es independiente y atómica. Ejecutarlas en el orden numerado, una por una.
2. **No cambiar el comportamiento visual en desktop (≥ `md`, 768px)**. Todos los fixes deben ser puramente aditivos (agregar clases de Tailwind con prefijo de breakpoint), nunca eliminar o reemplazar el comportamiento desktop existente.
3. No refactorizar, no renombrar variables, no "mejorar" código fuera de lo pedido en cada tarea.
4. Después de cada tarea, correr `npm run build` (o el comando de build configurado) y confirmar que compila sin errores de TypeScript antes de pasar a la siguiente.
5. Marcar el checkbox `[ ]` → `[x]` de cada tarea al completarla.

---

## 0. [ ] CAUSA RAÍZ GLOBAL — Falta `min-w-0` en el wrapper de contenido, rompe TODA la app en mobile cuando hay contenido ancho no-shrinkable

**Archivo:** `src/components/Layout.tsx`
**Línea:** 87 (`<div className="flex-1 flex flex-col">`)

**Problema:** Este div es un hijo `flex-1` dentro del flex row raíz (`sidebar + contenido`). En CSS Flexbox, un item `flex-1` sin `min-width: 0` nunca se encoge por debajo del ancho intrínseco de su contenido. Cuando cualquier página tiene un elemento que no puede achicarse (ej. la barra de herramientas del editor de texto enriquecido "Quill" en Configuración > Identidad, que tiene ~15 íconos en una fila con `flex-wrap: nowrap`), **toda la app** se estira horizontalmente para acomodarlo — en vez de que `<main className="overflow-auto">` contenga ese desborde con scroll interno, como está pensado. Esto se confirmó en vivo: en `/app/settings?tab=identity` a 412px de ancho, el body termina con `scrollWidth: 510px` y aparece scroll horizontal en toda la página.

Esta es la causa más probable de que "Configuración no tenga nada de responsive" — no es un bug de esa página puntual, es que Configuración tiene el elemento más ancho no-shrinkable de toda la app (la toolbar del editor), y por eso expone el bug del layout raíz que otras páginas no disparan.

**Fix:** Cambiar:
```tsx
<div className="flex-1 flex flex-col">
```
por:
```tsx
<div className="flex-1 flex flex-col min-w-0">
```
Si después de este cambio el desborde persiste en la página de Configuración (verificar con las devtools en modo mobile, pestaña "Identidad"), agregar también `min-w-0` al `<main>` de la línea siguiente:
```tsx
<main className="flex-1 overflow-auto relative p-2 sm:p-4 md:p-6 min-w-0">
```

**Criterio de aceptación:** En `/app/settings?tab=identity` con devtools en modo mobile (ej. 390-412px de ancho), la página ya no debe tener scroll horizontal a nivel de toda la pantalla. La toolbar del editor de texto puede seguir teniendo su propio scroll horizontal interno (aceptable, es contenido secundario), pero el resto del layout (sidebar, header, título, tarjetas) no debe desbordar. Verificar también que ninguna otra página cambió su comportamiento en desktop.

**Ejecutar esta tarea PRIMERO**, antes que las demás de este archivo — es probable que arregle o reduzca la severidad de varios de los hallazgos siguientes sin tocarlos directamente.

---

## 1. [ ] BUG — Texto invisible en inputs de login (email y contraseña)

**Archivo:** `src/pages/Auth.tsx`
**Líneas:** 187 y 209

**Problema:** Ambos `<Input>` tienen `className="bg-gray-50"` (fondo casi blanco) pero el componente `Input` base aplica un color de texto claro (heredado del tema oscuro global), resultando en texto casi invisible (blanco sobre blanco) mientras el usuario escribe su email/contraseña.

**Fix:** Agregar una clase de color de texto oscuro explícita a ambos inputs, por ejemplo cambiar:
```tsx
className="bg-gray-50"
```
por:
```tsx
className="bg-gray-50 text-gray-900"
```
en ambas líneas (187 y 209).

**Criterio de aceptación:** Al escribir en el campo Email o Contraseña de la pantalla de login, el texto tipeado debe verse claramente (color oscuro) sobre el fondo claro del input.

---

## 2. [ ] Causa raíz — `PageHeader` no se adapta a mobile (afecta casi todas las páginas)

**Archivo:** `src/components/PageHeader.tsx`
**Línea:** 12

**Problema:** El contenedor raíz usa `className="flex justify-between items-start mb-6"` sin `flex-col`/`flex-wrap`. En pantallas de ~375-390px, el título y los botones de acción (children) no tienen espacio para acomodarse y se aprietan o desbordan. Este componente es usado por casi todas las páginas de listado/edición de la app.

**Fix:** Cambiar la clase del div raíz para que apile verticalmente en mobile y vuelva a fila en `sm:`:
```tsx
<div className="flex justify-between items-start mb-6">
```
por:
```tsx
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
```

**Criterio de aceptación:** En 375px de ancho, en cualquier página que use `PageHeader` con botones de acción (ej. `/app/inventory`, `/app/expenses`), el título y los botones deben apilarse verticalmente sin cortarse ni desbordar el viewport. En ≥768px el comportamiento debe verse igual que antes (título a la izquierda, botones a la derecha, en una fila).

---

## 3. [ ] `Inventory.tsx` — selector de sucursal con ancho fijo no colapsa en mobile

**Archivo:** `src/pages/Inventory.tsx`
**Líneas:** ~89-145 (buscar el `<div className="w-64">` que envuelve el `<Select>` de sucursal dentro del `PageHeader`)

**Problema:** El `<Select>` de sucursal está envuelto en `<div className="w-64">` (256px fijos), sin variante mobile. Sumado al título "Gestión de Inventario" y al menú de acciones, el contenido total no entra en 375px de ancho.

**Fix:** Cambiar:
```tsx
<div className="w-64">
```
por:
```tsx
<div className="w-full sm:w-64">
```

**Criterio de aceptación:** En 375px, el selector de sucursal ocupa el ancho disponible completo y no fuerza scroll horizontal ni corta el header. En ≥768px debe verse igual que antes (256px fijos).

---

## 4. [ ] `expenses/ExpensesPage.tsx` — 3 headers con botón de texto completo sin colapsar en mobile

**Archivo:** `src/pages/expenses/ExpensesPage.tsx`
**Líneas:** ~248-257, ~605-614, ~734-742 (tres bloques `<PageHeader>` distintos en el mismo archivo)

**Problema:** Los botones de acción de estos tres headers ("Nuevo Gasto", "Nuevo Gasto Recurrente", "Gestionar Proveedores") muestran el texto completo siempre, a diferencia de otras páginas de la app (Products, Services, Combos) que ocultan el texto del botón en mobile y dejan solo el ícono.

**Fix:** En los tres bloques, envolver el texto del botón (no el ícono) en un `<span className="hidden sm:inline">`. Ejemplo, cambiar:
```tsx
<Button onClick={...}><PlusCircle className="mr-2 h-4 w-4" />Nuevo Gasto Recurrente</Button>
```
por:
```tsx
<Button onClick={...}><PlusCircle className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Nuevo Gasto Recurrente</span></Button>
```
Aplicar el mismo patrón a los otros dos botones ("Nuevo Gasto" y "Gestionar Proveedores").

**Criterio de aceptación:** En 375px, cada header de esta página muestra el título y un botón con solo ícono (sin texto), sin desbordar. En ≥640px (`sm`) el texto del botón vuelve a mostrarse como antes.

---

## 5. [ ] `Products/ProductCatalog.tsx` — 4 botones de acción compiten por espacio en el header

**Archivo:** `src/pages/Products/ProductCatalog.tsx`
**Líneas:** ~307-314

**Problema:** El header de Productos tiene 4 botones (UoM, Categorías, Marcas, Nuevo Producto) en un `<div className="flex items-center gap-2">`. Aunque cada botón ya colapsa a solo-ícono en mobile, los 4 juntos sin `flex-wrap` quedan muy ajustados o se desbordan en 375px.

**Fix:** Cambiar:
```tsx
<div className="flex items-center gap-2">
```
por:
```tsx
<div className="flex items-center gap-2 flex-wrap justify-end">
```

**Criterio de aceptación:** En 375px, si los 4 botones no entran en una sola fila, deben pasar a una segunda fila (wrap) en vez de desbordar horizontalmente el contenedor.

---

## 6. [ ] `Products/ProductEditPage.tsx` — formulario con `grid-cols-2` fijo (4 ocurrencias)

**Archivo:** `src/pages/Products/ProductEditPage.tsx`
**Líneas:** 52, 66, 95, 105

**Problema:** El componente `ProductDetailsForm` (usado tanto en la vista mobile como desktop de esta página) tiene 4 divs con `className="grid grid-cols-2 gap-4"` sin variante responsive, forzando 2 columnas también en 375px. Afecta los campos: Nombre/SKU, Categoría/Marca, Contenido de Envase/switch, Precio de Costo/Código de Barras.

**Fix:** En las 4 líneas, cambiar:
```tsx
<div className="grid grid-cols-2 gap-4">
```
por:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

**Criterio de aceptación:** En 375px, cada par de campos se apila en una sola columna (uno debajo del otro). En ≥640px (`sm`), vuelven a mostrarse en 2 columnas como antes.

---

## 7. [ ] `ClientDetailPage.tsx` — campos Teléfono/Email en `grid-cols-2` fijo

**Archivo:** `src/pages/ClientDetailPage.tsx`
**Línea:** ~550

**Problema:** Dentro de la pestaña "Dirección Principal", el div que contiene los campos Teléfono y Email usa `grid grid-cols-2 gap-4` sin variante responsive, a diferencia de otro grid en la misma página (ciudad/estado/CP) que sí usa `grid-cols-1 md:grid-cols-3`.

**Fix:** Cambiar:
```tsx
<div className="grid grid-cols-2 gap-4">
```
(la instancia que envuelve los campos `phone` y `email`) por:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

**Criterio de aceptación:** En 375px, los campos Teléfono y Email se apilan verticalmente. En ≥640px se muestran en 2 columnas como antes.

---

## 8. [ ] `Equipments/EditEquipmentPage.tsx` — grid anidado inconsistente

**Archivo:** `src/pages/Equipments/EditEquipmentPage.tsx`
**Línea:** 75

**Problema:** Dentro de un grid ya responsive (`grid-cols-1 md:grid-cols-2`), hay un sub-grid anidado con `grid grid-cols-2 gap-4` (campos "Frec. Mantenimiento" / "Unidad") que no hereda el comportamiento responsive del padre y queda fijo en 2 columnas incluso en mobile.

**Fix:** Cambiar el sub-grid interno:
```tsx
<div className="grid grid-cols-2 gap-4">
```
por:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

**Criterio de aceptación:** En 375px, "Frec. Mantenimiento" y "Unidad" se apilan verticalmente. En ≥640px se muestran en 2 columnas.

---

## 9. [ ] `Settings/NumberingSequencesPage.tsx` — grid fijo dentro de diálogo

**Archivo:** `src/pages/Settings/NumberingSequencesPage.tsx`
**Línea:** 193

**Problema:** Dentro del `Dialog` de crear/editar secuencia, los campos "Siguiente Número" y "Relleno" están en `grid grid-cols-2 gap-4` sin variante responsive. Prioridad baja (son inputs numéricos cortos que probablemente entran igual), pero inconsistente con el patrón `grid-cols-1 sm:grid-cols-2` usado en el resto de la app.

**Fix:** Cambiar:
```tsx
<div className="grid grid-cols-2 gap-4">
```
por:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

**Criterio de aceptación:** Mismo patrón que las tareas anteriores: apilado en mobile, 2 columnas en ≥640px.

---

## Validación final (después de completar todas las tareas)

- [ ] `npm run build` sin errores.
- [ ] Recorrer manualmente (o con el navegador en modo responsive a 375px) las páginas: Login, Inventario, Gastos, Productos (catálogo y edición), Cliente (detalle), Equipos, Configuración > Numeración. Confirmar que ningún header ni formulario se desborda horizontalmente ni corta contenido.
- [ ] Confirmar en desktop (1440px) que ninguna de estas páginas cambió su apariencia respecto a antes de los fixes.
