import { apiOk, requireApiUser, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () => {
    const user = await requireApiUser(["SELLER"]);
    return apiOk({
      mode: "manual-tracking-only",
      items: await prisma.payout.findMany({
        where: { sellerId: user.seller?.id },
        orderBy: { createdAt: "desc" },
        include: {
          sellerOrder: { select: { order: { select: { orderNumber: true } } } },
        },
      }),
    });
  });
}
