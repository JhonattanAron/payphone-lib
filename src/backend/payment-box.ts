export interface PayphoneBoxOptions {
  /** PayPhone Button Box client token used by its official browser SDK. Never pass a private merchant API secret here. */
  token: string;
  storeId: string;
  clientTransactionId: string;
  amount: number;
  amountWithoutTax: number;
  amountWithTax?: number;
  tax?: number;
  service?: number;
  tip?: number;
  currency?: string;
  reference: string;
  /** Exact origin of the parent app, e.g. https://app.example.com. No path or wildcard. */
  parentOrigin: string;
  email?: string;
  phoneNumber?: string;
  documentId?: string;
  identificationType?: number;
  defaultMethod?: "card" | "payphone";
  lang?: string;
  timeZone?: number;
  lat?: string;
  lng?: string;
  optionalParameter?: string;
  sdkVersion?: string;
  title?: string;
}

const DEFAULT_SDK_VERSION = "v1.1";
const PAYPHONE_CDN = "https://cdn.payphonetodoesposible.com/box";

function serializeForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function normalizeParentOrigin(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("parentOrigin must be a valid absolute origin"); }
  if (!/^https?:$/.test(url.protocol) || url.origin !== value.replace(/\/$/, "") || url.username || url.password) {
    throw new Error("parentOrigin must contain only an http(s) origin without a path or credentials");
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("parentOrigin must use HTTPS outside localhost");
  }
  return url.origin;
}

/** Build the complete HTML page for PayPhone's official payment-box SDK, ready to return as text/html from a backend route. */
export function renderPayphoneBoxHtml(options: PayphoneBoxOptions): string {
  if (!options.token?.trim()) throw new Error("PayPhone Button Box token is required");
  if (!options.storeId?.trim()) throw new Error("PayPhone storeId is required");
  if (!options.clientTransactionId?.trim()) throw new Error("clientTransactionId is required");
  if (!Number.isSafeInteger(options.amount) || options.amount <= 0) throw new Error("amount must be a positive integer");
  const amountWithTax = options.amountWithTax ?? 0;
  const tax = options.tax ?? 0;
  const service = options.service ?? 0;
  const tip = options.tip ?? 0;
  const partsTotal = options.amountWithoutTax + amountWithTax + tax + service + tip;
  if (partsTotal !== options.amount) throw new Error("amount must equal amountWithoutTax + amountWithTax + tax + service + tip");
  const parentOrigin = normalizeParentOrigin(options.parentOrigin);
  const sdkVersion = options.sdkVersion ?? DEFAULT_SDK_VERSION;
  if (!/^v\d+(?:\.\d+)?$/.test(sdkVersion)) throw new Error("sdkVersion must be a version such as v1.1");

  const config = {
    token: options.token,
    storeId: options.storeId,
    clientTransactionId: options.clientTransactionId,
    amount: options.amount,
    amountWithoutTax: options.amountWithoutTax,
    amountWithTax,
    tax,
    service,
    tip,
    currency: options.currency ?? "USD",
    reference: options.reference,
    ...(options.email ? { email: options.email } : {}),
    ...(options.phoneNumber ? { phoneNumber: options.phoneNumber } : {}),
    ...(options.documentId ? { documentId: options.documentId } : {}),
    ...(options.identificationType !== undefined ? { identificationType: options.identificationType } : {}),
    defaultMethod: options.defaultMethod ?? "card",
    lang: options.lang ?? "es",
    ...(options.timeZone !== undefined ? { timeZone: options.timeZone } : {}),
    ...(options.lat ? { lat: options.lat } : {}),
    ...(options.lng ? { lng: options.lng } : {}),
    ...(options.optionalParameter ? { optionalParameter: options.optionalParameter } : {}),
  };
  const safeConfig = serializeForInlineScript(config);
  const safeParentOrigin = serializeForInlineScript(parentOrigin);
  const title = escapeHtmlAttribute(options.title ?? "PayPhone Checkout");
  const cssUrl = `${PAYPHONE_CDN}/${sdkVersion}/payphone-payment-box.css`;
  const jsUrl = `${PAYPHONE_CDN}/${sdkVersion}/payphone-payment-box.js`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="${cssUrl}">
  <script type="module" src="${jsUrl}"></script>
  <style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}body{display:flex;align-items:center;justify-content:center}#pp-button{display:flex;align-items:center;justify-content:center;width:100%}</style>
</head>
<body>
  <div id="pp-button"></div>
  <script>
    window.addEventListener("DOMContentLoaded", function () {
      try {
        var config = ${safeConfig};
        var parentOrigin = ${safeParentOrigin};
        config.onComplete = function (model) {
          if (!model || !model.transactionId || !model.clientTransactionId) return;
          window.parent.postMessage({
            type: "PAYPHONE_PAYMENT_COMPLETE",
            transactionId: model.transactionId,
            clientTxId: model.clientTransactionId
          }, parentOrigin);
        };
        new PPaymentButtonBox(config).render("pp-button");
      } catch (error) {
        console.error("PayPhone payment box failed to initialize");
      }
    });
  </script>
</body>
</html>`;
}

/** Framework-neutral response helper for Express/Nest-style response objects. */
export function sendPayphoneBoxHtml<T extends { setHeader(name: string, value: string): unknown; send(body: string): unknown }>(
  response: T,
  options: PayphoneBoxOptions,
): unknown {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.send(renderPayphoneBoxHtml(options));
}

/** Escape text used in an HTML attribute. Inline JavaScript values use JSON serialization separately. */
export function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
