
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Building2, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { RecurringExpenseDialog } from "@/components/expenses/RecurringExpenseDialog";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useBranches } from "@/hooks/useBranches";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DatePickerButtonInput from "@/components/DatePickerButtonInput";
import { Label } from '@/components/ui/label';
import { usePriceFormat } from "@/hooks/usePriceFormat";

// INTERFACES
interface ExpenseProvider {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  expense_date: string;
  description: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  expense_provider_id: string | null;
  expense_providers: { name: string } | null;
  branch_id: string;
  branches: { name: string } | null;
}

interface RecurringExpense {
    id: string;
    description: string;
    amount: number;
    recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurrence_interval: number;
    start_date: string;
    end_date: string | null;
    next_generation_date: string;
    is_active: boolean;
    expense_provider_id: string | null;
    expense_providers: { name: string } | null;
    branch_id: string;
    branches: { name: string } | null;
}


// GASTOS COMPONENT
const ExpenseRecordsComponent = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const [filters, setFilters] = useState({
        branchId: "all",
        providerId: "all",
        status: "all",
    });
    const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { formatPrice } = usePriceFormat();

    const { data: branches } = useBranches();
    
    const { data: expenseProviders } = useQuery<ExpenseProvider[]>({
        queryKey: ["expenseProvidersList"],
        queryFn: () => fetchTenantAction("list-expense-providers"),
    });

    const { data: expenses, isLoading } = useQuery<Expense[]>({
        queryKey: ["expenses", { ...filters, startDate, endDate }],
        queryFn: () => fetchTenantAction("list-expenses", { filters: { ...filters, startDate, endDate } }),
    });

    const createExpenseMutation = useMutation({
        mutationFn: (newExpense: any) =>
        fetchTenantAction("create-expense", { expenseData: newExpense }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        toast({ title: "Éxito", description: "Gasto creado exitosamente.", variant: "success" });
        setIsCreateModalOpen(false);
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: "Error al crear gasto: " + (error.response?.data?.error || error.message),
            variant: "destructive",
        });
        },
    });

    const updateExpenseMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) =>
        fetchTenantAction("update-expense", { id, ...updates }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        toast({ title: "Éxito", description: "Gasto actualizado exitosamente.", variant: "success" });
        setIsEditModalOpen(false);
        setSelectedExpense(null);
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: "Error al actualizar gasto: " + (error.response?.data?.error || error.message),
            variant: "destructive",
        });
        },
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: (id: string) =>
        fetchTenantAction("delete-expense", { id }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        toast({ title: "Éxito", description: "Gasto eliminado exitosamente.", variant: "success" });
        setIsDeleteDialogOpen(false);
        setSelectedExpense(null);
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: "Error al eliminar gasto: " + (error.response?.data?.error || error.message),
            variant: "destructive",
        });
        },
    });

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        return expenses.filter((expense) =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.expense_providers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.branches?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm]);

    const columns: ColumnDef<Expense>[] = [
        {
        accessorKey: "expense_date",
        header: "Fecha",
        cell: ({ row }) => format(new Date(row.getValue("expense_date")), "PPP", { locale: es }),
        },
        {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => row.getValue("description"),
        },
        {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            return formatPrice(amount);
        },
        },
        {
        accessorKey: "expense_providers",
        header: "Proveedor",
        cell: ({ row }) => row.original.expense_providers?.name || "N/A",
        },
        {
        accessorKey: "branches",
        header: "Sucursal",
        cell: ({ row }) => row.original.branches?.name || "N/A",
        },
        {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status");
            let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
            let text = "Pendiente";
            if (status === "paid") {
            variant = "default";
            text = "Pagado";
            } else if (status === "overdue") {
            variant = "destructive";
            text = "Vencido";
            }
            return <Badge variant={variant}>{text}</Badge>;
        },
        },
        {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const expense = row.original;

            return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { setSelectedExpense(expense); setIsEditModalOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" />Edición Rápida
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSelectedExpense(expense); setIsDeleteDialogOpen(true); }}>
                    <Trash2 className="mr-2 h-4 w-4" />Eliminar
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            );
        },
        },
    ];

    return (
        <div className="space-y-4 pt-6">
            <PageHeader
                title="Registro de Gastos"
                subtitle="Visualiza y administra los gastos únicos de tu negocio."
                children={
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Gasto
                    </Button>
                }
            />

            <div className="flex flex-col gap-4"> {/* Main container for filter rows */}
                {/* Row 1 */}
                <div className="flex flex-col md:flex-row gap-2"> {/* Use gap-2 for spacing between elements */}
                    <div className="flex-grow md:w-3/4 flex flex-col space-y-2"> {/* Description Input, take 75% */}
                        <Label>Descripción</Label>
                        <Input
                            placeholder="Buscar por descripción o proveedor..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="md:w-1/4 flex flex-col space-y-2"> {/* Status Select, take 25% */}
                        <Label>Estado</Label>
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filtrar por Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="paid">Pagado</SelectItem>
                                <SelectItem value="overdue">Vencido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="flex flex-col md:flex-row gap-2"> {/* Use gap-2 for spacing between elements */}
                    <div className="md:w-1/4 flex flex-col space-y-2"> {/* Branch Select, take 25% */}
                        <Label>Sucursal</Label>
                        <Select
                            value={filters.branchId}
                            onValueChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filtrar por Sucursal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Sucursales</SelectItem>
                                {branches?.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:w-1/4 flex flex-col space-y-2"> {/* Provider Select, take 25% */}
                        <Label>Proveedor</Label>
                        <Select
                            value={filters.providerId}
                            onValueChange={(value) => setFilters((prev) => ({ ...prev, providerId: value }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filtrar por Proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Proveedores</SelectItem>
                                {expenseProviders?.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:w-1/4 flex flex-col space-y-2"> {/* Start Date, take 25% */}
                        <Label>Inicio</Label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date: Date) => setStartDate(date)}
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            customInput={<DatePickerButtonInput />}
                            wrapperClassName="w-full"
                        />
                    </div>
                    <div className="md:w-1/4 flex flex-col space-y-2"> {/* End Date, take 25% */}
                        <Label>Fin</Label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date: Date) => setEndDate(date)}
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            customInput={<DatePickerButtonInput />}
                            wrapperClassName="w-full"
                        />
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredExpenses}
                isLoading={isLoading}
                emptyMessage="No se encontraron gastos registrados."
            />

            {isCreateModalOpen && (
                <ExpenseDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={createExpenseMutation.mutate}
                isSubmitting={createExpenseMutation.isPending}
                />
            )}

            {selectedExpense && isEditModalOpen && (
                <ExpenseDialog
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedExpense(null); }}
                onSubmit={(updates) => updateExpenseMutation.mutate({ id: selectedExpense.id, updates })}
                isSubmitting={updateExpenseMutation.isPending}
                initialData={selectedExpense}
                />
            )}

            {selectedExpense && isDeleteDialogOpen && (
                <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => deleteExpenseMutation.mutate(selectedExpense.id)}
                title="¿Estás seguro de eliminar este gasto?"
                description="Esta acción no se puede deshacer. Se eliminará permanentemente el gasto."
                isConfirming={deleteExpenseMutation.isPending}
                variant="destructive"
                />
            )}
        </div>
    );
}

// GASTOS RECURRENTES COMPONENT
const RecurringExpensesComponent = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRecurringExpense, setSelectedRecurringExpense] = useState<RecurringExpense | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const [filters, setFilters] = useState({
        branchId: "all",
        providerId: "all",
        isActive: "all",
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { formatPrice } = usePriceFormat();

    const { data: branches } = useBranches();
    
    const { data: expenseProviders } = useQuery<ExpenseProvider[]>({
        queryKey: ["expenseProvidersList"],
        queryFn: () => fetchTenantAction("list-expense-providers"),
    });

    const { data: recurringExpenses, isLoading } = useQuery<RecurringExpense[]>({
        queryKey: ["recurringExpenses", filters],
        queryFn: async () => {
        const response = await fetchTenantAction("list-recurring-expenses", { filters });
        return response;
        },
    });

    const createRecurringExpenseMutation = useMutation({
        mutationFn: (newRecurringExpense: any) =>
        fetchTenantAction("create-recurring-expense", { recurringExpenseData: newRecurringExpense }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["recurringExpenses"] });
        toast({ title: "Éxito", description: "Gasto recurrente creado exitosamente.", variant: "success" });
        setIsCreateModalOpen(false);
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: "Error al crear gasto recurrente: " + (error.response?.data?.error || error.message),
            variant: "destructive",
        });
        },
    });

    const updateRecurringExpenseMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) =>
        fetchTenantAction("update-recurring-expense", { id, ...updates }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["recurringExpenses"] });
        toast({ title: "Éxito", description: "Gasto recurrente actualizado exitosamente.", variant: "success" });
        setIsEditModalOpen(false);
        setSelectedRecurringExpense(null);
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: "Error al actualizar gasto recurrente: " + (error.response?.data?.error || error.message),
            variant: "destructive",
        });
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
        fetchTenantAction("toggle-recurring-expense-status", { id, is_active }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["recurringExpenses"] });
        toast({ title: "Éxito", description: "Estado del gasto recurrente actualizado.", variant: "success" });
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: "Error al cambiar estado del gasto recurrente: " + (error.response?.data?.error || error.message),
            variant: "destructive",
        });
        },
    });

    const deleteRecurringExpenseMutation = useMutation({
        mutationFn: (id: string) =>
        fetchTenantAction("delete-recurring-expense", { id }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["recurringExpenses"] });
        toast({ title: "Éxito", description: "Gasto recurrente eliminado exitosamente.", variant: "success" });
        setIsDeleteDialogOpen(false);
        setSelectedRecurringExpense(null);
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: "Error al eliminar gasto recurrente: " + (error.response?.data?.error || error.message),
            variant: "destructive",
        });
        },
    });

    const filteredRecurringExpenses = useMemo(() => {
        if (!recurringExpenses) return [];
        return recurringExpenses.filter((expense) =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.expense_providers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.branches?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [recurringExpenses, searchTerm]);

    const columns: ColumnDef<RecurringExpense>[] = [
        {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
        },
        {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            return formatPrice(amount);
        },
        },
        {
        accessorKey: "recurrence",
        header: "Recurrencia",
        cell: ({ row }) => {
            const type = row.original.recurrence_type;
            const interval = row.original.recurrence_interval;
            let text = "";
            switch (type) {
            case 'daily': text = `Diario (cada ${interval} día(s))`; break;
            case 'weekly': text = `Semanal (cada ${interval} semana(s))`; break;
            case 'monthly': text = `Mensual (cada ${interval} mes(es))`; break;
            case 'yearly': text = `Anual (cada ${interval} año(s))`; break;
            }
            return text;
        },
        },
        {
        accessorKey: "start_date",
        header: "Fecha Inicio",
        cell: ({ row }) => format(new Date(row.getValue("start_date")), "PPP", { locale: es }),
        },
        {
        accessorKey: "next_generation_date",
        header: "Próx. Generación",
        cell: ({ row }) => format(new Date(row.getValue("next_generation_date")), "PPP", { locale: es }),
        },
        {
        accessorKey: "expense_providers",
        header: "Proveedor",
        cell: ({ row }) => row.original.expense_providers?.name || "N/A",
        },
        {
        accessorKey: "branches",
        header: "Sucursal",
        cell: ({ row }) => row.original.branches?.name || "N/A",
        },
        {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => (
            <Badge variant={row.getValue("is_active") ? "default" : "destructive"}>
            {row.getValue("is_active") ? "Activo" : "Inactivo"}
            </Badge>
        ),
        },
        {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const expense = row.original;

            return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { setSelectedRecurringExpense(expense); setIsEditModalOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" />Edición Rápida
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSelectedRecurringExpense(expense); setIsDeleteDialogOpen(true); }}>
                    <Trash2 className="mr-2 h-4 w-4" />Eliminar
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() =>
                    toggleStatusMutation.mutate({ id: expense.id, is_active: !expense.is_active })
                    }
                >
                    <Ban className="mr-2 h-4 w-4" />
                    {expense.is_active ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            );
        },
        },
    ];

    return (
        <div className="space-y-4 pt-6">
            <PageHeader
                title="Gastos Recurrentes"
                subtitle="Define y gestiona los gastos que se repiten periódicamente."
                children={
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Gasto Recurrente
                    </Button>
                }
            />
            <div className="flex flex-col gap-4"> {/* Main container for the single filter row */}
                <div className="flex flex-col md:flex-row gap-2">
                    {/* Description Input: 50% */}
                    <div className="md:w-1/2 flex flex-col space-y-2">
                        <Label>Descripción</Label>
                        <Input
                            placeholder="Buscar por descripción o proveedor..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    {/* Branch Select: ~16.67% (1/3 of remaining 50%) */}
                    <div className="md:w-1/6 flex flex-col space-y-2">
                        <Label>Sucursal</Label>
                        <Select
                            value={filters.branchId}
                            onValueChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filtrar por Sucursal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Sucursales</SelectItem>
                                {branches?.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Provider Select: ~16.67% (1/3 of remaining 50%) */}
                    <div className="md:w-1/6 flex flex-col space-y-2">
                        <Label>Proveedor</Label>
                        <Select
                            value={filters.providerId}
                            onValueChange={(value) => setFilters((prev) => ({ ...prev, providerId: value }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filtrar por Proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <span className="block text-left">Todos los Proveedores</span>
                                </SelectItem>
                                {expenseProviders?.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* isActive Status Select: ~16.67% (1/3 of remaining 50%) */}
                    <div className="md:w-1/6 flex flex-col space-y-2">
                        <Label>Estado</Label>
                        <Select
                            value={filters.isActive}
                            onValueChange={(value) => setFilters((prev) => ({ ...prev, isActive: value }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filtrar por Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="true">Activo</SelectItem>
                                <SelectItem value="false">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <DataTable
                columns={columns}
                data={filteredRecurringExpenses}
                isLoading={isLoading}
                emptyMessage="No se encontraron gastos recurrentes."
            />

            {isCreateModalOpen && (
                <RecurringExpenseDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={createRecurringExpenseMutation.mutate}
                isSubmitting={createRecurringExpenseMutation.isPending}
                />
            )}

            {selectedRecurringExpense && isEditModalOpen && (
                <RecurringExpenseDialog
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedRecurringExpense(null); }}
                onSubmit={(updates) => updateRecurringExpenseMutation.mutate({ id: selectedRecurringExpense.id, updates })}
                isSubmitting={updateRecurringExpenseMutation.isPending}
                initialData={selectedRecurringExpense}
                />
            )}

            {selectedRecurringExpense && isDeleteDialogOpen && (
                <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => deleteRecurringExpenseMutation.mutate(selectedRecurringExpense.id)}
                title="¿Estás seguro de eliminar este gasto recurrente?"
                description="Esta acción no se puede deshacer. Se eliminará permanentemente la definición de gasto recurrente."
                isConfirming={deleteRecurringExpenseMutation.isPending}
                variant="destructive"
                />
            )}
        </div>
    );
};


export default function ExpensesPage() {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <PageHeader
                title="Módulo de Gastos"
                children={
                    <Button variant="outline" onClick={() => navigate('/app/expenses/providers')}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Gestionar Proveedores
                    </Button>
                }
            />
            <Tabs defaultValue="records" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="records">Gastos</TabsTrigger>
                    <TabsTrigger value="recurring">Recurrentes</TabsTrigger>
                </TabsList>
                <TabsContent value="records">
                    <ExpenseRecordsComponent />
                </TabsContent>
                <TabsContent value="recurring">
                    <RecurringExpensesComponent />
                </TabsContent>
            </Tabs>
        </div>
    );
}
