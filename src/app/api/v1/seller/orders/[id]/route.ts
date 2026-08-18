import { NextRequest } from "next/server";
import { z } from "zod";
import {
  ApiError,
  apiOk,
  requireApiUser,
  requireSameOrigin,
  withApi,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"]),
  trackingNo: z.string().trim().max(120).optional(),
  carrier: z.string().trim().max(80).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApi(async () => {
    requireSameOrigin(request);
    const user = await requireApiUser(["SELLER"]);
    if (user.seller?.status !== "APPROVED")
      throw new ApiError(
        403,
        "SELLER_NOT_APPROVED",
        "Seller approval is required",
      );
    const { id } = await params;
    const data = schema.parse(await request.json());
    if (
      (data.status === "SHIPPED" || data.status === "DELIVERED") &&
      !data.trackingNo
    )
      throw new ApiError(
        400,
        "TRACKING_REQUIRED",
        "Tracking number is required",
      );
    const existing = await prisma.sellerOrder.findFirst({
      where: { id, sellerId: user.seller.id },
    });
    if (!existing)
      throw new ApiError(
        404,
        "SELLER_ORDER_NOT_FOUND",
        "Seller order not found",
      );
    const updated = await prisma.sellerOrder.update({ where: { id }, data });
    if (data.status === "DELIVERED")
      await prisma.payout.upsert({
        where: { sellerOrderId: id },
        update: {},
        create: {
          sellerId: user.seller.id,
          sellerOrderId: id,
          amountThb: existing.payoutThb,
        },
      });
    return apiOk(updated);
  });
}
