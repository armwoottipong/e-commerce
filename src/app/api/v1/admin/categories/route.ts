import { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, requireApiUser, requireSameOrigin, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const schema = z.object({
  nameTh: z.string().min(2).max(120),
  nameEn: z.string().min(2).max(120),
  parentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withApi(async () => {
    requireSameOrigin(request);
    const admin = await requireApiUser(["ADMIN"]);
    const data = schema.parse(await request.json());
    const category = await prisma.category.create({
      data: { ...data, slug: `${slugify(data.nameEn)}-${Date.now()}` },
    });
    await prisma.adminActionLog.create({
      data: {
        actorId: admin.id,
        action: "CREATE_CATEGORY",
        entity: "Category",
        entityId: category.id,
      },
    });
    return apiOk(category, { status: 201 });
  });
}
