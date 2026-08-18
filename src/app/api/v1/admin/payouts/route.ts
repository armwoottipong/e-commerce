import { apiOk, requireApiUser, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () => {
    await requireApiUser(["ADMIN"]);
    return apiOk({
      mode: "manual-tracking-only",
      items: await prisma.payout.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: {
              shopName: true,
              bankName: true,
              bankAccount: true,
              bankOwner: true,
            },
          },
          sellerOrder: { select: { order: { select: { orderNumber: true } } } },
        },
      }),
    });
  });
}
