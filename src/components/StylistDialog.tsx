import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, UserCheck } from "lucide-react";

interface Stylist {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  commission_rate: number;
  specialties: string[];
  is_active: boolean;
}

interface StylistDialogProps {
  stylist?: Stylist; // Use the new Stylist interface
  trigger?: React.ReactNode;
}

export const StylistDialog = ({ stylist, trigger }: StylistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(stylist?.name || "");
  const [phone, setPhone] = useState(stylist?.phone || "");
  const [email, setEmail] = useState(stylist?.email || "");
  const [commissionRate, setCommissionRate] = useState(stylist?.commission_rate || 50);
  const [specialties, setSpecialties] = useState<string[]>(stylist?.specialties || []);
  const [newSpecialty, setNewSpecialty] = useState("");

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const stylistData = {
      name,
      phone: phone || undefined,
      email: email || undefined,
      commission_rate: commissionRate,
      specialties,
      is_active: true,
    };

    console.log('Stylist data:', stylistData);
    // Aquí iría la lógica para crear/actualizar el estilista
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Estilista
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            {stylist ? "Editar Estilista" : "Nuevo Estilista"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ana María García"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 666 123 456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ana@salon.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission">Comisión por Defecto (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Ej: Coloración"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              />
              <Button type="button" onClick={addSpecialty} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                  {specialty}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeSpecialty(specialty)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {stylist ? "Actualizar" : "Crear"} Estilista
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};