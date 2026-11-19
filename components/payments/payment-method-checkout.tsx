"use client";
import { useEffect, useState } from "react";
import type { CheckoutProvider, PaymentMethod } from "@/lib/payments/providers";
import { PayPalCheckout } from "./paypal-checkout";
import Image from "next/image";
import styles from "./checkout.module.css";
import { CheckoutAmount } from "./checkout-amount";

type Checkout = {
  methods: PaymentMethod[];
  csrfToken: string;
  amountCents: number;
  currency: string;
};
const initialMethods: PaymentMethod[] = [
  {
    provider: "PAYPAL",
    name: "PayPal",
    available: false,
    description: "Checking availability…"
  },
  {
    provider: "STRIPE",
    name: "Stripe",
    available: false,
    description: "Checking availability…"
  }
];
export function PaymentMethodCheckout({ registrationId }: { registrationId: string }) {
  const [checkout, setCheckout] = useState<Checkout>();
  const [selected, setSelected] = useState<CheckoutProvider>();
  const [proceeding, setProceeding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading payment methods…");
  const [flow, setFlow] = useState<CheckoutProvider>();
  const [statusOnly, setStatusOnly] = useState(false);
  const [retry, setRetry] = useState(0);
  const endpoint = "/ICGIT/hanvo/checkout/" + encodeURIComponent(registrationId);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setMessage("Loading payment methods…");
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to load payment methods.");
        if (!controller.signal.aborted) {
          setCheckout(result);
          setMessage(
            result.methods.some((method: PaymentMethod) => method.available)
              ? "Select a payment method to continue."
              : "Online payment is currently unavailable. Please contact conference support."
          );
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setMessage(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [endpoint, retry]);

  async function proceed() {
    if (!checkout || !selected || proceeding) return;
    setProceeding(true);
    setMessage("Preparing secure checkout…");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": checkout.csrfToken
        },
        body: JSON.stringify({ provider: selected })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to continue to payment.");
      if (result.provider !== "PAYPAL" || selected !== "PAYPAL")
        throw new Error("Selected payment method is unavailable.");
      setFlow("PAYPAL");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setProceeding(false);
    }
  }
  if (flow === "PAYPAL")
    return (
      <section className={styles.page}>
        <div className={styles.panel}>
          {statusOnly && (
            <div>
              <button
                type="button"
                className={styles.secondaryLink}
                onClick={() => {
                  setFlow(undefined);
                  setStatusOnly(false);
                }}
              >
                Back to payment methods
              </button>
            </div>
          )}
          <PayPalCheckout
            registrationId={registrationId}
            statusOnly={statusOnly}
            summary={
              checkout && (
                <CheckoutAmount
                  amountCents={checkout.amountCents}
                  currency={checkout.currency}
                />
              )
            }
          />
        </div>
      </section>
    );
  return (
    <section className={styles.page} aria-labelledby="checkout-title">
      <div className={styles.panel}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Registration checkout</span>
          <h1 id="checkout-title">Conference payment</h1>
          <p>Choose how you would like to pay for your registration.</p>
        </div>
        {checkout && (
          <CheckoutAmount
            amountCents={checkout.amountCents}
            currency={checkout.currency}
          />
        )}
        <fieldset disabled={loading || proceeding} className={styles.methods}>
          <legend className={styles.legend}>Payment Method</legend>
          {(checkout?.methods || initialMethods).map((method) => (
            <label
              key={method.provider}
              className={`${styles.method} ${selected === method.provider ? styles.selected : ""} ${!method.available ? styles.unavailable : ""}`}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.provider}
                checked={selected === method.provider}
                disabled={!method.available}
                onChange={() => {
                  setSelected(method.provider);
                  setMessage("Select Continue to payment when you are ready.");
                }}
                className={styles.radio}
                aria-describedby={`payment-${method.provider}-description`}
              />
              <span className={styles.methodBody}>
                <span className={styles.methodHeading}>
                  <span className={styles.brand}>
                    <Image
                      src={`/ICGIT/images/payments/${method.provider.toLowerCase()}.svg`}
                      alt=""
                      width={80}
                      height={30}
                      className={styles.logo}
                    />
                    <span className={styles.methodName}>{method.name}</span>
                  </span>
                  {!method.available && !loading && (
                    <span className={styles.badge}>Unavailable</span>
                  )}
                  {selected === method.provider && (
                    <span className={styles.selectedBadge}>✓ Selected</span>
                  )}
                </span>
                <span
                  id={`payment-${method.provider}-description`}
                  className={styles.description}
                >
                  {method.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className={styles.notice} role="status" aria-live="polite">
          {message}
        </p>
        <button
          type="button"
          disabled={!selected || loading || proceeding}
          onClick={proceed}
          className={styles.primaryButton}
        >
          {proceeding ? "Preparing checkout…" : "Continue to payment"}
        </button>
        {!loading && !checkout && (
          <button
            type="button"
            className={styles.secondaryLink}
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        )}
        <button
          type="button"
          disabled={loading || proceeding || !checkout}
          className={styles.secondaryLink}
          onClick={() => {
            setStatusOnly(true);
            setFlow("PAYPAL");
          }}
        >
          Check existing PayPal payment status
        </button>
        <p className={styles.returnLink}>
          <a href="/ICGIT/registration">Return to registration</a>
        </p>
      </div>
    </section>
  );
}
