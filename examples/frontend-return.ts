import { listenForPayphoneResult } from "../src/frontend/checkout.js";

const iframe = document.querySelector<HTMLIFrameElement>("#payphone-checkout");
if (iframe) {
  const stopListening = listenForPayphoneResult({
    allowedOrigin: "https://your-backend.example.com",
    expectedWindow: iframe.contentWindow ?? undefined,
    onResult: async ({ transactionId, clientTxId }) => {
      // This callback is a signal only: ask YOUR authenticated backend to verify.
      await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionId, clientTxId }),
      });
      stopListening();
    },
  });
}
