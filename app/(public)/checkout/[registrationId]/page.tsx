import { notFound } from "next/navigation";
import { z } from "zod";
import { PaymentMethodCheckout } from "@/components/payments/payment-method-checkout";
export const metadata = {
  title: "Conference payment",
  robots: { index: false, follow: false }
};
export default async function CheckoutPage({
  params
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).registrationId);
  if (!parsed.success) notFound();
  return <PaymentMethodCheckout registrationId={parsed.data} />;
}
