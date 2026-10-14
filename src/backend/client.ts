export interface PayphoneClientOptions {
  token: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}
export interface CreatePaymentInput {
  amount: number;
  amountWithoutTax: number;
  amountWithTax?: number;
  tax?: number;
  service?: number;
  tip?: number;
  currency: string;
  clientTransactionId: string;
  reference: string;
  storeId: string;
  phoneNumber?: string;
  email?: string;
  documentId?: string;
  identificationType?: number;
  lat?: string;
  lng?: string;
  optionalParameter?: string;
  responseUrl: string;
}
export interface CreatePaymentResponse {
  paymentId: string;
  payWithPayPhone: string;
  payWithCard: string;
  [key: string]: unknown;
}
export interface ConfirmTransactionInput { transactionId: number; clientTxId: string; }
export interface ConfirmTransactionResponse {
  transactionStatus: string;
  amount: number;
  currency?: string;
  clientTransactionId?: string;
  email?: string;
  [key: string]: unknown;
}
export class PayphoneApiError extends Error {
  constructor(message: string, readonly status?: number, readonly providerResponse?: unknown) {
    super(message); this.name = "PayphoneApiError";
  }
}
const DEFAULT_API = "https://pay.payphonetodoesposible.com/api";

/** Server-side PayPhone Button API client. Keep `token` private; never instantiate in browser code. */
export function createPayphoneClient(options: PayphoneClientOptions) {
  if (!options.token?.trim()) throw new Error("PayPhone token is required");
  const baseUrl = (options.apiBaseUrl ?? DEFAULT_API).replace(/\/+$/, "");
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10000;

  async function request<T>(path: string, body: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(`${baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${options.token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new PayphoneApiError(`PayPhone request failed: ${error instanceof Error ? error.message : "network error"}`);
    }
    const text = await response.text();
    let payload: unknown;
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; }
    if (!response.ok) throw new PayphoneApiError(`PayPhone API returned HTTP ${response.status}`, response.status, payload);
    if (!payload || typeof payload !== "object") throw new PayphoneApiError("PayPhone returned an invalid response", response.status, payload);
    return payload as T;
  }

  return {
    /** Prepares a Button API V2 payment and returns PayPhone's payment URLs. Amount fields use the unit required by PayPhone (commonly cents). */
    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResponse> {
      if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error("Payment amount must be a positive integer");
      if (!input.clientTransactionId || !input.reference || !input.storeId || !input.responseUrl) {
        throw new Error("clientTransactionId, reference, storeId, and responseUrl are required");
      }
      const partsTotal = input.amountWithoutTax + (input.amountWithTax ?? 0) + (input.tax ?? 0) + (input.service ?? 0) + (input.tip ?? 0);
      if (partsTotal !== input.amount) throw new Error("amount must equal amountWithoutTax + amountWithTax + tax + service + tip");
      const created = await request<Partial<CreatePaymentResponse>>("/button/Prepare", input);
      if (!created.paymentId || !created.payWithPayPhone || !created.payWithCard) {
        throw new PayphoneApiError("PayPhone prepare response is missing payment URLs", undefined, created);
      }
      for (const paymentUrl of [created.payWithPayPhone, created.payWithCard]) {
        let parsedUrl: URL;
        try { parsedUrl = new URL(paymentUrl); } catch { throw new PayphoneApiError("PayPhone returned an invalid payment URL", undefined, created); }
        if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "pay.payphonetodoesposible.com") {
          throw new PayphoneApiError("PayPhone returned a payment URL with an unexpected origin", undefined, created);
        }
      }
      return created as CreatePaymentResponse;
    },
    /** Confirms a browser-returned transaction on the server. */
    confirmTransaction(input: ConfirmTransactionInput) {
      if (!Number.isSafeInteger(input.transactionId) || input.transactionId <= 0 || !input.clientTxId) {
        throw new Error("A positive transactionId and clientTxId are required");
      }
      return request<ConfirmTransactionResponse>("/button/V2/Confirm", { id: input.transactionId, clientTxId: input.clientTxId });
    },
  };
}
