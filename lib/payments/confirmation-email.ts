export interface PaymentConfirmationDetails {
  name: string;
  conferenceName: string;
  referenceNumber: string;
  amountCents: number;
  currency: string;
  captureId: string;
  paidAt: Date;
  sandbox: boolean;
}

/** Receipt values come only from the verified payment and saved registration. */
export function paymentConfirmationEmail(details: PaymentConfirmationDetails) {
  const amount = new Intl.NumberFormat("en", {
    style: "currency",
    currency: details.currency
  }).format(details.amountCents / 100);
  return {
    subject: `${details.sandbox ? "[SANDBOX TEST] " : ""}Payment successful - ${details.conferenceName}`,
    text: [
      `Hello ${details.name},`,
      "",
      details.sandbox
        ? "This is a Sandbox test confirmation. No real money was charged."
        : "Your payment was successful.",
      `Your registration for ${details.conferenceName} is confirmed.`,
      "",
      `Registration reference: ${details.referenceNumber}`,
      `Amount paid: ${amount} ${details.currency}`,
      `Payment reference: ${details.captureId}`,
      `Payment date: ${details.paidAt.toISOString()}`,
      "",
      "Please keep this email for your records. You do not need to pay again.",
      "If you need help, reply to this email and include your registration reference."
    ].join("\n")
  };
}
