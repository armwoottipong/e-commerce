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
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApi(async () => {
    requireSameOrigin(request);
    const admin = await requireApiUser(["ADMIN"]);
    const { id } = await params;
    const data = schema.parse(await request.json());
    const exists = await prisma.sellerProfile.findUnique({ where: { id } });
    if (!exists)
      throw new ApiError(404, "SELLER_NOT_FOUND", "Seller not found");
    const seller = await prisma.sellerProfile.update({
      where: { id },
      data: {
        status: data.status,
        rejectReason: data.status === "REJECTED" ? data.note : null,
      },
    });
    await prisma.adminActionLog.create({
      data: {
        actorId: admin.id,
        action: `SELLER_${data.status}`,
        entity: "SellerProfile",
        entityId: id,
        note: data.note,
      },
    });
    return apiOk(seller);
  });
}
