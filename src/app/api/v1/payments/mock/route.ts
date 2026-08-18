import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiOk, requireSameOrigin, withApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { completeMockPayment } from "@/lib/order";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orderId: z.string().min(1),
  lookupToken: z.string().min(1),
  outcome: z.enum(["success", "fail"]),
});

export async function POST(request: NextRequest) {
  return withApi(async () => {
    requireSameOrigin(request);
    const body = bodySchema.parse(await request.json());
    const user = await getCurrentUser();
    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      select: { userId: true, lookupToken: true, status: true },
    });
    if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    const allowed = order.userId
      ? order.userId === user?.id || user?.role === "ADMIN"
      : order.lookupToken === body.lookupToken;
    if (!allowed)
      throw new ApiError(
        403,
        "ORDER_FORBIDDEN",
        "Order does not belong to this session",
      );
    const result = await completeMockPayment(body.orderId, body.outcome);
    return apiOk({
      id: result.id,
      orderNumber: result.orderNumber,
      status: result.status,
    });
  });
}
