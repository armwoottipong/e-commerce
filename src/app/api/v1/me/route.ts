import { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, requireApiUser, requireSameOrigin, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () => {
    const user = await requireApiUser();
    return apiOk({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      seller: user.seller
        ? {
            id: user.seller.id,
            shopName: user.seller.shopName,
            slug: user.seller.slug,
            status: user.seller.status,
          }
        : null,
    });
  });
}

export async function PATCH(request: NextRequest) {
  return withApi(async () => {
    requireSameOrigin(request);
    const user = await requireApiUser();
    const data = z
      .object({
        name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(30).nullable().optional(),
      })
      .parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    return apiOk(updated);
  });
}
