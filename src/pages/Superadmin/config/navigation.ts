import {
  Users,
  Settings,
  BarChart3,
  ShieldAlert,
  Server,
  FileText,
  Book,
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
      }
    ]
  },
  {
    group: "Administración",
    items: [
      {
        title: "Plataformas",
        url: "/superadmin/platforms",
        icon: Server,
        roles: ['super_admin']
      },
      {
        title: "Gestión de Accesos",
        url: "/superadmin/access-management",
        icon: Users,
        roles: ['super_admin']
      }
    ]
  },
  {
    group: "Sistema",
    items: [
      {
        title: "Catálogos del Sistema",
        url: "/superadmin/system-catalogs",
        icon: Book,
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