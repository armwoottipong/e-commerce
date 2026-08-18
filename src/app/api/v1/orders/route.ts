import { apiOk, requireApiUser, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () => {
    const user = await requireApiUser();
    const where =
      user.role === "ADMIN"
        ? {}
        : user.role === "SELLER"
          ? {
              sellerOrders: {
                some: { sellerId: user.seller?.id ?? "__none__" },
              },
            }
          : { userId: user.id };
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotalThb: true,
        shippingThb: true,
        totalThb: true,
        createdAt: true,
        sellerOrders: {
          where:
            user.role === "SELLER" ? { sellerId: user.seller?.id } : undefined,
          select: {
            id: true,
            status: true,
            subtotalThb: true,
            shippingThb: true,
            commissionThb: true,
            payoutThb: true,
            trackingNo: true,
            seller: { select: { shopName: true } },
            items: {
              select: {
                productName: true,
                variantLabel: true,
                quantity: true,
                totalThb: true,
              },
            },
          },
        },
      },
    });
    return apiOk(orders);
  });
}
