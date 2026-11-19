import { smtpConfigured } from "../lib/email/smtp";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../lib/prisma/client";
import { maintainPayments } from "../lib/paypal/maintenance";

const shutdown = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => shutdown.abort());
async function main() {
  if (
    !(process.env.EMAIL_PROVIDER === "smtp"
      ? smtpConfigured()
      : !!process.env.RESEND_API_KEY) ||
    !process.env.PAYMENT_EMAIL_FROM
  ) {
    throw new Error(
      "Configure the selected email transport and PAYMENT_EMAIL_FROM before starting the payment email worker."
    );
  }
  while (!shutdown.signal.aborted) {
    try {
      const result = await maintainPayments();
      console.log(JSON.stringify({ action: "paypal.maintenance", ...result }));
    } catch {
      console.error("Payment maintenance failed; it will retry on the next cycle.");
    }
    if (shutdown.signal.aborted) break;
    try {
      await wait(60_000, undefined, { signal: shutdown.signal });
    } catch {
      break;
    }
  }
}
main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Payment worker could not start."
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
