import { NextRequest } from "next/server";
import {
  ApiError,
  apiOk,
  requireApiUser,
  requireSameOrigin,
  withApi,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApi(async () => {
    requireSameOrigin(request);
    const admin = await requireApiUser(["ADMIN"]);
    const { id } = await params;
    const exists = await prisma.payout.findUnique({ where: { id } });
    if (!exists)
      throw new ApiError(
        404,
        "PAYOUT_NOT_FOUND",
        "Payout tracking record not found",
      );
    const payout = await prisma.payout.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await prisma.adminActionLog.create({
      data: {
        actorId: admin.id,
        action: "PAYOUT_MARKED_PAID",
        entity: "Payout",
        entityId: id,
        note: "Status tracking only; no bank transfer initiated",
      },
    });
    return apiOk({ ...payout, mode: "manual-tracking-only" });
  });
}
