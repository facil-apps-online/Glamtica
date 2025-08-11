import React, { useState, useEffect } from 'react';
import { useTranslationsAdmin } from '@/hooks/useTranslationsAdmin';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserTenantInfo } from '@/hooks/useUserTenantInfo';
import i18n from 'i18next';
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface Translation {
  id: string;
  key: string;
  lang: string;
  value: string;
  tenant_id: string;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

const TranslationAdmin: React.FC = () => {
  const { fetchTranslations, addTranslation, updateTranslation, deleteTranslation } = useTranslationsAdmin();
  const { data: translations, isLoading, isError, refetch } = fetchTranslations();
  const { toast } = useToast();
  const { tenant_id, branch_id, isLoading: isUserTenantInfoLoading } = useUserTenantInfo();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<Partial<Translation> | null>(null);
  const [filterKey, setFilterKey] = useState('');
  const [filterLang, setFilterLang] = useState('');

  const handleAddClick = () => {
    if (!tenant_id) {
      toast({
        title: "Error",
        description: "No se pudo obtener el ID del tenant. Asegúrate de estar logueado.",
        variant: "destructive",
      });
      return;
    }
    setCurrentTranslation({ key: '', lang: '', value: '', tenant_id: tenant_id, branch_id: branch_id || undefined });
    setIsDialogOpen(true);
  };

  const handleEditClick = (translation: Translation) => {
    setCurrentTranslation(translation);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    await deleteTranslation.mutateAsync(id);
    i18n.reloadResources(); // Recargar traducciones en i18next
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTranslation || !tenant_id) return;

    try {
      if (currentTranslation.id) {
        // Update existing translation
        await updateTranslation.mutateAsync(currentTranslation as Translation);
      } else {
        // Add new translation
        await addTranslation.mutateAsync({
          ...currentTranslation as Omit<Translation, 'id' | 'created_at' | 'updated_at'>,
          tenant_id: tenant_id,
          branch_id: branch_id || undefined,
        });
      }
      setIsDialogOpen(false);
      setCurrentTranslation(null);
      i18n.reloadResources(); // Recargar traducciones en i18next
    } catch (error) {
      console.error("Error saving translation:", error);
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al guardar la traducción.",
        variant: "destructive",
      });
    }
  };

  const filteredTranslations = translations?.filter(t => {
    const matchesKey = filterKey === '' || t.key.toLowerCase().includes(filterKey.toLowerCase());
    const matchesLang = filterLang === '' || t.lang.toLowerCase().includes(filterLang.toLowerCase());
    return matchesKey && matchesLang;
  });

  if (isLoading || isUserTenantInfoLoading) return <div>Cargando traducciones...</div>;
  if (isError) return <div>Error al cargar traducciones.</div>;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Administración de Traducciones</h1>

      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="Filtrar por clave..."
          value={filterKey}
          onChange={(e) => setFilterKey(e.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Filtrar por idioma (ej. es, en)..."
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddClick}>Añadir Nueva Traducción</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Clave</TableHead>
            <TableHead>Idioma</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTranslations?.map((translation) => (
            <TableRow key={translation.id}>
              <TableCell className="font-medium">{translation.key}</TableCell>
              <TableCell>{translation.lang}</TableCell>
              <TableCell>{translation.value}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditClick(translation)}>
                  Editar
                </Button>
                <ConfirmationDialog
                  onConfirm={() => handleDeleteClick(translation.id)}
                  title="Confirmar Eliminación"
                  description="¿Estás seguro de que quieres eliminar esta traducción?"
                >
                  <Button variant="destructive" size="sm">
                    Eliminar
                  </Button>
                </ConfirmationDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentTranslation?.id ? 'Editar Traducción' : 'Añadir Nueva Traducción'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key" className="text-right">
                  Clave
                </Label>
                <Input
                  id="key"
                  value={currentTranslation?.key || ''}
                  onChange={(e) => setCurrentTranslation({ ...currentTranslation, key: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lang" className="text-right">
                  Idioma
                </Label>
                <Input
                  id="lang"
                  value={currentTranslation?.lang || ''}
                  onChange={(e) => setCurrentTranslation({ ...currentTranslation, lang: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Valor
                </Label>
                <Textarea
                  id="value"
                  value={currentTranslation?.value || ''}
                  onChange={(e) => setCurrentTranslation({ ...currentTranslation, value: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranslationAdmin;