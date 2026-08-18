import { reviewProductAction } from "@/app/actions";
import { Button, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    include: {
      seller: true,
      category: true,
      variants: true,
      images: { take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Admin / Approval queue"
        title="Product review"
        description="Only approved products appear in the public catalog."
      />
      <div className="mt-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="grid gap-4 border-b border-ink/10 py-5 first:border-t md:grid-cols-[88px_1fr_auto] md:items-center"
          >
            <div className="aspect-square overflow-hidden bg-linen">
              <img
                src={product.images[0]?.url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium">{product.name}</p>
                <StatusPill>{product.status}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {product.seller.shopName} · {product.category.nameEn}
              </p>
              <p className="mt-1 text-sm">
                {formatThb(product.variants[0]?.priceThb ?? 0)}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={reviewProductAction}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="status" value="APPROVED" />
                <Button type="submit">Approve</Button>
              </form>
              <form action={reviewProductAction} className="flex gap-2">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="status" value="REJECTED" />
                <input
                  name="note"
                  placeholder="Reject reason"
                  className="h-11 w-40 rounded-[2px] border border-ink/15 bg-white px-3 text-sm focus:border-clay focus:outline-none"
                />
                <Button tone="secondary" type="submit">
                  Reject
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && <EmptyState title="No products to review" />}
    </main>
  );
}
