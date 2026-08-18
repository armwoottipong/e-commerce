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
import { slugify } from "@/lib/slug";

export async function GET() {
  return withApi(async () => {
    const user = await requireApiUser(["SELLER"]);
    const products = await prisma.product.findMany({
      where: { sellerId: user.seller?.id },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { slug: true, nameEn: true, nameTh: true } },
        images: { orderBy: { position: "asc" } },
        variants: true,
      },
    });

    return apiOk(products);
  });
}

const productSchema = z.object({
  name: z.string().min(2).max(160),
  brand: z.string().min(2).max(120),
  categoryId: z.string().min(1),
  description: z.string().min(10).max(5000),
  imageUrl: z.string().url(),
  sku: z.string().min(2).max(80),
  size: z.string().min(1).max(40),
  color: z.string().min(1).max(60),
  priceThb: z.number().positive(),
  stockOnHand: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  return withApi(async () => {
    requireSameOrigin(request);
    const user = await requireApiUser(["SELLER"]);
    if (user.seller?.status !== "APPROVED")
      throw new ApiError(
        403,
        "SELLER_NOT_APPROVED",
        "Seller approval is required",
      );
    const data = productSchema.parse(await request.json());
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, isActive: true },
    });
    if (!category)
      throw new ApiError(400, "INVALID_CATEGORY", "Active category not found");
    const product = await prisma.product.create({
      data: {
        sellerId: user.seller.id,
        categoryId: data.categoryId,
        name: data.name,
        brand: data.brand,
        slug: `${slugify(data.name)}-${Date.now()}`,
        description: data.description,
        status: "PENDING_REVIEW",
        images: { create: { url: data.imageUrl, alt: data.name } },
        variants: {
          create: {
            sku: data.sku,
            size: data.size,
            color: data.color,
            priceThb: Math.round(data.priceThb * 100),
            stockOnHand: data.stockOnHand,
          },
        },
      },
      include: { variants: true, images: true },
    });

    return apiOk(product, { status: 201 });
  });
}
