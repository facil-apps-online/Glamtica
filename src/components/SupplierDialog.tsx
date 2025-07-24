
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";

interface Supplier {
  id?: string;
  identification_type: string;
  identification_number: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

interface SupplierDialogProps {
  supplier?: Supplier;
  trigger?: React.ReactNode;
}

const IDENTIFICATION_TYPES = [
  { value: 'NIT', label: 'NIT' },
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'Pasaporte', label: 'Pasaporte' },
];

export const SupplierDialog = ({ supplier, trigger }: SupplierDialogProps) => {
  const [open, setOpen] = useState(false);
  const [identificationType, setIdentificationType] = useState(supplier?.identification_type || "");
  const [identificationNumber, setIdentificationNumber] = useState(supplier?.identification_number || "");
  const [name, setName] = useState(supplier?.name || "");
  const [address, setAddress] = useState(supplier?.address || "");
  const [phone, setPhone] = useState(supplier?.phone || "");
  const [email, setEmail] = useState(supplier?.email || "");

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identificationType || !identificationNumber || !name) {
      return;
    }

    const supplierData = {
      identification_type: identificationType,
      identification_number: identificationNumber,
      name,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
    };

    try {
      if (supplier) {
        await updateMutation.mutateAsync({
          id: supplier.id!,
          updates: supplierData,
        });
      } else {
        await createMutation.mutateAsync(supplierData);
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const resetForm = () => {
    if (!supplier) {
      setIdentificationType("");
      setIdentificationNumber("");
      setName("");
      setAddress("");
      setPhone("");
      setEmail("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identification_type">Tipo de Identificación</Label>
              <Select value={identificationType} onValueChange={setIdentificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {IDENTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identification_number">Número de Identificación</Label>
              <Input
                id="identification_number"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(e.target.value)}
                placeholder="Ej: 900123456-7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proveedor</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Distribuidora Beauty Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección completa del proveedor..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 1 234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@proveedor.com"
              />
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
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {supplier ? "Actualizar" : "Crear"} Proveedor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
