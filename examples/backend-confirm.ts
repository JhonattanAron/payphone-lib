import { createPayphoneClient } from "../src/backend/client.js";

const payphone = createPayphoneClient({
  token: process.env.PAYPHONE_TOKEN!,
  apiBaseUrl: process.env.PAYPHONE_API_BASE_URL,
});

export async function confirmPayment(transactionId: number, clientTxId: string) {
  const confirmation = await payphone.confirmTransaction({ transactionId, clientTxId });
  if (confirmation.transactionStatus.toUpperCase() !== "APPROVED") {
    throw new Error(`Payment not approved: ${confirmation.transactionStatus}`);
  }
  // Also compare amount/currency/reference against your persisted order and make
  // order fulfillment idempotent before granting the purchased service.
  return confirmation;
}
