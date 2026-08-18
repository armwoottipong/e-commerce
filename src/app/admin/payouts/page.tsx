import { markPayoutPaidAction } from "@/app/actions";
import { Button, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function AdminPayoutsPage() {
  await requireAdmin();
  const payouts = await prisma.payout.findMany({
    include: { seller: true, sellerOrder: { include: { order: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Admin / Finance"
        title="Manual payouts"
        description="Track settlement after platform commission and shipping adjustments."
      />
      <div className="mt-8">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="grid gap-4 border-b border-ink/10 py-5 first:border-t md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium">{payout.seller.shopName}</p>
                <StatusPill>{payout.status}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {payout.sellerOrder.order.orderNumber} ·{" "}
                {formatThb(payout.amountThb)}
              </p>
            </div>
            {payout.status === "PENDING" && (
              <form action={markPayoutPaidAction}>
                <input type="hidden" name="payoutId" value={payout.id} />
                <Button type="submit">Mark paid</Button>
              </form>
            )}
          </div>
        ))}
      </div>
      {payouts.length === 0 && <EmptyState title="No payouts due" />}
    </main>
  );
}
