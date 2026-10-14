# payphone-lib

Paquete compartido para integrar el checkout y la API de confirmación de PayPhone desde frontend y backend Node.js. La aplicación integradora mantiene usuarios, órdenes, persistencia, idempotencia y la entrega del producto contratado.

> Estado: estructura inicial de extracción. Revisar `docs/EXTRACTION-PLAN.md` antes de producción. Nunca publiques ni envíes el token privado PayPhone al navegador. La creación/confirmación y la validación final deben ocurrir en el backend.

## Requisitos

- Node.js 20 o superior para backend.
- Credenciales PayPhone emitidas para la tienda y ambiente que corresponda.
- HTTPS y URL de retorno pública en producción.
- El adaptador frontend usa el botón/box oficial de PayPhone; revisa que la versión del SDK coincida con la documentación vigente de PayPhone antes de publicar.

## Instalación desde GitHub

```bash
npm install git+https://github.com/JhonattanAron/payphone-lib.git
```

Fija una versión estable al integrar en otros proyectos:

```bash
npm install git+https://github.com/JhonattanAron/payphone-lib.git#v1.0.0
```

## Variables de entorno

Configura estas variables solo en el backend:

```dotenv
PAYPHONE_TOKEN=token_privado_de_tu_tienda
PAYPHONE_STORE_ID=id_de_tu_tienda
PAYPHONE_API_BASE_URL=https://pay.payphonetodoesposible.com/api
PAYPHONE_ENVIRONMENT=production
PAYPHONE_RETURN_URL=https://tu-dominio.com/pagos/retorno
PAYPHONE_WEBHOOK_SECRET=secreto_opcional_para_validar_notificaciones
```

Para pruebas usa credenciales sandbox proporcionadas por PayPhone y la URL de sandbox indicada en su documentación para tu cuenta. No copies tokens reales a `.env.example`, al frontend, a logs ni al repositorio. El Store ID puede necesitar exposición/configuración en el navegador según el flujo oficial; el token privado nunca.

## Flujo recomendado

1. El frontend solicita al backend iniciar un pago para una orden propia.
2. El backend valida importe/moneda/orden y crea los datos de checkout con PayPhone.
3. PayPhone devuelve al usuario o notifica al servidor.
4. El backend confirma la transacción directamente con PayPhone y valida estado, importe, moneda y referencia.
5. El backend registra la transacción de forma idempotente y entrega el producto solo después de confirmar el pago.

No marques un pago como aprobado únicamente porque el navegador envió un `transactionId` o un mensaje `postMessage`.

## Estructura

- `src/backend`: cliente API y validación de confirmaciones.
- `src/frontend`: adaptadores para iniciar checkout y procesar retorno.
- `examples`: ejemplos sin credenciales.
- `docs/EXTRACTION-PLAN.md`: pasos para completar la separación de Invox.

## Apóyame

Si este proyecto te resulta útil, puedes seguirme en [Instagram](https://www.instagram.com/jhonattan_aron/).

## Seguridad

Valida transacción e importe en el backend, prevén reintentos y duplicados, verifica origen de mensajes entre ventanas, no interpolar entrada del usuario sin escape dentro de HTML/JavaScript, y configura CSP/URLs permitidas según la documentación oficial.


