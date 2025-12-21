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
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useQuery } from "@tanstack/react-query";
import { useBranches } from "@/hooks/useBranches"; // Reusing existing hook
import { Textarea } from "@/components/ui/textarea";
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

interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: any;
}

const formSchema = z.object({
  expense_date: z.date({
    required_error: "La fecha del gasto es requerida.",
  }),
  description: z.string().min(1, "La descripción es requerida.").max(255, "La descripción no puede exceder los 255 caracteres."),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0.01, "El monto debe ser mayor a 0.")
  ),
  expense_provider_id: z.string().uuid("Selecciona un proveedor válido.").nullable().optional(),
  branch_id: z.string().uuid("Selecciona una sucursal válida."),
  status: z.enum(["pending", "paid", "overdue"], {
    required_error: "El estado es requerido.",
  }).default("pending"),
});

export const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expense_date: new Date(),
      description: "",
      amount: 0,
      expense_provider_id: undefined,
      branch_id: "",
      status: "pending",
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
        expense_date: new Date(initialData.expense_date),
        expense_provider_id: initialData.expense_provider_id || undefined,
      });
    } else {
      form.reset({
        expense_date: new Date(),
        description: "",
        amount: 0,
        expense_provider_id: undefined,
        branch_id: "",
        status: "pending",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const selectedBranch = branches?.find(b => b.id === values.branch_id);
    const timezone = profile?.timezone || selectedBranch?.timezone || tenant?.timezone || 'UTC';

    const dateInCorrectTimezone = fromZonedTime(startOfDay(values.expense_date), timezone);

    onSubmit({
      ...values,
      expense_date: dateInCorrectTimezone,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Gasto" : "Registrar Nuevo Gasto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="expense_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha del Gasto</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción breve del gasto" {...field} />
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
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado del Pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="paid">Pagado</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
