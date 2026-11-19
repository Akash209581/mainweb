import styles from "./checkout.module.css";

export function CheckoutAmount({
  amountCents,
  currency
}: {
  amountCents: number;
  currency: string;
}) {
  const amount = new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    amountCents / 100
  );
  return (
    <div className={styles.amountCard} aria-label={`Amount due: ${amount} ${currency}`}>
      <div className={styles.amountLabel}>Amount due</div>
      <div className={styles.amountRow}>
        <strong className={styles.amount}>{amount}</strong>
        <span className={styles.currency}>{currency}</span>
      </div>
      <div className={styles.amountHint}>Your conference registration total</div>
    </div>
  );
}
