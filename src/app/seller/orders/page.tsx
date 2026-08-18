import { updateSellerOrderAction } from "@/app/actions";
import {
  Button,
  EmptyState,
  Field,
  PageHeader,
  Select,
  StatusPill,
} from "@/components/ui";
import { requireSeller } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function SellerOrdersPage() {
  const user = await requireSeller();
  const orders = await prisma.sellerOrder.findMany({
    where: { sellerId: user.seller?.id },
    include: { order: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-shell max-w-6xl">
      <PageHeader
        eyebrow="Seller studio / Fulfillment"
        title="Seller orders"
        description="Update processing, shipment and tracking for your portion of each order."
      />
      <div className="mt-8">
        {orders.map((sellerOrder) => (
          <div
            key={sellerOrder.id}
            className="border-b border-ink/10 py-6 first:border-t"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{sellerOrder.order.orderNumber}</p>
              <StatusPill>{sellerOrder.status}</StatusPill>
            </div>
            <p className="mt-2 text-sm text-ink/60">
              {formatThb(sellerOrder.subtotalThb)} subtotal · payout{" "}
              {formatThb(sellerOrder.payoutThb)}
            </p>
            <form
              action={updateSellerOrderAction}
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                type="hidden"
                name="sellerOrderId"
                value={sellerOrder.id}
              />
              <Select
                label="Status"
                name="status"
                defaultValue={sellerOrder.status}
              >
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </Select>
              <Field
                label="Tracking no."
                name="trackingNo"
                defaultValue={sellerOrder.trackingNo ?? ""}
              />
              <Button type="submit" className="self-end">
                Update
              </Button>
            </form>
          </div>
        ))}
      </div>
      {orders.length === 0 && <EmptyState title="No seller orders yet" />}
    </main>
  );
}
