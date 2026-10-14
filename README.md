# payphone-lib

Cliente server-side para PayPhone Button API V2 y utilidades frontend para procesar el retorno del checkout. La aplicación mantiene órdenes, autenticación, persistencia, política de idempotencia y entrega del producto.

## Requisitos

- Node.js 20 o superior para el cliente backend.
- Credenciales de tienda PayPhone para el ambiente configurado.
- Revisa con PayPhone la URL de API, formato de montos, campos obligatorios y ambiente habilitado para tu comercio antes de salir a producción.

## Instalación desde GitHub

```bash
npm install git+https://github.com/JhonattanAron/payphone-lib.git
```

Para fijar una versión o commit:

```bash
npm install git+https://github.com/JhonattanAron/payphone-lib.git#v1.0.0
```

## Variables de entorno

Configúralas únicamente en el backend:

```dotenv
PAYPHONE_TOKEN=token_privado_de_tu_tienda
PAYPHONE_STORE_ID=id_de_tu_tienda
PAYPHONE_API_BASE_URL=https://pay.payphonetodoesposible.com/api
PAYPHONE_ENVIRONMENT=production
PAYPHONE_RETURN_URL=https://tu-dominio.com/pagos/retorno
```

Los ejemplos son marcadores, no credenciales válidas. Usa los datos y URLs sandbox que PayPhone habilite para tu cuenta. Nunca envíes `PAYPHONE_TOKEN` al navegador, ni siquiera dentro de HTML servido por tu API. El cliente no asume una URL sandbox no confirmada; pásala explícitamente en `apiBaseUrl`.

## Confirmar una transacción (backend)

```ts
import { createPayphoneClient } from "@jhonattanaron/payphone-lib/backend";

const payphone = createPayphoneClient({
  token: process.env.PAYPHONE_TOKEN!,
  apiBaseUrl: process.env.PAYPHONE_API_BASE_URL,
});

const confirmation = await payphone.confirmTransaction({ transactionId, clientTxId });
if (confirmation.transactionStatus.toUpperCase() !== "APPROVED") {
  throw new Error("Pago no aprobado");
}
// Compara monto/moneda/referencia con tu orden guardada y procesa de forma idempotente.
```

También ofrece `createPayment(input)` para iniciar un cobro mediante el endpoint Button/Prepare. La unidad y los campos de importe siguen las especificaciones del API habilitado para tu comercio: valida una orden propia en servidor y envía los montos esperados por PayPhone.

## Botón de inicio de sesión React\n\n```tsx\nimport { GoogleSignInButton } from "@jhonattanaron/google-lib/frontend";\n\n<GoogleSignInButton callbackUrl="/dashboard" label="Continuar con Google" className="mi-boton" />\n```\n\nEl componente usa `signIn` de Auth.js. Puedes proporcionar `onError` para manejar errores en tu app.\n\n## Procesar retorno (frontend)

```ts
import { listenForPayphoneResult } from "@jhonattanaron/payphone-lib/frontend";

const stop = listenForPayphoneResult({
  allowedOrigin: "https://api.tu-dominio.com",
  expectedWindow: iframe.contentWindow ?? undefined,
  onResult: ({ transactionId, clientTxId }) => {
    // Envía estos identificadores a TU backend para confirmación con PayPhone.
  },
});
```

El origen debe ser el origen exacto de la ventana que envía el mensaje. El callback del browser solo es una señal; nunca confirmación del pago.

## API exportada

- `createPayphoneClient(options)` — cliente backend con `createPayment` y `confirmTransaction`.
- `PayphoneApiError` — errores HTTP/red con estado y respuesta del proveedor cuando están disponibles.
- `listenForPayphoneResult(options)` y `parsePayphoneResult(value)` — helpers para retorno frontend.
- `CreatePaymentInput`, `ConfirmTransactionResponse`, `PayphoneClientOptions` — tipos TypeScript.

## Seguridad y operación

- Mantén el token privado en secret manager del backend.
- Verifica estado, importe, moneda y referencia en el servidor contra tu orden persistida.
- Protege el endpoint propio con autenticación/rate limits y evita procesar dos veces la misma transacción.
- No confíes en `postMessage`, redirect ni parámetros query como prueba de pago.
- Confirma con PayPhone el ambiente y endpoint de producción/sandbox aplicables a tu comercio.

## Apóyame

Si esta librería te resulta útil, puedes seguirme en [Instagram](https://www.instagram.com/jhonattan_aron/).

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).


