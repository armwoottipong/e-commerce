import {
  DashboardMetric,
  GhostLink,
  MetricLink,
  PageHeader,
  StatusPill,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [
    pendingSellers,
    pendingProducts,
    orders,
    pendingPayouts,
    paidGmv,
    users,
    recentOrders,
    activity,
  ] = await Promise.all([
    prisma.sellerProfile.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.count(),
    prisma.payout.aggregate({
      where: { status: "PENDING" },
      _sum: { amountThb: true },
    }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalThb: true },
    }),
    prisma.user.count(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { sellerOrders: true },
    }),
    prisma.adminActionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { actor: true },
    }),
  ]);
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Admin desk / Today"
        title="Marketplace control"
        description="Review approvals, monitor orders and track manual seller payouts."
      />
      <div className="mt-9 grid gap-x-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricLink
          href="/admin/sellers"
          label="Pending sellers"
          value={pendingSellers}
        />
        <MetricLink
          href="/admin/products"
          label="Pending products"
          value={pendingProducts}
        />
        <MetricLink href="/admin/orders" label="All orders" value={orders} />
        <MetricLink
          href="/admin/payouts"
          label="Payout due"
          value={formatThb(pendingPayouts._sum.amountThb ?? 0)}
        />
      </div>
      <section className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          <div className="flex items-end justify-between border-b border-ink/10 pb-4">
            <div>
              <p className="eyebrow">Operations</p>
              <h2 className="mt-1 font-display text-3xl">Recent orders</h2>
            </div>
            <GhostLink href="/admin/orders">View all</GhostLink>
          </div>
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1fr_auto] gap-4 border-b border-ink/10 py-4 sm:grid-cols-[1fr_120px_100px_auto]"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-xs text-ink/60">
                  {order.sellerOrders.length} seller fulfillment(s)
                </p>
              </div>
              <p className="hidden self-center text-sm sm:block">
                {formatThb(order.totalThb)}
              </p>
              <p className="hidden self-center text-xs text-ink/60 sm:block">
                {order.createdAt.toLocaleDateString("th-TH")}
              </p>
              <StatusPill>{order.status}</StatusPill>
            </div>
          ))}
        </div>
        <aside>
          <p className="eyebrow">Marketplace pulse</p>
          <div className="mt-1 grid grid-cols-2 gap-x-5">
            <DashboardMetric
              label="Paid GMV"
              value={formatThb(paidGmv._sum.totalThb ?? 0)}
            />
            <DashboardMetric label="Users" value={users} />
          </div>
          <h2 className="mt-7 border-b border-ink/10 pb-3 font-display text-2xl">
            Admin activity
          </h2>
          {activity.map((log) => (
            <div key={log.id} className="border-b border-ink/10 py-3">
              <p className="text-sm font-medium">
                {log.action.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs text-ink/60">
                {log.actor.name} · {log.entity}
              </p>
            </div>
          ))}
        </aside>
      </section>
    </main>
  );
}
