import { apiOk, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () =>
    apiOk(
      await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { nameEn: "asc" },
        select: {
          id: true,
          slug: true,
          nameTh: true,
          nameEn: true,
          parentId: true,
        },
      }),
    ),
  );
}
