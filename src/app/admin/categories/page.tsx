import { createCategoryAction } from "@/app/actions";
import { Button, Field, PageHeader, StatusPill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { nameEn: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <main className="page-shell max-w-6xl">
      <PageHeader
        eyebrow="Admin / Catalog structure"
        title="Categories"
        description="Central categories keep seller products consistent across the marketplace."
      />
      <div className="mt-9 grid gap-10 lg:grid-cols-[360px_1fr]">
        <section className="h-fit border-t-2 border-ink bg-white p-5">
          <h2 className="font-display text-3xl">Create category</h2>
          <form action={createCategoryAction} className="mt-6 grid gap-4">
            <Field label="Name TH" name="nameTh" required />
            <Field label="Name EN" name="nameEn" required />
            <Button type="submit">Create</Button>
          </form>
        </section>
        <section>
          <h2 className="font-display text-3xl">Category list</h2>
          <div className="mt-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between border-b border-ink/10 py-4 first:border-t"
              >
                <div>
                  <p className="font-medium">{category.nameEn}</p>
                  <p className="text-sm text-ink/60">{category.nameTh}</p>
                </div>
                <StatusPill>{category._count.products} products</StatusPill>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
