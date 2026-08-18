import { EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { sellerOrders: true },
  });
  return (
    <main className="page-shell max-w-5xl">
      <PageHeader
        eyebrow="Account"
        title="Order history"
        description="ติดตามสถานะการชำระเงินและการจัดส่งจากแต่ละร้าน"
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
              {formatThb(order.totalThb)} · {order.sellerOrders.length} seller
              shipments
            </p>
          </div>
        ))}
      </div>
      {orders.length === 0 && (
        <EmptyState
          title="No orders yet"
          detail="Orders placed with this account will appear here."
        />
      )}
    </main>
  );
}
