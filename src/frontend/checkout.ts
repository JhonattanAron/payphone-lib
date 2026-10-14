export interface PayphoneCheckoutResult { transactionId: number; clientTxId: string; }
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
export function parsePayphoneResult(value: unknown): PayphoneCheckoutResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.type !== "PAYPHONE_PAYMENT_COMPLETE") return null;
  const transactionId = Number(data.transactionId);
  const clientTxId = typeof data.clientTxId === "string" ? data.clientTxId :
    typeof data.clientTransactionId === "string" ? data.clientTransactionId : "";
  if (!Number.isSafeInteger(transactionId) || transactionId <= 0 || !clientTxId.trim()) return null;
  return { transactionId, clientTxId };
}
/** Escape text interpolated into a generated HTML or JS string context. Prefer DOM APIs. */
export function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
