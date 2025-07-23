import {
  Users,
  Settings,
  BarChart3,
  ShieldAlert,
  Server,
  FileText,
  SlidersHorizontal,
  BookKey,
  Languages
} from 'lucide-react';

export const superadminNavigationConfig = [
  {
    group: "Gestión Principal",
    items: [
      {
        title: "Dashboard",
        url: "/superadmin/dashboard",
        icon: BarChart3,
        roles: ['super_admin']
      },
      {
        title: "Tenants",
        url: "/superadmin/tenants",
        icon: Users,
        roles: ['super_admin']
      },
      {
        title: "Planes de Suscripción",
        url: "/superadmin/subscription-plans",
        icon: BookKey,
        roles: ['super_admin']
      },
      {
        title: "Precios de Planes",
        url: "/superadmin/plan-pricing",
        icon: SlidersHorizontal,
        roles: ['super_admin']
      }
    ]
  },
  {
    group: "Sistema",
    items: [
      {
        title: "Configuración Global",
        url: "/superadmin/global-settings",
        icon: Settings,
        roles: ['super_admin']
      },
      {
        title: "Integraciones",
        url: "/superadmin/integrations",
        icon: Server,
        roles: ['super_admin']
      },
      {
        title: "Traducciones",
        url: "/superadmin/translations",
        icon: Languages,
        roles: ['super_admin']
      }
    ]
  },
  {
    group: "Monitorización",
    items: [
      {
        title: "Alertas del Sistema",
        url: "/superadmin/system-alerts",
        icon: ShieldAlert,
        roles: ['super_admin']
      },
      {
        title: "Reportes de Errores",
        url: "/superadmin/error-reports",
        icon: FileText,
        roles: ['super_admin']
      },
      {
        title: "Métricas de Rendimiento",
        url: "/superadmin/performance-metrics",
        icon: BarChart3,
        roles: ['super_admin']
      }
    ]
  }
];
