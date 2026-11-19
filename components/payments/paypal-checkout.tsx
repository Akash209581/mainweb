"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./checkout.module.css";

type Status = {
  status: string;
  currency?: string;
  amountCents?: number;
  csrfToken: string;
  clientId: string;
};
type Buttons = {
  render: (node: HTMLElement) => Promise<void>;
  close: () => Promise<void>;
};
declare global {
  interface Window {
    paypal?: { Buttons: (options: Record<string, unknown>) => Buttons };
  }
}

export function PayPalCheckout({
  registrationId,
  statusOnly = false,
  summary
}: {
  registrationId: string;
  statusOnly?: boolean;
  summary?: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("Loading checkout…");
  const [complete, setComplete] = useState(false);
  const [watching, setWatching] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    let watchingActive = false;
    let checking = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    setWatching(false);
    setComplete(false);
    let buttons: Buttons | undefined;
    let script: HTMLScriptElement | undefined;
    const endpoint = "/ICGIT/hanvo/paypal/" + encodeURIComponent(registrationId);
    async function json(response: Response) {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout unavailable.");
      return data;
    }
    function finish(status: Status) {
      if (!active) return true;
      if (status.status === "PAID") {
        watchingActive = false;
        if (timer) clearTimeout(timer);
        setWatching(false);
        setComplete(true);
        setMessage("Payment verified. Your registration is confirmed.");
        return true;
      }
      if (
        ["REFUNDED", "PARTIALLY_REFUNDED", "REVERSED", "CANCELLED", "FAILED"].includes(
          status.status
        )
      ) {
        watchingActive = false;
        if (timer) clearTimeout(timer);
        setWatching(false);
        setMessage(
          "Payment status: " +
            status.status +
            ". Contact conference support for assistance."
        );
        return true;
      }
      return false;
    }
    async function checkAutomatically() {
      if (!active || !watchingActive || checking) return;
      checking = true;
      let delay = 10_000;
      try {
        const status: Status = await json(
          await fetch(endpoint, { cache: "no-store", signal: controller.signal })
        );
        if (!finish(status) && active) {
          setMessage(
            "Payment is not yet confirmed. This page will update automatically. Please do not pay again."
          );
        }
      } catch {
        delay = 30_000;
        if (active)
          setMessage(
            "Payment verification is temporarily unavailable. We will check again automatically. Please do not pay again."
          );
      } finally {
        checking = false;
        if (active && watchingActive) timer = setTimeout(checkAutomatically, delay);
      }
    }
    function watchPayment() {
      if (!active || watchingActive) return;
      watchingActive = true;
      setWatching(true);
      timer = setTimeout(checkAutomatically, 5_000);
    }
    function checkOnFocus() {
      if (!watchingActive || checking) return;
      if (timer) clearTimeout(timer);
      void checkAutomatically();
    }
    window.addEventListener("focus", checkOnFocus);
    async function start() {
      const status: Status = await json(
        await fetch(endpoint, { cache: "no-store", signal: controller.signal })
      );
      if (!active) return;
      if (finish(status)) return;
      if (status.status === "PROCESSING") {
        setMessage(
          "PayPal is processing your payment. This page will update automatically once it is confirmed. Please do not pay again."
        );
        watchPayment();
        return;
      }
      if (statusOnly) {
        setMessage(
          "Payment status: " +
            status.status +
            ". No new payment has been started. Contact conference support if you need help."
        );
        watchPayment();
        return;
      }
      if (!status.currency) {
        // The create endpoint chooses currency exclusively from the saved registration.
        const response = await json(
          await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": status.csrfToken
            },
            body: JSON.stringify({ action: "create", provider: "PAYPAL" })
          })
        );
        if (!response.orderId) throw new Error("Checkout unavailable.");
        if (active) setReload((value) => value + 1);
        return;
      }
      setMessage(
        "Amount due: " +
          new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: status.currency
          }).format((status.amountCents || 0) / 100)
      );
      const post = (action: string) =>
        fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": status.csrfToken
          },
          body: JSON.stringify({ action, provider: "PAYPAL" })
        }).then(json);
      if (!window.paypal) {
        script = document.createElement("script");
        script.src =
          "https://www.paypal.com/sdk/js?" +
          new URLSearchParams({
            "client-id": status.clientId,
            currency: status.currency,
            intent: "capture",
            components: "buttons",
            "disable-funding": "card,credit,paylater,venmo"
          });
        script.dataset.sdkIntegrationSource = "conference-checkout";
        await new Promise<void>((resolve, reject) => {
          script!.onload = () => resolve();
          script!.onerror = () =>
            reject(new Error("Unable to load PayPal. Please try again."));
          document.head.append(script!);
        });
      }
      if (!active || !container.current || !window.paypal) return;
      buttons = window.paypal.Buttons({
        createOrder: async () => (await post("create")).orderId,
        onApprove: async () => {
          if (active) setMessage("Verifying your payment. Please wait…");
          try {
            const result = await post("capture");
            if (active && !finish(result)) {
              setMessage(
                "PayPal is processing your payment. This page will update automatically once it is confirmed. Please do not pay again."
              );
              watchPayment();
            }
          } catch (error) {
            if (active) {
              setMessage(
                (error as Error).message +
                  " We will check payment status automatically. Please do not pay again."
              );
              watchPayment();
            }
          }
        },
        onCancel: () => {
          if (active)
            setMessage(
              "Checkout closed. No registration confirmation has been issued. Check payment status before retrying."
            );
        },
        onError: () => {
          if (active)
            setMessage(
              "PayPal could not finish checkout. Check payment status before retrying."
            );
        }
      });
      await buttons.render(container.current);
    }
    start().catch((error) => {
      if (active) setMessage(error.message);
    });
    return () => {
      active = false;
      watchingActive = false;
      controller.abort();
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", checkOnFocus);
      void buttons?.close().catch(() => {});
      script?.remove();
    };
  }, [registrationId, reload, statusOnly]);
  return (
    <section className={styles.providerPanel}>
      <h1 className={styles.providerTitle}>Conference payment</h1>
      {summary}
      <p>
        PayPal is available for eligible international customers. Indian domestic PayPal
        payments are not supported.
      </p>
      <div
        className={complete ? styles.successNotice : styles.notice}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {complete && <strong>Payment successful</strong>}
        <span>{message}</span>
      </div>
      <div ref={container} hidden={complete || watching} />
      {!complete && (
        <button
          className={styles.secondaryLink}
          onClick={() => setReload((value) => value + 1)}
        >
          Check payment status
        </button>
      )}
      <p>
        <a href="/ICGIT/registration">Return to registration</a>
      </p>
    </section>
  );
}
