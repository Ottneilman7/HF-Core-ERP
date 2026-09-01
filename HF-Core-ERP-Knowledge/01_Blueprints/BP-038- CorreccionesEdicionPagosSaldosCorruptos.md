# BP-038

Correcciones Post-Mantenimiento: Imports Faltantes, Edición de Pagos, Saldos Corruptos

Versión: 1.0
Última actualización: 01/08/2026
Origen: apagón prolongado forzó reinstalación del equipo del CEO; al retomar, aparecieron varios bugs que ya se habían dado por resueltos — se re-verificó y corrigió todo el bloque de una vez.

---

## Bugs corregidos

1. **`services/paymentService.ts` no importaba `setDoc`** (solo `writeBatch`), pero `updatePayment` lo usaba — causaba `ReferenceError: setDoc is not defined` al editar un pago. Corregido: `setDoc` agregado al import.
2. **`pages/PurchasesPage.tsx` no importaba `Link`** (react-router-dom), usado para el botón "Ver" hacia `/orders` — causaba pantalla en negro (`ReferenceError: Link is not defined`) al abrir la ficha de Órdenes. Corregido.
3. **`updatePayment` sobrescribía el documento completo** (`setDoc` sin `merge: true`) — cualquier campo no incluido en la edición corría el riesgo de perderse. Corregido: `merge: true`.
4. **Saldo de cliente con residuo de punto flotante**: un pago que debía dejar el saldo en exactamente `$0` a veces dejaba un residuo casi invisible (ej. `0.0000000003`), manteniendo al cliente en "Cuentas pendientes" indefinidamente. Corregido: `customerBalanceService.adjustBalance` redondea a 2 decimales; "Cuentas pendientes" exige más de medio centavo (`balance > 0.005`) para listar a alguien.
5. **Saldo de cliente corrompido a `NaN`**: anular una venta con una factura anterior al campo `netAmountDue` (ver BP-035) restaba `undefined`, produciendo `NaN` — que quedaba grabado permanentemente en Firestore y arruinaba cualquier suma que lo incluyera (`Saldo total por cobrar` en `/customers`). Corregido en dos frentes: `adjustBalance` ahora rechaza montos no numéricos y trata cualquier saldo previo corrupto como `0`; se agregó un campo "Saldo" editable en la ficha de cliente (`/customers` → Editar) para reparar manualmente el dato ya dañado.
6. **Páginas de pagos/facturas se caían en blanco ante un registro antiguo sin un campo nuevo** (ej. factura sin `retentionFraction`, pago sin `method`): un `.toFixed()` o acceso directo sobre `undefined` tumbaba toda la lista, no solo el registro afectado. Corregido con respaldos (`??`, `Number.isFinite`) en cada lectura de campo potencialmente ausente — mismo patrón aplicado de forma sistemática en `InvoicesPage.tsx`, `FinancePage.tsx`, `PaymentsPage.tsx`, `OrdersPage.tsx`.

## Regla de trabajo adoptada (ver también ADR-009, adenda)

Cualquier campo nuevo agregado a un modelo ya en uso debe leerse siempre con respaldo (`?? valorPorDefecto`, `Number.isFinite(...)`) en cada lugar donde se consulta — nunca asumir que todos los registros existentes ya lo tienen. Se repitió el mismo tipo de bug demasiadas veces antes de aplicar esto de forma sistemática.

## Estado

🟢 Cerrado.