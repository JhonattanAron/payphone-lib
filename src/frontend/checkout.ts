import { parsePayphoneResult, type PayphoneCheckoutResult } from "./checkout-result.js";
export { parsePayphoneResult, type PayphoneCheckoutResult } from "./checkout-result.js";
export interface PayphoneMessageOptions {
  allowedOrigin: string;
  expectedWindow?: Window;
  onResult(result: PayphoneCheckoutResult): void;
}
/** Listen for a checkout callback from an iframe and validate its origin and source window. */
export function listenForPayphoneResult(options: PayphoneMessageOptions): () => void {
  const handler = (event: MessageEvent) => {
    if (event.origin !== options.allowedOrigin) return;
    if (options.expectedWindow && event.source !== options.expectedWindow) return;
    const result = parsePayphoneResult(event.data);
    if (result) options.onResult(result);
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

