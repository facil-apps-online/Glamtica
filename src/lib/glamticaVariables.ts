export interface GlamticaVariable {
  group: string;
  value: string;
  label: string;
}

export const GLAMTICA_VARIABLES: GlamticaVariable[] = [
  // Venta General
  { group: 'Venta', value: '{{venta.numero_factura}}', label: 'Número de Factura' },
  { group: 'Venta', value: '{{venta.fecha_emision}}', label: 'Fecha de Emisión' },
  { group: 'Venta', value: '{{venta.moneda}}', label: 'Moneda (ej: COP)' },
  { group: 'Venta', value: '{{venta.total}}', label: 'Monto Total' },
  { group: 'Venta', value: '{{venta.subtotal}}', label: 'Subtotal' },
  { group: 'Venta', value: '{{venta.total_impuestos}}', label: 'Total Impuestos' },

  // Cliente
  { group: 'Cliente', value: '{{venta.cliente}}', label: 'Objeto Cliente Completo' },
  { group: 'Cliente', value: '{{cliente.nombre_completo}}', label: 'Nombre Completo' },
  { group: 'Cliente', value: '{{cliente.nombres}}', label: 'Nombres' },
  { group: 'Cliente', value: '{{cliente.apellidos}}', label: 'Apellidos' },
  { group: 'Cliente', value: '{{cliente.email}}', label: 'Email' },
  { group: 'Cliente', value: '{{cliente.documento}}', label: 'Número de Documento' },
  { group: 'Cliente', value: '{{cliente.tipo_documento}}', label: 'Tipo de Documento' },
  { group: 'Cliente', value: '{{cliente.telefono}}', label: 'Teléfono' },
  { group: 'Cliente', value: '{{cliente.direccion}}', label: 'Dirección Completa' },
  { group: 'Cliente', value: '{{cliente.ciudad}}', label: 'Ciudad' },
  { group: 'Cliente', value: '{{cliente.pais}}', label: 'País' },

  // Items de la Venta (para usar dentro de un array)
  { group: 'Item', value: '{{venta.items}}', label: 'Array de Items Completo' },
  { group: 'Item', value: '{{item.producto.sku}}', label: 'SKU del Producto' },
  { group: 'Item', value: '{{item.producto.nombre}}', label: 'Nombre del Producto' },
  { group: 'Item', value: '{{item.cantidad}}', label: 'Cantidad del Item' },
  { group: 'Item', value: '{{item.precio_unitario}}', label: 'Precio Unitario' },
  { group: 'Item', value: '{{item.impuestos}}', label: 'Impuestos del Item' },
  { group: 'Item', value: '{{item.total_item}}', label: 'Total del Item' },
];
