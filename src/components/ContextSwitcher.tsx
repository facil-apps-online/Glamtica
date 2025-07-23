import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Building, Check } from 'lucide-react';

export const ContextSwitcher: React.FC = () => {
  const { assignments, currentAssignment, switchAssignment, profile } = useAuth();

  if (!profile || assignments.length <= 1) {
    return null; // No mostrar si no hay múltiples asignaciones
  }

  const currentContextName = currentAssignment?.branch_name 
    ? `${currentAssignment.tenant_name} (${currentAssignment.branch_name})`
    : currentAssignment?.tenant_name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto justify-start">
          <Building className="mr-2 h-4 w-4" />
          <span className="truncate">{currentContextName}</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Cambiar de Contexto</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {assignments.map((assignment) => {
          const contextName = assignment.branch_name
            ? `${assignment.tenant_name} (${assignment.branch_name})`
            : assignment.tenant_name;
          
          const isSelected = assignment.assignment_id === currentAssignment?.assignment_id;

          return (
            <DropdownMenuItem
              key={assignment.assignment_id}
              onSelect={() => !isSelected && switchAssignment(assignment.assignment_id)}
              disabled={isSelected}
            >
              <Check className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
              <div className="flex flex-col">
                <span>{contextName}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {assignment.role_name.replace(/_/g, ' ')}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
