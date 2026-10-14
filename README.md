# payphone-lib

Integración reutilizable de la **Cajita de Pagos PayPhone**: el backend genera una página HTML con el SDK oficial `PPaymentButtonBox`, y el frontend la muestra en un iframe. Incluye además cliente para Button API Prepare/Confirm. La aplicación conserva sus órdenes, autenticación, persistencia, idempotencia y entrega del producto.

## Requisitos

- Node.js 20 o superior.
- React 18+ para el componente de iframe.
- Credenciales PayPhone y dominio habilitado para el botón/cajita.
- HTTPS en producción.

## Instalación desde GitHub

```bash
npm install git+https://github.com/JhonattanAron/payphone-lib.git
```

## Variables de entorno

```dotenv
# Backend only: token API privado usado por createPayment/confirmTransaction
PAYPHONE_TOKEN=token_privado_de_api
# Credencial que el SDK oficial de la cajita necesita en el HTML
PAYPHONE_BOX_TOKEN=token_habilitado_para_cajita
PAYPHONE_STORE_ID=id_de_tu_tienda
PAYPHONE_API_BASE_URL=https://pay.payphonetodoesposible.com/api
# Origen exacto de la app que contiene el iframe, sin ruta ni wildcard
PAYPHONE_BOX_PARENT_ORIGIN=http://localhost:3000
```

El HTML de la cajita se entrega al navegador y, por tanto, su configuración `token` queda visible al usuario. Usa únicamente una credencial destinada por PayPhone a la Cajita/Payment Box; **no incrustes un secreto API privado**. Si PayPhone no ofrece una credencial separada para tu integración, confirma con PayPhone el modelo de seguridad antes de exponerla. Nunca pongas el token privado API en el frontend.

El generador usa por defecto el SDK `v1.1` para conservar el comportamiento actual de Invox (`onComplete`). PayPhone documenta actualmente el SDK `v2.0`; puedes seleccionarlo con `sdkVersion: "v2.0"` después de validar el flujo de retorno en tu cuenta. Registra el dominio correcto en PayPhone y configura una `Referrer-Policy` compatible, como `origin` o `origin-when-cross-origin`.

## Backend: generar la cajita

En la ruta backend autenticada, carga la orden desde tu base de datos y construye el HTML en servidor:

```ts
import { sendPayphoneBoxHtml } from "@jhonattanaron/payphone-lib/payment-box";

@Get("payphone-html")
@UseGuards(JwtAuthGuard)
getPayphoneHtml(@Request() req, @Response() res) {
  const order = /* busca y autoriza la orden de req.user */;
  return sendPayphoneBoxHtml(res, {
    token: process.env.PAYPHONE_BOX_TOKEN!,
    storeId: process.env.PAYPHONE_STORE_ID!,
    clientTransactionId: order.clientTransactionId,
    amount: order.amountCents,
    amountWithoutTax: order.amountWithoutTaxCents,
    amountWithTax: order.amountWithTaxCents,
    tax: order.taxCents,
    currency: "USD",
    reference: order.reference,
    email: req.user.email,
    parentOrigin: process.env.PAYPHONE_BOX_PARENT_ORIGIN!,
  });
}
```

`renderPayphoneBoxHtml(options)` devuelve el HTML como string si prefieres responderlo con tu framework. `sendPayphoneBoxHtml(response, options)` añade `Content-Type: text/html`, `Cache-Control: no-store` y `X-Content-Type-Options: nosniff`. El helper escapa datos en el script y configura `postMessage` con el origen exacto del padre.

No aceptes de forma ciega importe, referencia, correo o `clientTransactionId` desde query params: resuelve la orden y el importe en el servidor. El importe debe coincidir con la suma de sus componentes.

## Frontend: renderizar el HTML del backend

```tsx
import { PayphoneCheckoutFrame } from "@jhonattanaron/payphone-lib/frontend";

<PayphoneCheckoutFrame
  src="/api/backend/payments/payphone-html?orderId=order-123"
  frameOrigin="https://app.example.com"
  title="PayPhone Checkout"
  className="h-[70vh] w-full border-0"
  onComplete={({ transactionId, clientTxId }) => {
    // Envía los IDs al backend autenticado para confirmar el pago.
  }}
/>
```

`frameOrigin` es el origen que el navegador ve en la URL final del iframe. Si usas un proxy same-origin como Invox, será el origen del frontend, aunque el proxy reenvíe internamente al backend. El proxy debe reenviar la respuesta HTML y su `Content-Type` sin envolverla en JSON. El componente valida origen y `contentWindow`; el mensaje solo inicia la confirmación, no prueba que el pago fue aprobado.

## Confirmar pago en el backend

```ts
import { createPayphoneClient } from "@jhonattanaron/payphone-lib/backend";

const payphone = createPayphoneClient({ token: process.env.PAYPHONE_TOKEN! });
const confirmation = await payphone.confirmTransaction({ transactionId, clientTxId });
if (confirmation.transactionStatus.toUpperCase() !== "APPROVED") throw new Error("Pago no aprobado");
// Compara monto/moneda/referencia contra tu orden y procesa de forma idempotente.
```

El cliente API también ofrece `createPayment(input)` para Button/Prepare y valida las URLs devueltas por PayPhone antes de entregarlas.

## Exports

- `renderPayphoneBoxHtml(options)` / `sendPayphoneBoxHtml(response, options)` — HTML de Cajita de Pagos desde backend.
- `PayphoneCheckoutFrame` — iframe React para mostrar ese HTML y escuchar su retorno.
- `createPayphoneClient(options)` — cliente Button/Prepare y Button/V2/Confirm.
- `parsePayphoneResult(value)` — parser del mensaje de retorno.

## Seguridad

Mantén privado el token de API, sirve HTML sin caché, autoriza la orden en backend, comprueba importe y moneda, confirma con PayPhone antes de conceder el producto y evita procesar dos veces una transacción. Configura en PayPhone el dominio y el origen de retorno adecuados.

## Apóyame

Si esta librería te resulta útil, puedes seguirme en [Instagram](https://www.instagram.com/jhonattan_aron/).

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).

