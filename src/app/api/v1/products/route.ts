import { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export async function GET(request: NextRequest) {
  return withApi(async () => {
    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const where = {
      status: "APPROVED" as const,
      category: query.category ? { slug: query.category } : undefined,
      OR: query.q
        ? [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { brand: { contains: query.q, mode: "insensitive" as const } },
          ]
        : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          brand: true,
          description: true,
          category: { select: { slug: true, nameTh: true, nameEn: true } },
          seller: { select: { shopName: true, slug: true } },
          images: {
            orderBy: { position: "asc" },
            take: 1,
            select: { url: true, alt: true },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              priceThb: true,
              stockOnHand: true,
              reserved: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);
    return apiOk({
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });
}
