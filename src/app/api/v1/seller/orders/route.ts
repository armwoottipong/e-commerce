import { apiOk, requireApiUser, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () => {
    const user = await requireApiUser(["SELLER"]);
    return apiOk(
      await prisma.sellerOrder.findMany({
        where: { sellerId: user.seller?.id },
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: { orderNumber: true, status: true, createdAt: true },
          },
          items: true,
          payout: { select: { amountThb: true, status: true, paidAt: true } },
        },
      }),
    );
  });
}
