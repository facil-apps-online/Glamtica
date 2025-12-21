import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useQuery } from "@tanstack/react-query";
import { useBranches } from "@/hooks/useBranches"; // Reusing existing hook
import { calculateNextGenerationDate } from "@/lib/utils"; // To be created
import { DatePicker } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DatePickerButtonInput from "@/components/DatePickerButtonInput";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

interface ExpenseProvider {
  id: string;
  name: string;
}

interface RecurringExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: any;
}

const formSchema = z.object({
  description: z.string().min(1, "La descripción es requerida.").max(255, "La descripción no puede exceder los 255 caracteres."),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, "El monto debe ser mayor a 0.")
  ),
  recurrence_type: z.enum(["daily", "weekly", "monthly", "yearly"], {
    required_error: "El tipo de recurrencia es requerido.",
  }),
  recurrence_interval: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().min(1, "El intervalo debe ser al menos 1.")
  ),
  start_date: z.date({
    required_error: "La fecha de inicio es requerida.",
  }),
  end_date: z.date().nullable().optional(),
  expense_provider_id: z.string().uuid("Selecciona un proveedor válido.").nullable().optional(),
  branch_id: z.string().uuid("Selecciona una sucursal válida."),
  is_active: z.boolean().default(true).optional(),
});

export const RecurringExpenseDialog: React.FC<RecurringExpenseDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      recurrence_type: "monthly",
      recurrence_interval: 1,
      start_date: new Date(),
      end_date: undefined,
      expense_provider_id: undefined,
      branch_id: "",
      is_active: true,
    },
  });

  const { profile, tenant } = useAuth();
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  
  const { data: expenseProviders, isLoading: isLoadingExpenseProviders } = useQuery<ExpenseProvider[]>({
    queryKey: ["expenseProvidersList"],
    queryFn: () => fetchTenantAction("list-expense-providers"),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        start_date: new Date(initialData.start_date),
        end_date: initialData.end_date ? new Date(initialData.end_date) : undefined,
        expense_provider_id: initialData.expense_provider_id || undefined,
      });
    } else {
      form.reset({
        description: "",
        amount: 0,
        recurrence_type: "monthly",
        recurrence_interval: 1,
        start_date: new Date(),
        end_date: undefined,
        expense_provider_id: undefined,
        branch_id: "",
        is_active: true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const selectedBranch = branches?.find(b => b.id === values.branch_id);
    const timezone = profile?.timezone || selectedBranch?.timezone || tenant?.timezone || 'UTC';

    const startDateInCorrectTimezone = fromZonedTime(startOfDay(values.start_date), timezone);
    const endDateInCorrectTimezone = values.end_date ? fromZonedTime(startOfDay(values.end_date), timezone) : null;

    // Calculate next_generation_date based on the already corrected start_date
    const next_generation_date = calculateNextGenerationDate(
      startDateInCorrectTimezone,
      values.recurrence_type,
      values.recurrence_interval
    );

    onSubmit({
      ...values,
      start_date: startDateInCorrectTimezone,
      end_date: endDateInCorrectTimezone,
      next_generation_date,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Gasto Recurrente" : "Crear Gasto Recurrente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Pago de Arriendo, Servicio de Luz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recurrence_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Recurrencia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recurrence_interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intervalo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Inicio</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    locale="es"
                    dateFormat="dd/MM/yyyy"
                    customInput={<DatePickerButtonInput />}
                    wrapperClassName="w-full"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Fin (Opcional)</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    locale="es"
                    dateFormat="dd/MM/yyyy"
                    customInput={<DatePickerButtonInput />}
                    wrapperClassName="w-full"
                    isClearable={true} // Allow clearing the date
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expense_provider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={isLoadingExpenseProviders}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseProviders?.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={isLoadingBranches}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {initialData && ( // Only show is_active switch in edit mode
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Activo</FormLabel>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
