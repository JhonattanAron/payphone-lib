"use client";
import { parsePayphoneResult, type PayphoneCheckoutResult } from "./checkout-result.js";
export { parsePayphoneResult, type PayphoneCheckoutResult } from "./checkout-result.js";

import { useEffect, useRef } from "react";

export interface PayphoneCheckoutFrameProps {
  /** Same-origin API route that returns the payment-box HTML as text/html. */
  src: string;
  /** Exact origin visible to the browser for the iframe URL. With a same-origin proxy, this is the app origin. */
  frameOrigin: string;
  onComplete(result: PayphoneCheckoutResult): void;
  title?: string;
  className?: string;
  allow?: string;
}

/** Render the backend-generated PayPhone box page in an iframe and accept only its origin/window message. */
export function PayphoneCheckoutFrame({
  src,
  frameOrigin,
  onComplete,
  title = "PayPhone Checkout",
  className,
  allow = "payment",
}: PayphoneCheckoutFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const expectedOrigin = new URL(frameOrigin).origin;
    const handler = (event: MessageEvent) => {
      if (event.origin !== expectedOrigin || event.source !== frameRef.current?.contentWindow) return;
      const result = parsePayphoneResult(event.data);
      if (result) onComplete(result);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [frameOrigin, onComplete]);

  return <iframe ref={frameRef} src={src} title={title} className={className} allow={allow} />;
}





