export interface CheckoutResult {
  transactionId: number;
  clientTxId: string;
}

// Treat this browser result only as a signal to ask your backend to verify.
// It must never be considered proof that a payment succeeded.
export function parseCheckoutResult(value: unknown): CheckoutResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (typeof result.transactionId !== "number" || typeof result.clientTxId !== "string") return null;
  return { transactionId: result.transactionId, clientTxId: result.clientTxId };
}
