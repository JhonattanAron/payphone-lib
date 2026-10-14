# Plan de extracción a `payphone-lib`

## Fuentes actuales en Invox

- Checkout HTML, retorno, endpoints de verificación/configuración: `backend/src/modules/payment/payment.controller.ts`.
- Cliente API Confirm: `backend/src/modules/payment/payment.service.ts`.
- Aplicación de planes, validación de importe e idempotencia: `backend/src/modules/payment/payment.processor.ts` (esta lógica pertenece a cada producto y no se mueve completa a la librería).
- Módulo NestJS: `backend/src/modules/payment/payment.module.ts`.
- Checkout React/iframe y solicitud de verificación: `frontend-api/app/dashboard/billing/checkout/page.tsx`.

## Trabajo antes de publicar

1. Implementar cliente API con timeout, schemas de respuesta, errores tipados y URLs por ambiente verificadas con documentación/cuenta PayPhone.
2. Implementar una función server-side para confirmar y normalizar la transacción; no exponer token privado en endpoint `/payments/config` ni browser.
3. Extraer UI/adaptador de retorno con `postMessage` que compruebe `origin` exacto; el mensaje del browser solo activa verificación en servidor.
4. Evitar interpolar token, correo, referencia o parámetros sin escape en HTML/JavaScript generado. Hacer server-side el inicio del checkout y validar el importe contra una orden persistida.
5. Mantener en cada app su cola, DB, idempotencia, catálogo/precio y entrega de suscripciones; documentar interfaces para conectarlas.
6. Probar sandbox, callbacks, duplicados, pagos denegados y diferencias de importe; integrar la primera versión en Invox antes de publicarla.

## Variables documentadas

`PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`, `PAYPHONE_API_BASE_URL`, `PAYPHONE_ENVIRONMENT`, `PAYPHONE_RETURN_URL`, `PAYPHONE_WEBHOOK_SECRET`. Son valores configurables; la documentación de PayPhone de la cuenta determina URLs y flujo vigentes.
