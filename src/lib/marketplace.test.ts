import { describe, expect, it } from "vitest";

function splitSellerTotals(
  items: Array<{ sellerId: string; total: number }>,
  shippingPerSeller: number,
  commissionRate: number,
) {
  const groups = new Map<string, number>();
  for (const item of items)
    groups.set(item.sellerId, (groups.get(item.sellerId) ?? 0) + item.total);
  return [...groups.entries()].map(([sellerId, subtotal]) => ({
    sellerId,
    subtotal,
    shipping: shippingPerSeller,
    commission: Math.round(subtotal * commissionRate),
    payout: subtotal - Math.round(subtotal * commissionRate),
  }));
}

describe("marketplace checkout rules", () => {
  it("splits one customer order into seller totals", () => {
    const result = splitSellerTotals(
      [
        { sellerId: "a", total: 10000 },
        { sellerId: "b", total: 20000 },
        { sellerId: "a", total: 5000 },
      ],
      5000,
      0.1,
    );

    expect(result).toEqual([
      {
        sellerId: "a",
        subtotal: 15000,
        shipping: 5000,
        commission: 1500,
        payout: 13500,
      },
      {
        sellerId: "b",
        subtotal: 20000,
        shipping: 5000,
        commission: 2000,
        payout: 18000,
      },
    ]);
  });
});
