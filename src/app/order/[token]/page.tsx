import { PageHeader, StatusPill } from "@/components/ui";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function OrderLookupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await prisma.order.findUniqueOrThrow({
    where: { lookupToken: token },
    include: {
      sellerOrders: { include: { seller: true, items: true } },
      items: true,
      payments: true,
      address: true,
    },
  });
  return (
    <main className="page-shell max-w-5xl">
      <PageHeader
        eyebrow="Order tracking"
        title={order.orderNumber}
        description={`${order.address.fullName} · ${order.address.province}`}
        action={<StatusPill>{order.status}</StatusPill>}
      />
      <section className="mt-8 grid gap-4">
        {order.sellerOrders.map((sellerOrder) => (
          <div
            key={sellerOrder.id}
            className="border-t-2 border-ink bg-white p-5 shadow-line"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{sellerOrder.seller.shopName}</h2>
              <StatusPill>{sellerOrder.status}</StatusPill>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              {sellerOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.productName} ({item.variantLabel})
                  </span>
                  <span>{formatThb(item.totalThb)}</span>
                </div>
              ))}
            </div>
            {sellerOrder.trackingNo && (
              <p className="mt-3 text-sm text-ink/60">
                Tracking: {sellerOrder.trackingNo}
              </p>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
