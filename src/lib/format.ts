// Currency: Bhutanese Ngultrum (Nu.) — 1:1 with prior INR values.
// Export name kept as formatINR to avoid churn across the codebase.
export function formatINR(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
  return `Nu. ${formatted}`;
}
