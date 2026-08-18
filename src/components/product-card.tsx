"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { addProductCardToCartAction } from "@/app/actions";
import { formatThb } from "@/lib/money";

type ProductCardProps = {
  product: {
    slug: string;
    name: string;
    brand: string;
    images: { url: string; alt: string }[];
    variants: {
      id: string;
      priceThb: number;
      stockOnHand: number;
      reserved: number;
      isActive: boolean;
    }[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = Math.min(
    ...product.variants.map((variant) => variant.priceThb),
  );
  const availableVariant = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          variant.isActive && variant.stockOnHand - variant.reserved > 0,
      ),
    [product.variants],
  );

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 850);
    return () => window.clearTimeout(timer);
  }, [added]);

  const addToCart = () => {
    if (!availableVariant || isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await addProductCardToCartAction(availableVariant.id);
      if (!result.ok) {
        setError(result.error === "stock" ? "Out of stock" : "Unavailable");
        return;
      }

      setAdded(true);
      window.dispatchEvent(
        new CustomEvent("maii:cart-added", {
          detail: { quantity: result.quantity },
        }),
      );
    });
  };

  return (
    <article className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-linen">
        <Link
          href={`/products/${product.slug}`}
          className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay"
        >
          <img
            src={product.images[0]?.url ?? "/placeholder.jpg"}
            alt={product.images[0]?.alt ?? product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
          />
        </Link>
        {added && <span className="cart-fly" aria-hidden="true" />}
        <button
          type="button"
          onClick={addToCart}
          disabled={!availableVariant || isPending}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-3 right-3 inline-flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white/95 text-ink opacity-0 shadow-line transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-45 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          {added ? (
            <Check className="h-[18px] w-[18px]" />
          ) : (
            <ShoppingBag className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2 border-t border-ink/10 pt-3">
        <div>
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-medium leading-5 hover:text-clay sm:text-base"
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-xs text-ink/65 sm:text-sm">
            {product.brand}
          </p>
          {error && <p className="mt-1 text-xs text-clay">{error}</p>}
        </div>
        <p className="whitespace-nowrap text-xs sm:text-sm">
          {formatThb(price)}
        </p>
      </div>
    </article>
  );
}
