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
  status: z.enum(["APPROVED", "REJECTED", "ARCHIVED"]),
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
    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists)
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    const product = await prisma.product.update({
      where: { id },
      data: {
        status: data.status,
        rejectReason: data.status === "REJECTED" ? data.note : null,
      },
    });
    await prisma.adminActionLog.create({
      data: {
        actorId: admin.id,
        action: `PRODUCT_${data.status}`,
        entity: "Product",
        entityId: id,
        note: data.note,
      },
    });
    return apiOk(product);
  });
}
