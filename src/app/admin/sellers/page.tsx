import { reviewSellerAction } from "@/app/actions";
import { Button, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminSellersPage() {
  await requireAdmin();
  const sellers = await prisma.sellerProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Admin / Approval queue"
        title="Seller review"
        description="Review shop, contact and payout details before granting access to sell."
      />
      <div className="mt-8">
        {sellers.map((seller) => (
          <div
            key={seller.id}
            className="grid gap-4 border-b border-ink/10 py-5 first:border-t md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium">{seller.shopName}</p>
                <StatusPill>{seller.status}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {seller.user.email} · {seller.contactPhone}
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {seller.bankName} · {seller.bankOwner}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={reviewSellerAction}>
                <input type="hidden" name="sellerId" value={seller.id} />
                <input type="hidden" name="status" value="APPROVED" />
                <Button type="submit">Approve</Button>
              </form>
              <form action={reviewSellerAction}>
                <input type="hidden" name="sellerId" value={seller.id} />
                <input type="hidden" name="status" value="REJECTED" />
                <Button tone="secondary" type="submit">
                  Reject
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
      {sellers.length === 0 && <EmptyState title="No sellers to review" />}
    </main>
  );
}
