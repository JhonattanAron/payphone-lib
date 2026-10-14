import { renderPayphoneBoxHtml, sendPayphoneBoxHtml } from "../src/backend/payment-box.js";

// NestJS/Express-style controller excerpt. Protect this route with your app's
// auth guard and load amount/reference from a persisted order, not query input.
export function getPayphoneBox(req: any, res: any) {
  const order = req.order; // Load and authorize this in your application.
  return sendPayphoneBoxHtml(res, {
    token: process.env.PAYPHONE_BOX_TOKEN!,
    storeId: process.env.PAYPHONE_STORE_ID!,
    clientTransactionId: order.clientTransactionId,
    amount: order.amountCents,
    amountWithoutTax: order.amountWithoutTaxCents,
    amountWithTax: order.amountWithTaxCents,
    tax: order.taxCents,
    currency: order.currency,
    reference: order.reference,
    email: req.user.email,
    parentOrigin: process.env.PAYPHONE_BOX_PARENT_ORIGIN!,
  });
}

// If you need to customize headers/template handling, call the renderer:
const html = renderPayphoneBoxHtml({
  token: process.env.PAYPHONE_BOX_TOKEN!,
  storeId: process.env.PAYPHONE_STORE_ID!,
  clientTransactionId: "order-123",
  amount: 2500,
  amountWithoutTax: 2500,
  currency: "USD",
  reference: "Suscripción mensual",
  parentOrigin: "https://app.example.com",
});
void html;
