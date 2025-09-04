import React, { useState, useEffect } from 'react';
import { useBranchCommissionData, BranchCommissionData } from '@/hooks/useBranchCommissionData';
import { useUpdateCommission } from '@/hooks/useUpdateCommission'; // Assuming this hook exists from Fase 1
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

interface BranchCommissionsTabContentProps {
  branchId: string;
}

export default function BranchCommissionsTabContent({ branchId }: BranchCommissionsTabContentProps) {
  const { data, isLoading, error, refetch } = useBranchCommissionData(branchId);
  const { mutate: updateCommission } = useUpdateCommission();

  const [commissionData, setCommissionData] = useState<BranchCommissionData | undefined>(undefined);
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set()); // To track which product/service items have unsaved changes

  useEffect(() => {
    if (data) {
      setCommissionData(data);
      setDirtyItems(new Set()); // Reset dirty state when data changes
    }
  }, [data]);

  const markAsDirty = (itemId: string) => {
    setDirtyItems(prev => new Set(prev).add(itemId));
  };

  const handleCommissionChange = (itemId: string, userId: string, type: 'product' | 'service', value: string) => {
    markAsDirty(itemId);
    setCommissionData(prevData => {
      if (!prevData) return prevData;

      const newRate = parseFloat(value);
      const updatedData = { ...prevData };

      if (type === 'product') {
        updatedData.products = updatedData.products.map(product =>
          product.product_id === itemId
            ? {
                ...product,
                users: product.users.map(user =>
                  user.user_id === userId ? { ...user, commission_rate: isNaN(newRate) ? null : newRate } : user
                ),
              }
            : product
        );
      } else {
        updatedData.services = updatedData.services.map(service =>
          service.service_id === itemId
            ? {
                ...service,
                users: service.users.map(user =>
                  user.user_id === userId ? { ...user, commission_rate: isNaN(newRate) ? null : newRate } : user
                ),
              }
            : service
        );
      }
      return updatedData;
    });
  };

  const handleCanPerformChange = (serviceId: string, userId: string, checked: boolean) => {
    markAsDirty(serviceId);
    setCommissionData(prevData => {
      if (!prevData) return prevData;

      const updatedData = { ...prevData };
      updatedData.services = updatedData.services.map(service =>
        service.service_id === serviceId
          ? {
              ...service,
              users: service.users.map(user =>
                user.user_id === userId ? { ...user, can_perform: checked } : user
              ),
            }
          : service
      );
      return updatedData;
    });
  };

  const handleSaveItemCommissions = async (itemId: string, itemType: 'product' | 'service') => {
    if (!commissionData) return;

    const itemsToUpdate = itemType === 'product'
      ? commissionData.products.find(p => p.product_id === itemId)?.users
      : commissionData.services.find(s => s.service_id === itemId)?.users;

    if (!itemsToUpdate) return;

    const mutations = itemsToUpdate.map(user => {
      const payload: any = {
        item_id: itemId,
        user_id: user.user_id,
        branch_id: branchId,
        item_type: itemType,
        commission_rate: user.commission_rate,
      };
      if (itemType === 'service') {
        payload.can_perform = user.can_perform;
      }
      return new Promise((resolve, reject) => {
        updateCommission(payload, {
          onSuccess: resolve,
          onError: reject,
        });
      });
    });

    try {
      await Promise.all(mutations);
      toast({
        title: "Comisiones actualizadas",
        description: `Las comisiones para ${itemType === 'product' ? 'el producto' : 'el servicio'} se han guardado correctamente.`, 
        variant: "success",
      });
      setDirtyItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      refetch(); // Re-fetch data to ensure UI is in sync
    } catch (err: any) {
      toast({
        title: "Error al actualizar comisiones",
        description: err.message || "Hubo un problema al guardar las comisiones.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return <p className="text-red-500">Error al cargar las comisiones de la sucursal: {error.message}</p>;
  }

  if (!commissionData || (commissionData.products.length === 0 && commissionData.services.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <h3 className="text-lg font-semibold mb-2">No hay datos de comisiones para esta sucursal</h3>
        <p>Asegúrate de que haya productos o servicios asignados a esta sucursal y usuarios que puedan venderlos/realizarlos.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Gestión de Comisiones</CardTitle>
      </CardHeader>
      <CardContent>
        {commissionData.products.length > 0 && (
          <div className="mb-8">
            <h3 className="text-md font-semibold mb-4">Comisiones de Productos</h3>
            <Accordion type="multiple" className="w-full">
              {commissionData.products.map(product => (
                <AccordionItem value={product.product_id} key={product.product_id}>
                  <AccordionTrigger>{product.product_name}</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Comisión (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.users.map(user => (
                          <TableRow key={user.user_id}>
                            <TableCell>{user.user_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={user.commission_rate !== null ? user.commission_rate : ''}
                                onChange={(e) => handleCommissionChange(product.product_id, user.user_id, 'product', e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button
                      onClick={() => handleSaveItemCommissions(product.product_id, 'product')}
                      disabled={!dirtyItems.has(product.product_id)}
                      className="mt-4"
                    >
                      Guardar Cambios
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {commissionData.services.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-4">Comisiones de Servicios</h3>
            <Accordion type="multiple" className="w-full">
              {commissionData.services.map(service => (
                <AccordionItem value={service.service_id} key={service.service_id}>
                  <AccordionTrigger>{service.service_name}</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Comisión (%)</TableHead>
                          <TableHead>Puede Realizar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {service.users.map(user => (
                          <TableRow key={user.user_id}>
                            <TableCell>{user.user_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={user.commission_rate !== null ? user.commission_rate : ''}
                                onChange={(e) => handleCommissionChange(service.service_id, user.user_id, 'service', e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`can-perform-${service.service_id}-${user.user_id}`}
                                  checked={user.can_perform || false}
                                  onCheckedChange={(checked) => handleCanPerformChange(service.service_id, user.user_id, checked)}
                                />
                                <Label htmlFor={`can-perform-${service.service_id}-${user.user_id}`}>Sí</Label>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button
                      onClick={() => handleSaveItemCommissions(service.service_id, 'service')}
                      disabled={!dirtyItems.has(service.service_id)}
                      className="mt-4"
                    >
                      Guardar Cambios
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

