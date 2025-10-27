import React, { useState } from 'react';
import { useGetContactTypes, useDeleteContactType, ContactType } from '@/hooks/useContactTypes';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContactTypeManagementDialog } from '@/components/ContactTypeManagementDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ContactTypesSettingsTab() {
  const { data: contactTypes, isLoading, error } = useGetContactTypes();
  const deleteMutation = useDeleteContactType();
  const { toast } = useToast();


  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Tipo de contacto eliminado.' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: `No se pudo eliminar: ${error.message}` });
      }
    });
  };

  const renderDesktopView = () => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Aplica a</TableHead>
            <TableHead><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contactTypes?.map((contactType) => (
            <TableRow key={contactType.id}>
              <TableCell className="font-medium">{contactType.name}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {contactType.is_for_client && <Badge variant="outline">Clientes</Badge>}
                  {contactType.is_for_supplier && <Badge variant="outline">Proveedores</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ContactTypeManagementDialog contactType={contactType} isEdit={true}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </ContactTypeManagementDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tipo de contacto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(contactType.id)} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {contactTypes?.map((contactType) => (
        <Card key={contactType.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {contactType.name}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ContactTypeManagementDialog contactType={contactType} isEdit={true}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  </ContactTypeManagementDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tipo de contacto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(contactType.id)} className="bg-red-600 hover:bg-red-700">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {contactType.is_for_client && <Badge variant="outline">Clientes</Badge>}
              {contactType.is_for_supplier && <Badge variant="outline">Proveedores</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-baseline justify-between">
        <div>
          <CardTitle className="text-lg">Tipos de Contacto</CardTitle>
          <CardDescription>Gestiona los tipos de contacto que se pueden asociar a clientes y proveedores.</CardDescription>
        </div>
        <ContactTypeManagementDialog>
          <Button size="sm">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Añadir Tipo</span>
          </Button>
        </ContactTypeManagementDialog>
      </CardHeader>
      <CardContent className="space-y-4">


        {isLoading && <p>Cargando...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        <div className="hidden md:block">
          {renderDesktopView()}
        </div>
        <div className="md:hidden">
          {renderMobileView()}
        </div>
      </CardContent>
    </Card>
  );

}
