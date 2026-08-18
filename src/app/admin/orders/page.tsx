import { EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    include: { sellerOrders: { include: { seller: true } }, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Admin / Operations"
        title="Orders"
        description="One customer order may contain multiple seller fulfillments."
      />
      <div className="mt-8">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border-b border-ink/10 py-5 first:border-t"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{order.orderNumber}</p>
              <StatusPill>{order.status}</StatusPill>
            </div>
            <p className="mt-2 text-sm text-ink/60">
              {formatThb(order.totalThb)} · payment{" "}
              {order.payments[0]?.status ?? "NONE"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {order.sellerOrders.map((sellerOrder) => (
                <StatusPill key={sellerOrder.id}>
                  {sellerOrder.seller.shopName}: {sellerOrder.status}
                </StatusPill>
              ))}
            </div>
          </div>
        ))}
      </div>
      {orders.length === 0 && <EmptyState title="No orders yet" />}
    </main>
  );
}
