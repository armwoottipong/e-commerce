import {
  DashboardMetric,
  GhostLink,
  MetricLink,
  PageHeader,
  StatusPill,
} from "@/components/ui";
import { formatThb } from "@/lib/money";
import { requireSeller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SellerDashboardPage() {
  const user = await requireSeller();
  const seller = user.seller;
  if (!seller) return null;
  const [
    products,
    sellerOrders,
    payouts,
    paidSales,
    lowStock,
    pendingReview,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { sellerId: seller.id } }),
    prisma.sellerOrder.count({ where: { sellerId: seller.id } }),
    prisma.payout.count({ where: { sellerId: seller.id, status: "PENDING" } }),
    prisma.sellerOrder.aggregate({
      where: { sellerId: seller.id, order: { status: "PAID" } },
      _sum: { subtotalThb: true },
    }),
    prisma.productVariant.count({
      where: {
        product: { sellerId: seller.id },
        isActive: true,
        stockOnHand: { lte: 5 },
      },
    }),
    prisma.product.count({
      where: { sellerId: seller.id, status: "PENDING_REVIEW" },
    }),
    prisma.sellerOrder.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { order: true, items: true },
    }),
  ]);

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Seller studio"
        title={seller.shopName}
        description="Products and orders become active after marketplace approval."
        action={<StatusPill>{seller.status}</StatusPill>}
      />
      {seller.status !== "APPROVED" ? (
        <div className="mt-8 border-l-2 border-clay bg-white p-6">
          <h2 className="font-display text-2xl">Waiting for admin review</h2>
          <p className="mt-2 text-ink/60">
            You can return here after approval to create products.
          </p>
        </div>
      ) : (
        <div className="mt-9 grid gap-x-8 md:grid-cols-3">
          <MetricLink
            href="/seller/products"
            label="Products"
            value={products}
          />
          <MetricLink
            href="/seller/orders"
            label="Seller orders"
            value={sellerOrders}
          />
          <MetricLink
            href="/seller/payouts"
            label="Pending payouts"
            value={payouts}
          />
        </div>
      )}
      {seller.status === "APPROVED" && (
        <section className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_.65fr]">
          <div>
            <div className="flex items-end justify-between border-b border-ink/10 pb-4">
              <div>
                <p className="eyebrow">Fulfillment</p>
                <h2 className="mt-1 font-display text-3xl">Recent orders</h2>
              </div>
              <GhostLink href="/seller/orders">View all</GhostLink>
            </div>
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_auto] gap-4 border-b border-ink/10 py-4 sm:grid-cols-[1fr_100px_100px_auto]"
              >
                <div>
                  <p className="font-medium">{order.order.orderNumber}</p>
                  <p className="text-xs text-ink/60">
                    {order.items.length} item(s)
                  </p>
                </div>
                <p className="hidden self-center text-sm sm:block">
                  {formatThb(order.subtotalThb)}
                </p>
                <p className="hidden self-center text-xs text-ink/60 sm:block">
                  {order.createdAt.toLocaleDateString("th-TH")}
                </p>
                <StatusPill>{order.status}</StatusPill>
              </div>
            ))}
          </div>
          <aside>
            <p className="eyebrow">Store pulse</p>
            <div className="mt-1 grid grid-cols-2 gap-x-5">
              <DashboardMetric
                label="Paid sales"
                value={formatThb(paidSales._sum.subtotalThb ?? 0)}
              />
              <DashboardMetric
                label="Low stock"
                value={lowStock}
                detail="5 units or fewer"
              />
              <DashboardMetric label="In review" value={pendingReview} />
              <DashboardMetric
                label="Commission"
                value="10%"
                detail="Excludes shipping"
              />
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}
