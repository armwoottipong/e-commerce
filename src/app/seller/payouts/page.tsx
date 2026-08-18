import { EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { requireSeller } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function SellerPayoutsPage() {
  const user = await requireSeller();
  const payouts = await prisma.payout.findMany({
    where: { sellerId: user.seller?.id },
    include: { sellerOrder: { include: { order: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-shell max-w-5xl">
      <PageHeader
        eyebrow="Seller studio / Finance"
        title="Payouts"
        description="Manual settlement status for delivered seller orders."
      />
      <div className="mt-8">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="flex items-center justify-between border-b border-ink/10 py-5 first:border-t"
          >
            <div>
              <p className="font-medium">
                {payout.sellerOrder.order.orderNumber}
              </p>
              <p className="text-sm text-ink/60">
                {formatThb(payout.amountThb)}
              </p>
            </div>
            <StatusPill>{payout.status}</StatusPill>
          </div>
        ))}
      </div>
      {payouts.length === 0 && <EmptyState title="No payouts yet" />}
    </main>
  );
}
