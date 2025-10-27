import React, { useState } from 'react';
import { useGetDocumentTypes, useDeleteDocumentType, DocumentType } from '@/hooks/useDocumentTypes';
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, FileText } from 'lucide-react';
import { DocumentTypeDialog } from '@/components/DocumentTypeDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ContactTypesSettingsTab } from './ContactTypesSettingsTab';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function DocumentTypesSettingsTab() {
  const [activeType, setActiveType] = useState('client'); // 'client' or 'supplier'
  const { data: documentTypes, isLoading, error } = useGetDocumentTypes(activeType);
  const deleteMutation = useDeleteDocumentType();
  const { toast } = useToast();


  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Éxito', description: 'Tipo de documento eliminado.' });
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
            <TableHead>Abreviatura</TableHead>
            <TableHead>Aplica a</TableHead>
            <TableHead><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentTypes?.map((docType) => (
            <TableRow key={docType.id}>
              <TableCell className="font-medium">{docType.name}</TableCell>
              <TableCell>{docType.abbreviation}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {docType.applies_to.includes('client') && <Badge variant="outline">Cliente</Badge>}
                  {docType.applies_to.includes('supplier') && <Badge variant="outline">Proveedor</Badge>}
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
                    <DocumentTypeDialog documentType={docType} isEdit={true}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </DocumentTypeDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tipo de documento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(docType.id)} className="bg-red-600 hover:bg-red-700">
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
      {documentTypes?.map((docType) => (
        <Card key={docType.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {docType.name}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DocumentTypeDialog documentType={docType} isEdit={true}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  </DocumentTypeDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tipo de documento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(docType.id)} className="bg-red-600 hover:bg-red-700">
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
            <p><strong>Abreviatura:</strong> {docType.abbreviation}</p>
            <p><strong>Aplica a:</strong></p>
            <div className="flex gap-2">
              {docType.applies_to.includes('client') && <Badge variant="outline">Cliente</Badge>}
              {docType.applies_to.includes('supplier') && <Badge variant="outline">Proveedor</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Parametrización
          </CardTitle>
          <CardDescription>
            Gestiona los tipos de documento y de contacto que se pueden asociar a clientes y proveedores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card>
                        <CardHeader className="flex flex-row items-baseline justify-between">
                          <div>
                            <CardTitle className="text-lg">Tipos de Documento</CardTitle>
                            <CardDescription>Gestiona los tipos de documento que se pueden asociar a clientes y proveedores.</CardDescription>
                          </div>
                          <DocumentTypeDialog>
                            <Button size="sm">
                              <PlusCircle className="w-4 h-4" />
                              <span className="hidden sm:inline ml-2">Añadir Tipo</span>
                            </Button>
                          </DocumentTypeDialog>
                        </CardHeader>
            <CardContent>


              {/* TODO: Add toggle for client/supplier */}

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
          <ContactTypesSettingsTab />
        </CardContent>
      </Card>
    </div>
  );
}