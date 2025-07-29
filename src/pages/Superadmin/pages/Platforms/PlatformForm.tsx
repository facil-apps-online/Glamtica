import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';

// Esquema de validación con Zod
const formSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }),
  description: z.string().optional(),
  base_url: z.string().optional(),
});

// Tipado inferido del esquema
export type PlatformFormValues = z.infer<typeof formSchema>;

interface PlatformFormProps {
  initialData?: Partial<PlatformFormValues>;
  onSubmit: (values: PlatformFormValues) => void;
  isSubmitting?: boolean;
}

export const PlatformForm: React.FC<PlatformFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<PlatformFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      base_url: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Plataforma</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Glamtica" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Una breve descripción de la plataforma."
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="base_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Base</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: /" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </form>
    </Form>
  );
};