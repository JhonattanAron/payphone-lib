import { PayphoneCheckoutFrame } from "../src/frontend/checkout-frame.js";

export function Checkout({ orderId, onPayment }: {
  orderId: string;
  onPayment(result: { transactionId: number; clientTxId: string }): void;
}) {
  const params = new URLSearchParams({ orderId });
  return <PayphoneCheckoutFrame
    src={`/api/backend/payments/payphone-html?${params.toString()}`}
    frameOrigin="https://app.example.com"
    title="PayPhone Checkout Box"
    className="h-[70vh] w-full border-0"
    onComplete={onPayment}
  />;
}
