export function formatThb(satangLike: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(satangLike / 100);
}

export function thb(amount: number) {
  return Math.round(amount * 100);
}
