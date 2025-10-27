import React, { useState, useEffect, useMemo } from 'react';
import { useBranchCommissionData, BranchCommissionData } from '@/hooks/useBranchCommissionData';
import { useUpdateCommission } from '@/hooks/useUpdateCommission';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useScreenSize } from "@/hooks/useScreenSize";
import { EmptyState } from '@/components/ui/EmptyState';
import { Percent, Save } from 'lucide-react';

const CommissionsSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
);

const BranchCommissionProductCard = ({ product, handleCommissionChange, handleSaveItemCommissions, dirtyItems }) => (
  <Card className="mb-4">
    <CardHeader>
      <CardTitle className="text-base">{product.product_name}</CardTitle>
    </CardHeader>
    <CardContent>
      {product.users.map(user => (
        <div key={user.user_id} className="flex justify-between items-center py-2 border-b last:border-b-0">
          <span className="text-sm">{user.user_name}</span>
          <Input
            type="number"
            value={user.commission_rate !== null ? user.commission_rate : ''}
            onChange={(e) => handleCommissionChange(product.product_id, user.user_id, 'product', e.target.value)}
            className="w-24 h-8"
            placeholder="%"
          />
        </div>
      ))}
      <Button
        onClick={() => handleSaveItemCommissions(product.product_id, 'product')}
        disabled={!dirtyItems.has(product.product_id)}
        size="sm"
        className="mt-4 w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        Guardar
      </Button>
    </CardContent>
  </Card>
);

const BranchCommissionServiceCard = ({ service, handleCommissionChange, handleCanPerformChange, handleSaveItemCommissions, dirtyItems }) => (
  <Card className="mb-4">
    <CardHeader>
      <CardTitle className="text-base">{service.service_name}</CardTitle>
    </CardHeader>
    <CardContent>
      {service.users.map(user => (
        <div key={user.user_id} className="py-2 border-b last:border-b-0">
          <div className="flex justify-between items-center">
            <span className="text-sm">{user.user_name}</span>
            <Input
              type="number"
              value={user.commission_rate !== null ? user.commission_rate : ''}
              onChange={(e) => handleCommissionChange(service.service_id, user.user_id, 'service', e.target.value)}
              className="w-24 h-8"
              placeholder="%"
            />
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              id={`can-perform-${service.service_id}-${user.user_id}`}
              checked={user.can_perform || false}
              onCheckedChange={(checked) => handleCanPerformChange(service.service_id, user.user_id, checked)}
            />
            <Label htmlFor={`can-perform-${service.service_id}-${user.user_id}`}>Puede Realizar</Label>
          </div>
        </div>
      ))}
      <Button
        onClick={() => handleSaveItemCommissions(service.service_id, 'service')}
        disabled={!dirtyItems.has(service.service_id)}
        size="sm"
        className="mt-4 w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        Guardar
      </Button>
    </CardContent>
  </Card>
);

interface BranchCommissionsTabContentProps {
  branchId: string;
}

export default function BranchCommissionsTabContent({ branchId }: BranchCommissionsTabContentProps) {
  const { data, isLoading, error, refetch } = useBranchCommissionData(branchId);
  const { mutate: updateCommission } = useUpdateCommission();

  const [commissionData, setCommissionData] = useState<BranchCommissionData | undefined>(undefined);
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set());
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  useEffect(() => {
    if (data) {
      setCommissionData(data);
      setDirtyItems(new Set());
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
      const list = type === 'product' ? updatedData.products : updatedData.services;
      const itemKey = type === 'product' ? 'product_id' : 'service_id';

      const updatedList = list.map(item =>
        item[itemKey] === itemId
          ? { ...item, users: item.users.map(user => user.user_id === userId ? { ...user, commission_rate: isNaN(newRate) ? null : newRate } : user) }
          : item
      );

      if (type === 'product') updatedData.products = updatedList as any;
      else updatedData.services = updatedList as any;

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
          ? { ...service, users: service.users.map(user => user.user_id === userId ? { ...user, can_perform: checked } : user) }
          : service
      );
      return updatedData;
    });
  };

  const handleSaveItemCommissions = async (itemId: string, itemType: 'product' | 'service') => {
    if (!commissionData) return;
    const item = (itemType === 'product' ? commissionData.products.find(p => p.product_id === itemId) : commissionData.services.find(s => s.service_id === itemId));
    if (!item?.users) return;

    const mutations = item.users.map(user => {
      const payload: any = {
        item_id: itemId,
        user_id: user.user_id,
        branch_id: branchId,
        item_type: itemType,
        commission_rate: user.commission_rate,
      };
      if (itemType === 'service') payload.can_perform = user.can_perform;
      return updateCommission(payload, { 
        onSuccess: () => {}, // Individual success is handled by Promise.all
        onError: (e) => { throw e; },
      });
    });

    try {
      await Promise.all(mutations);
      toast({ title: "Comisiones actualizadas", description: `Las comisiones para ${item.name} se han guardado.`, variant: "success" });
      setDirtyItems(prev => { const newSet = new Set(prev); newSet.delete(itemId); return newSet; });
      refetch();
    } catch (err: any) {
      toast({ title: "Error al actualizar", description: err.message || "Hubo un problema al guardar.", variant: "destructive" });
    }
  };

  if (isLoading) return <CommissionsSkeleton />;
  if (error) return <p className="text-red-500">Error al cargar las comisiones: {error.message}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Percent className="h-5 w-5" />
            Comisiones
          </CardTitle>
          <CardDescription>Define las comisiones por venta de productos y realización de servicios para cada miembro del equipo en esta sucursal.</CardDescription>
        </CardHeader>
      </Card>

      {commissionData && commissionData.products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comisiones de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div>{commissionData.products.map(p => <BranchCommissionProductCard key={p.product_id} {...{ product: p, handleCommissionChange, handleSaveItemCommissions, dirtyItems }} />)}</div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {commissionData.products.map(product => (
                  <AccordionItem value={product.product_id} key={product.product_id}>
                    <AccordionTrigger>{product.product_name}</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Comisión (%)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {product.users.map(user => (
                            <TableRow key={user.user_id}>
                              <TableCell>{user.user_name}</TableCell>
                              <TableCell>
                                <Input type="number" value={user.commission_rate ?? ''} onChange={(e) => handleCommissionChange(product.product_id, user.user_id, 'product', e.target.value)} className="w-24 h-8" placeholder="%" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button onClick={() => handleSaveItemCommissions(product.product_id, 'product')} disabled={!dirtyItems.has(product.product_id)} size="sm" className="mt-4">
                        <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {commissionData && commissionData.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comisiones de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div>{commissionData.services.map(s => <BranchCommissionServiceCard key={s.service_id} {...{ service: s, handleCommissionChange, handleCanPerformChange, handleSaveItemCommissions, dirtyItems }} />)}</div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {commissionData.services.map(service => (
                  <AccordionItem value={service.service_id} key={service.service_id}>
                    <AccordionTrigger>{service.service_name}</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Comisión (%)</TableHead><TableHead>Puede Realizar</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {service.users.map(user => (
                            <TableRow key={user.user_id}>
                              <TableCell>{user.user_name}</TableCell>
                              <TableCell><Input type="number" value={user.commission_rate ?? ''} onChange={(e) => handleCommissionChange(service.service_id, user.user_id, 'service', e.target.value)} className="w-24 h-8" placeholder="%" /></TableCell>
                              <TableCell><Switch id={`can-perform-${service.service_id}-${user.user_id}`} checked={user.can_perform || false} onCheckedChange={(c) => handleCanPerformChange(service.service_id, user.user_id, c)} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button onClick={() => handleSaveItemCommissions(service.service_id, 'service')} disabled={!dirtyItems.has(service.service_id)} size="sm" className="mt-4">
                        <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && (!commissionData || (commissionData.products.length === 0 && commissionData.services.length === 0)) && (
        <EmptyState Icon={Percent} title="No hay datos de comisiones" description="Asegúrate de que haya productos/servicios y usuarios asignados a esta sucursal." />
      )}
    </div>
  );
}