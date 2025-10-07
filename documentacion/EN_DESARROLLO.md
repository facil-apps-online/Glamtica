# Estandarización de UI/UX - Hallazgos Pendientes en Dashboard

Después de la refactorización inicial de `Dashboard.tsx`, se han identificado las siguientes mejoras menores para pulir el componente y asegurar una consistencia total.

## 1. Unificar Estilos y Comportamiento de `Card`

- **Inconsistencia:** Las `StatsCard` tienen un efecto de `hover` (sombra y elevación) que las `Card` principales ("Atenciones de Hoy", "Servicios Más Populares") no poseen.
- **Acción Propuesta:** Decidir si todas las tarjetas en el Dashboard deben tener este efecto o ninguna, y aplicar el estilo de forma consistente. Esto podría implicar modificar el `className` de las `Card` o crear una variante específica.

## 2. Crear Componentes para Estados de Contenido

- **Inconsistencia:** Los estados de "Cargando..." y "No hay datos" dentro de las tarjetas de "Atenciones" y "Servicios" son `divs` con código y estilos duplicados.
- **Acción Propuesta:** Crear dos componentes genéricos y reutilizables:
    - `CardLoadingState`: Para mostrar un spinner o esqueleto de carga estandarizado dentro de una tarjeta.
    - `CardEmptyState`: Para mostrar un mensaje e icono estandarizados cuando no hay contenido.
- **Beneficio:** Simplifica el código de las páginas que consumen datos y asegura que todos los estados de carga/vacío se vean idénticos en toda la aplicación.