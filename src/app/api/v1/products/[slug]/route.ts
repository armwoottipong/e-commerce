import { ApiError, apiOk, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return withApi(async () => {
    const { slug } = await params;
    const product = await prisma.product.findFirst({
      where: { slug, status: "APPROVED" },
      include: {
        category: { select: { slug: true, nameTh: true, nameEn: true } },
        seller: { select: { shopName: true, slug: true } },
        images: { orderBy: { position: "asc" } },
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
    });
    if (!product)
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    return apiOk(product);
  });
}
