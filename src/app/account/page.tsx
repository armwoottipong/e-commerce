import { logoutAction } from "@/app/actions";
import {
  Button,
  DashboardMetric,
  EmptyState,
  GhostLink,
  PageHeader,
  StatusPill,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const user = await requireUser();
  const [orders, orderCount, addresses, paidTotal] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.order.aggregate({
      where: { userId: user.id, status: "PAID" },
      _sum: { totalThb: true },
    }),
  ]);

  return (
    <main className="page-shell max-w-5xl">
      <PageHeader
        eyebrow={`Account / ${user.role}`}
        title={user.name}
        description={user.email}
        action={
          <form action={logoutAction}>
            <Button type="submit" tone="secondary">
              Logout
            </Button>
          </form>
        }
      />
      <section className="mt-8 grid grid-cols-2 gap-x-6 md:grid-cols-4">
        <DashboardMetric label="Orders" value={orderCount} />
        <DashboardMetric
          label="Paid total"
          value={formatThb(paidTotal._sum.totalThb ?? 0)}
        />
        <DashboardMetric label="Addresses" value={addresses} />
        <DashboardMetric label="Account role" value={user.role.toLowerCase()} />
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Recent orders</h2>
          <GhostLink href="/account/orders">All orders</GhostLink>
        </div>
        <div>
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between border-b border-ink/10 py-5 first:border-t"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-ink/60">
                  {formatThb(order.totalThb)}
                </p>
              </div>
              <StatusPill>{order.status}</StatusPill>
            </div>
          ))}
          {orders.length === 0 && (
            <EmptyState
              title="No orders yet"
              detail="Your completed orders will appear here."
            />
          )}
        </div>
      </section>
    </main>
  );
}
