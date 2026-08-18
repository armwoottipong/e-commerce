import { ArrowRight, Check, PackageCheck, Store } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { GhostLink, LinkButton } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { status: "APPROVED" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    take: 6,
  });
  const hero = products[0];

  return (
    <main>
      <section className="relative min-h-[calc(100svh-7rem)] overflow-hidden border-b border-ink/10 bg-ink text-white lg:min-h-[720px]">
        {hero?.images[0] && (
          <img
            src={hero.images[0].url}
            alt={hero.name}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,18,15,.78)_0%,rgba(16,18,15,.24)_58%,rgba(16,18,15,.08)_100%)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-7xl flex-col justify-between px-4 py-8 sm:px-6 lg:min-h-[720px] lg:py-12">
          <div className="flex items-center justify-between border-t border-white/45 pt-3 font-mono text-[10px] uppercase text-white/80">
            <span>Independent Thai fashion</span>
            <span>Edition 01 / 2026</span>
          </div>
          <div className="max-w-4xl py-16">
            <p className="font-mono text-[11px] uppercase text-white/85">
              Curated marketplace / Bangkok
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-6xl leading-[0.9] sm:text-7xl lg:text-[104px]">
              New voices in Thai fashion.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/90">
              เสื้อผ้า รองเท้า กระเป๋า
              และเครื่องประดับจากร้านอิสระที่ผ่านการอนุมัติ ชำระครั้งเดียว
              จัดส่งแยกจากแต่ละร้าน.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/products" tone="light">
                Explore the edit <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <GhostLink href="/seller/register" tone="inverse">
                Join as a seller
              </GhostLink>
            </div>
          </div>
          <div className="flex items-end justify-between border-b border-white/45 pb-3 text-xs text-white/80">
            <span>
              {hero ? `${hero.brand} — ${hero.name}` : "MAII seasonal edit"}
            </span>
            <span className="hidden sm:block">Scroll to discover</span>
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-ink/10 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex gap-4 py-6 md:pr-7">
            <Check className="h-5 w-5 shrink-0 text-clay" />
            <div>
              <p className="text-sm font-medium">Curated sellers</p>
              <p className="mt-1 text-xs leading-5 text-ink/65">
                ร้านและสินค้าผ่านการตรวจสอบก่อนขึ้นขาย
              </p>
            </div>
          </div>
          <div className="flex gap-4 py-6 md:px-7">
            <Store className="h-5 w-5 shrink-0 text-cobalt" />
            <div>
              <p className="text-sm font-medium">One checkout</p>
              <p className="mt-1 text-xs leading-5 text-ink/65">
                รวมสินค้าหลายร้านและชำระในครั้งเดียว
              </p>
            </div>
          </div>
          <div className="flex gap-4 py-6 md:pl-7">
            <PackageCheck className="h-5 w-5 shrink-0 text-clay" />
            <div>
              <p className="text-sm font-medium">Split delivery</p>
              <p className="mt-1 text-xs leading-5 text-ink/65">
                แต่ละร้านดูแลแพ็กและจัดส่งสินค้าโดยตรง
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="eyebrow">The latest edit</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">
              New arrivals
            </h2>
          </div>
          <GhostLink href="/products" className="hidden sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </GhostLink>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-9 lg:grid-cols-3 lg:gap-x-5">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        <GhostLink href="/products" className="mt-8 w-full sm:hidden">
          View all <ArrowRight className="h-4 w-4" />
        </GhostLink>
      </section>

      <section className="border-t border-ink/10 bg-white">
        <div className="page-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-12">
          <div>
            <p className="eyebrow">Browse by category</p>
            <h2 className="mt-2 font-display text-4xl">Find your line.</h2>
          </div>
          <div className="grid gap-x-10 sm:grid-cols-2 lg:gap-x-12">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex items-center justify-between gap-4 border-b border-ink/10 py-4 pr-2 text-lg hover:text-clay"
              >
                <span>{category.nameEn}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
