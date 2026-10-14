export interface PayphoneClientOptions {
  token: string;
  apiBaseUrl?: string;
}

export interface ConfirmTransactionInput {
  transactionId: number;
  clientTxId: string;
}

// Initial public API sketch. Implement transport, response schemas, and
// provider error mapping before publishing a stable version.
export function createPayphoneClient(options: PayphoneClientOptions) {
  if (!options.token) throw new Error("PayPhone token is required");
  const apiBaseUrl = options.apiBaseUrl ?? "https://pay.payphonetodoesposible.com/api";
  return { apiBaseUrl };
}
