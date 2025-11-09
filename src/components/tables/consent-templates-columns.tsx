import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { ConsentTemplate } from "@/hooks/useConsentTemplates";

export const getConsentTemplatesColumns = (onEdit: (template: ConsentTemplate) => void, onToggleStatus: (template: ConsentTemplate) => void): ColumnDef<ConsentTemplate>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "is_active",
    header: "Activo",
    cell: ({ row }) => {
      const template = row.original;
      return <Switch checked={template.is_active} onCheckedChange={() => onToggleStatus(template)} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const template = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(template)}>
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
