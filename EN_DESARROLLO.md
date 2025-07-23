# Desarrollo Actual: Corrección de la Firma de Webhook de Wompi

## Descripción del Problema
Se ha identificado un error en la verificación de la firma de los webhooks de Wompi en la función `wompi-webhook-handler`. La cadena que se está firmando (`messageToSign`) no coincide con el formato esperado por Wompi, lo que provoca fallos en la validación de la integridad de los datos.

## Análisis
Según la documentación de Wompi, la cadena a firmar debe ser la concatenación de:
- `Referencia de la transacción`
- `Monto de la transacción en centavos`
- `Moneda de la transacción`
- (Opcional) `Fecha de expiración` (si se usa el parámetro `expiration-time`)
- `Secreto de integridad`

El código actual en `wompi-webhook-handler/index.ts` construye la cadena a firmar utilizando `signature.properties` y el `timestamp` del webhook, lo cual difiere del formato especificado por Wompi.

## Plan de Acción
1.  **Modificar la construcción de `messageToSign`**: Reemplazar la lógica actual para que la cadena a firmar se construya concatenando `transaction.reference`, `transaction.amount_in_cents`, `transaction.currency`, y `events_secret`. Si `transaction.expires_at` está presente, se incluirá antes del secreto.
2.  **Eliminar el uso de `signature.properties` y `timestamp`** en la construcción de `messageToSign`, ya que no forman parte de la cadena de integridad según la documentación de Wompi.

## Fases
- **Fase 1: Ajuste de la lógica de firma.**
    - Modificar `wompi-webhook-handler/index.ts` para construir `messageToSign` correctamente.
    - Eliminar código obsoleto relacionado con `signature.properties` y `timestamp` en la lógica de firma.
- **Fase 2: Verificación y Pruebas.**
    - (Pendiente) Realizar pruebas con payloads de Wompi para confirmar la correcta verificación de la firma.