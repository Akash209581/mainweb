import { prisma } from "../lib/prisma/client";
import { maintainPayments } from "../lib/paypal/maintenance";
maintainPayments()
  .then((result) => {
    console.log(JSON.stringify({ action: "paypal.maintenance", ...result }));
    if (result.errors) process.exitCode = 1;
  })
  .catch(() => {
    console.error(
      "PayPal maintenance failed; inspect database and provider availability."
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
