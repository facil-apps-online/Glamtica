import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit } from 'lucide-react';
import { useUnitsOfMeasure } from '@/hooks/useUnitsOfMeasure';

interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
}

interface UnitOfMeasureDialogProps {
  unit?: UnitOfMeasure;
  trigger?: React.ReactNode;
}

export const UnitOfMeasureDialog: React.FC<UnitOfMeasureDialogProps> = ({ unit, trigger }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const { createUnit, updateUnit } = useUnitsOfMeasure();

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setAbbreviation(unit.abbreviation);
    } else {
      setName('');
      setAbbreviation('');
    }
  }, [unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !abbreviation) return;

    const unitData = { name, abbreviation };

    if (unit) {
      await updateUnit(unit.id, unitData);
    } else {
      await createUnit(unitData);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{unit ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Ej: Mililitro"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="abbreviation" className="text-right">
                Abreviatura
              </Label>
              <Input
                id="abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                className="col-span-3"
                placeholder="Ej: ml"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{unit ? 'Guardar Cambios' : 'Crear Unidad'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
