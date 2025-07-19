
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslations";

interface Client {
  id?: string;
  name: string;
  phone: string;
  email?: string;
}

interface ClientDialogProps {
  children: React.ReactNode;
  client?: Client;
  isEdit?: boolean;
  onClientCreated?: (clientId: string) => void;
}

export const ClientDialog = ({ children, client, isEdit = false, onClientCreated }: ClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Client>({
    defaultValues: client || {
      name: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = (data: Client) => {
    if (isEdit && client?.id) {
      updateMutation.mutate(
        { id: client.id, updates: data },
        {
          onSuccess: () => {
            setOpen(false);
            reset();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newClient) => {
          setOpen(false);
          reset();
          if (onClientCreated && newClient?.id) {
            onClientCreated(newClient.id);
          }
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('clients.edit') : t('clients.add')}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Edita los datos del cliente' 
              : 'Completa la información del nuevo cliente'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('clients.name')}</Label>
            <Input
              id="name"
              {...register("name", { required: "El nombre es obligatorio" })}
              placeholder="Nombre completo del cliente"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('clients.phone')}</Label>
            <Input
              id="phone"
              {...register("phone", { required: "El teléfono es obligatorio" })}
              placeholder="+34 666 123 456"
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('clients.email')}</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@ejemplo.com"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
