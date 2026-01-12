import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { Check } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  features: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, features }) => (
  <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
    <CardHeader>
      <CardTitle className="text-2xl font-bold text-gray-800">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="mb-6 text-gray-600">{description}</p>
      <h4 className="font-semibold mb-3 text-gray-700">Funcionalidades Clave:</h4>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-1" />
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const featuresData = {
  mainManagement: [
    {
      title: "Dashboard",
      description: "El Dashboard es el centro de control de tu negocio, ofreciendo una vista rápida y completa de la actividad diaria y mensual. Permite tomar decisiones informadas al instante.",
      features: [
        "Visualiza las ventas del día y del mes, y compara el rendimiento con períodos anteriores.",
        "Mantén un seguimiento en tiempo real de las citas programadas para el día, incluyendo cliente, servicio y estado.",
        "Conoce cuántos estilistas están activos y disponibles.",
        "Identifica cuáles son tus servicios más rentables y populares en los últimos 30 días.",
        "Analiza una comparativa visual de las ventas del mes actual contra el mes anterior."
      ]
    },
    {
      title: "Atenciones (Agenda)",
      description: "El módulo de Atenciones es una potente agenda diseñada para gestionar todo el ciclo de vida de una cita, desde su creación hasta el pago.",
      features: [
        "Organiza y visualiza las citas en formato de lista o en un calendario interactivo (diario o semanal).",
        "Agenda nuevas atenciones especificando cliente, servicios, productos, combos y el profesional a cargo.",
        "Actualiza el estado de una atención (Confirmada, En Proceso, Finalizada, Pagada, Cancelada) con un solo clic.",
        "Procesa y registra pagos para las atenciones finalizadas, con soporte para múltiples métodos de pago.",
        "Filtra las atenciones por profesional, estado de la cita o fecha para encontrar rápidamente lo que necesitas.",
        "Permite agendar servicios que pueden realizarse simultáneamente, optimizando el tiempo de tus profesionales."
      ]
    },
    {
      title: "Clientes",
      description: "Centraliza toda la información de tus clientes en un solo lugar, permitiéndote ofrecer un servicio más personalizado y construir relaciones duraderas.",
      features: [
        "Mantén un registro completo con nombre, teléfono, correo electrónico y otra información de contacto.",
        "Añade nuevos clientes o actualiza la información de los existentes de forma sencilla.",
        "Vincula clientes a una o más sucursales, ideal para negocios con múltiples locaciones.",
        "Encuentra clientes rápidamente usando un buscador o filtra para ver también los clientes inactivos.",
        "Permite registrar clientes que son dependientes de otros (ej. hijos)."
      ]
    }
  ],
  staff: [
    {
      title: "Equipo",
      description: "Este módulo centraliza la gestión del personal que puede ser agendado para atenciones. Desde aquí se administran sus horarios, permisos y compensaciones.",
      features: [
        "Visualiza la información básica de cada miembro del equipo, incluyendo su estado (activo/inactivo) y sucursal.",
        "Define y modifica los horarios de trabajo de cada profesional para asegurar que la disponibilidad en la agenda sea siempre la correcta.",
        "Registra rápidamente solicitudes de tiempo libre (vacaciones, enfermedad, etc.) para cualquier miembro del equipo.",
        "Configura esquemas de comisiones personalizados por servicios y productos para cada empleado.",
        "Lleva un control del equipamiento (tijeras, secadores, etc.) asignado a cada profesional."
      ]
    },
    {
      title: "Gestión de Ausencias",
      description: "Una vista dedicada para que los administradores aprueben o rechacen las solicitudes de tiempo libre del personal.",
      features: [
        "Muestra una lista de todas las solicitudes de ausencia que están pendientes de revisión.",
        "Permite aprobar o rechazar solicitudes con un solo clic, actualizando automáticamente la disponibilidad del empleado en la agenda.",
        "Visualiza el tipo de ausencia, las fechas solicitadas y las notas adjuntas por el empleado."
      ]
    },
    {
      title: "Historial de Ausencias",
      description: "Un registro completo de todas las solicitudes de tiempo libre, tanto pasadas como futuras. Es una herramienta clave para la planificación y el análisis.",
      features: [
        "Accede al historial completo de ausencias de todo el personal.",
        "Busca y filtra las solicitudes por empleado, estado (aprobada, rechazada, pendiente), tipo de ausencia o rango de fechas.",
        "Permite tanto a administradores como a empleados consultar su propio historial de ausencias."
      ]
    }
  ],
  inventory: [
    {
      title: "Servicios",
      description: "El catálogo central de todos los servicios que ofrece tu negocio.",
      features: [
        "Define servicios con nombre, descripción, duración y categoría.",
        "Asigna diferentes precios para un mismo servicio en distintas sucursales.",
        "Controla qué servicios están disponibles en cada una de tus sucursales.",
        "Establece las comisiones que reciben los profesionales por realizar cada servicio.",
        "Organiza tus servicios en categorías personalizables para una mejor gestión."
      ]
    },
    {
      title: "Productos",
      description: "Gestiona todos los productos que vendes o utilizas en tus servicios.",
      features: [
        "Mantén una lista de todos tus productos con SKU, descripción, marca, categoría y precio de costo.",
        "Organiza tus productos con marcas y categorías que puedes crear y administrar.",
        "Gestiona precios por sucursal y define comisiones para los vendedores.",
        "Decide qué productos están disponibles en cada sucursal.",
        "Define y gestiona diferentes unidades de medida para tus productos."
      ]
    },
    {
      title: "Combos",
      description: "Crea y administra paquetes o kits que agrupan múltiples servicios y/o productos a un precio especial.",
      features: [
        "Agrupa varios ítems (servicios y productos) en un solo combo con su propio SKU y nombre.",
        "El precio del combo puede ser la suma de sus partes o un precio especial definido por ti.",
        "Controla la disponibilidad de cada combo en tus diferentes sucursales.",
        "Activa o desactiva combos fácilmente desde el catálogo."
      ]
    },
    {
      title: "Inventario",
      description: "Un dashboard completo para el control de stock, compras y proveedores a nivel de sucursal.",
      features: [
        "Visualiza la cantidad de cada producto en la sucursal seleccionada.",
        "Recibe notificaciones automáticas de productos con stock bajo o sin stock.",
        "Conoce el valor monetario total de tu inventario en tiempo real.",
        "Registra órdenes de compra a proveedores, actualizando el stock automáticamente al completarlas.",
        "Mantén una base de datos de tus proveedores.",
        "Mueve stock de un producto de una sucursal a otra de forma controlada."
      ]
    },
    {
      title: "Equipos",
      description: "Lleva un registro detallado de las herramientas y activos de tu negocio, desde secadores hasta sillas.",
      features: [
        "Registra cada equipo con su tipo, marca, número de serie y estado.",
        "Asigna cada equipo a un profesional y/o a una sucursal para saber siempre dónde está.",
        "Registra y consulta el historial de mantenimientos realizados a cada equipo para prolongar su vida útil.",
        "Organiza tu inventario de equipos con tipos y marcas personalizables."
      ]
    }
  ],
  analysis: [
    {
      title: "Reportes",
      description: "Este es el centro de inteligencia de tu negocio. Obtén métricas y análisis detallados para entender el rendimiento y tomar decisiones estratégicas basadas en datos.",
      features: [
        "Analiza el rendimiento de tu negocio en cualquier rango de fechas que elijas.",
        "Conoce de un vistazo los ingresos totales, el número de atenciones finalizadas y el ticket promedio del período seleccionado.",
        "Descubre qué servicios son los más populares y cuáles generan más ingresos.",
        "Analiza el desempeño de cada miembro del personal, viendo cuántas atenciones han completado y los ingresos que han generado por servicios y productos.",
        "Obtén un resumen detallado del valor de tu inventario por producto y sucursal, con opción a exportar a Excel."
      ]
    }
  ],
  configuration: [
    {
      title: "Configuración General",
      description: "Este es el panel de control para personalizar el comportamiento de la aplicación y adaptarla a las necesidades específicas de tu negocio.",
      features: [
        "Configura la información de tu negocio, como el nombre, la moneda por defecto y la zona horaria.",
        "Personaliza la apariencia de tu entorno subiendo el logo de tu marca.",
        "Administra los usuarios que tienen acceso a la plataforma, asigna roles y controla sus permisos.",
        "Define configuraciones específicas para el módulo de clientes.",
        "Personaliza cómo se gestionan las compras, el stock y los procesos de venta.",
        "Administra los números de secuencia para facturas y otros documentos.",
        "Gestiona los televisores registrados y las playlists de medios que se muestran en pantalla.",
        "Configura los detalles fiscales de tu negocio para la facturación.",
        "Administra tu plan de suscripción a Glamtica."
      ]
    },
    {
      title: "Sucursales",
      description: "Gestiona todas las ubicaciones físicas de tu negocio desde una única interfaz.",
      features: [
        "Añade nuevas sucursales con su información de contacto, dirección y horarios.",
        "Visualiza todas tus sucursales en una tabla o en formato de tarjetas para una fácil administración.",
        "Activa nuevas sucursales que están pendientes de pago o configuración.",
        "Define qué miembros del equipo pertenecen a cada sucursal.",
        "Personaliza ajustes específicos para cada ubicación, como los métodos de pago disponibles."
      ]
    }
  ]
};

const FeaturesPage: React.FC = () => {
  return (
    <LegalPageLayout>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight lg:text-5xl">Características de Glamtica</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">Un vistazo profundo a todas las herramientas que te ofrecemos para gestionar y hacer crecer tu negocio.</p>
      </div>
      
      <div className="space-y-12">
        <div>
          <h2 className="text-3xl font-bold text-center mb-8 border-b-2 border-purple-200 pb-4">Gestión Principal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {featuresData.mainManagement.map(feature => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-center mb-8 border-b-2 border-purple-200 pb-4">Staff</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {featuresData.staff.map(feature => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-center mb-8 border-b-2 border-purple-200 pb-4">Inventario</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {featuresData.inventory.map(feature => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-center mb-8 border-b-2 border-purple-200 pb-4">Análisis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {featuresData.analysis.map(feature => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-center mb-8 border-b-2 border-purple-200 pb-4">Configuración</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {featuresData.configuration.map(feature => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </div>

      </div>
    </LegalPageLayout>
  );
};

export default FeaturesPage;