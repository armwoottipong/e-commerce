import { apiOk, requireApiUser, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () => {
    await requireApiUser(["ADMIN"]);
    const [users, sellersPending, productsPending, orders, paidGmv, payoutDue] =
      await Promise.all([
        prisma.user.count(),
        prisma.sellerProfile.count({ where: { status: "PENDING" } }),
        prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
        prisma.order.count(),
        prisma.order.aggregate({
          where: { status: "PAID" },
          _sum: { totalThb: true },
        }),
        prisma.payout.aggregate({
          where: { status: "PENDING" },
          _sum: { amountThb: true },
        }),
      ]);

    return apiOk({
      users,
      sellersPending,
      productsPending,
      orders,
      paidGmvThb: paidGmv._sum.totalThb ?? 0,
      payoutDueThb: payoutDue._sum.amountThb ?? 0,
      payoutMode: "manual",
    });
  });
}
