import { ProductCard } from "@/components/product-card";
import { Button, EmptyState, Field, PageHeader, Select } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { nameEn: "asc" },
  });
  const category = params.category
    ? await prisma.category.findUnique({ where: { slug: params.category } })
    : null;
  const products = await prisma.product.findMany({
    where: {
      status: "APPROVED",
      categoryId: category?.id,
      OR: params.q
        ? [
            { name: { contains: params.q, mode: "insensitive" } },
            { brand: { contains: params.q, mode: "insensitive" } },
          ]
        : undefined,
      variants: {
        some: {
          size: params.size || undefined,
          color: params.color || undefined,
          priceThb: {
            gte: params.min ? Number(params.min) * 100 : undefined,
            lte: params.max ? Number(params.max) * 100 : undefined,
          },
        },
      },
    },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
    },
    orderBy:
      params.sort === "price_desc"
        ? { variants: { _count: "desc" } }
        : { createdAt: "desc" },
    take: 24,
  });

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Catalog / Approved only"
        title="Shop the edit"
        description="แฟชั่นจากผู้ขายที่ผ่านการอนุมัติ ค้นหาตามหมวด ไซซ์ สี และช่วงราคา"
      />
      <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-ink/10 pb-7 lg:border-b-0 lg:border-r lg:pr-7">
          <form className="grid min-w-0 gap-4">
            <Field
              label="Search"
              name="q"
              defaultValue={params.q}
              placeholder="shirt, tote, sandal"
            />
            <Select
              label="Category"
              name="category"
              defaultValue={params.category}
            >
              <option value="">All</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.nameEn}
                </option>
              ))}
            </Select>
            <Field
              label="Size"
              name="size"
              defaultValue={params.size}
              placeholder="M, 38, One Size"
            />
            <Field
              label="Color"
              name="color"
              defaultValue={params.color}
              placeholder="Black"
            />
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <Field
                label="Min THB"
                name="min"
                type="number"
                defaultValue={params.min}
              />
              <Field
                label="Max THB"
                name="max"
                type="number"
                defaultValue={params.max}
              />
            </div>
            <Select label="Sort" name="sort" defaultValue={params.sort}>
              <option value="newest">Newest</option>
              <option value="price_desc">Popular proxy</option>
            </Select>
            <Button>Apply filters</Button>
          </form>
        </aside>
        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between border-b border-ink/10 pb-4">
            <p className="font-mono text-[11px] uppercase text-ink/65">
              {products.length} approved products
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-9 xl:grid-cols-3 xl:gap-x-5">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          {products.length === 0 && (
            <EmptyState
              title="No pieces found"
              detail="ลองเปลี่ยนหมวด ช่วงราคา หรือคำค้นหา"
            />
          )}
        </section>
      </div>
    </main>
  );
}
