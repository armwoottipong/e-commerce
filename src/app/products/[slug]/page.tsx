import { notFound } from "next/navigation";
import { addToCartAction } from "@/app/actions";
import { Button, StatusPill } from "@/components/ui";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      seller: true,
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { priceThb: "asc" } },
    },
  });
  if (!product || product.status !== "APPROVED") notFound();

  return (
    <main className="page-shell grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
      <div className="grid gap-2 sm:grid-cols-2">
        {product.images.map((image) => (
          <div key={image.id} className="aspect-[4/5] overflow-hidden bg-linen">
            <img
              src={image.url}
              alt={image.alt}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      <section className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-b border-ink/10 pb-6">
          <p className="eyebrow">{product.category.nameEn}</p>
          <h1 className="mt-3 font-display text-5xl leading-[.95] sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-4 text-sm text-ink/70">
            {product.brand} · {product.seller.shopName}
          </p>
        </div>
        <p className="mt-6 max-w-xl leading-7 text-ink/75">
          {product.description}
        </p>
        <form
          action={addToCartAction}
          className="mt-8 grid gap-4 border-t border-ink/10 pt-6"
        >
          <label className="grid gap-2 text-sm">
            <span className="text-ink/70">Variant</span>
            <select
              name="variantId"
              className="h-12 rounded-[2px] border border-ink/15 bg-white px-3 focus:border-clay focus:outline-none"
            >
              {product.variants.map((variant) => (
                <option
                  key={variant.id}
                  value={variant.id}
                  disabled={variant.stockOnHand - variant.reserved <= 0}
                >
                  {variant.size} / {variant.color} -{" "}
                  {formatThb(variant.priceThb)} (
                  {variant.stockOnHand - variant.reserved} left)
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-ink/70">Quantity</span>
            <input
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
              className="h-12 rounded-[2px] border border-ink/15 bg-white px-3 focus:border-clay focus:outline-none"
            />
          </label>
          <Button type="submit" className="h-12">
            Add to cart
          </Button>
        </form>
        <div className="mt-8 flex flex-wrap gap-2">
          <StatusPill>Admin approved</StatusPill>
          <StatusPill>Size + color stock</StatusPill>
        </div>
      </section>
    </main>
  );
}
