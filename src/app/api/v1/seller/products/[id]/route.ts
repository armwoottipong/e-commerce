import { NextRequest } from "next/server";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";
import {
  ApiError,
  apiOk,
  requireApiUser,
  requireSameOrigin,
  withApi,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";

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

const editableStatuses = new Set<ProductStatus>([
  ProductStatus.DRAFT,
  ProductStatus.PENDING_REVIEW,
  ProductStatus.APPROVED,
  ProductStatus.REJECTED,
]);

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
    const data = productSchema.parse(await request.json());
    const product = await prisma.product.findFirst({
      where: { id, sellerId: user.seller.id },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { orderBy: { createdAt: "asc" }, take: 1 },
      },
    });

    if (!product)
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    if (!editableStatuses.has(product.status))
      throw new ApiError(409, "PRODUCT_NOT_EDITABLE", "Product is archived");

    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, isActive: true },
    });
    if (!category)
      throw new ApiError(400, "INVALID_CATEGORY", "Active category not found");

    const variant = product.variants[0];
    const skuOwner = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
      select: { id: true },
    });
    if (skuOwner && skuOwner.id !== variant?.id)
      throw new ApiError(
        409,
        "SKU_EXISTS",
        "SKU already belongs to another variant",
      );

    const updated = await prisma.$transaction(async (tx) => {
      const nextProduct = await tx.product.update({
        where: { id },
        data: {
          categoryId: data.categoryId,
          name: data.name,
          brand: data.brand,
          description: data.description,
          status: ProductStatus.PENDING_REVIEW,
          rejectReason: null,
        },
        include: { variants: true, images: true },
      });

      if (product.images[0]) {
        await tx.productImage.update({
          where: { id: product.images[0].id },
          data: { url: data.imageUrl, alt: data.name },
        });
      } else {
        await tx.productImage.create({
          data: { productId: id, url: data.imageUrl, alt: data.name },
        });
      }

      const variantData = {
        sku: data.sku,
        size: data.size,
        color: data.color,
        priceThb: Math.round(data.priceThb * 100),
        stockOnHand: data.stockOnHand,
      };

      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: variantData,
        });
      } else {
        await tx.productVariant.create({
          data: { productId: id, ...variantData },
        });
      }

      return nextProduct;
    });

    return apiOk(updated);
  });
}
