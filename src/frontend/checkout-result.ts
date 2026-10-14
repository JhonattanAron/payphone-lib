export interface PayphoneCheckoutResult { transactionId: number; clientTxId: string; }
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
