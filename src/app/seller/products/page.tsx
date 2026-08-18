import { createProductAction, updateProductAction } from "@/app/actions";
import {
  Button,
  EmptyState,
  Field,
  PageHeader,
  Select,
  StatusPill,
  TextArea,
} from "@/components/ui";
import { requireSeller } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function SellerProductsPage() {
  const user = await requireSeller();
  const seller = user.seller;
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" },
    }),
    prisma.product.findMany({
      where: { sellerId: seller?.id },
      include: {
        variants: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { position: "asc" }, take: 1 },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const approved = seller?.status === "APPROVED";

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Seller studio / Catalog"
        title="Products"
        description="Create product drafts and submit them for marketplace review."
      />
      <div className="mt-9 grid gap-10 lg:grid-cols-[420px_1fr]">
        <section className="h-fit border-t-2 border-ink bg-white p-5">
          <h2 className="font-display text-3xl">Create product</h2>
          {!approved && (
            <p className="mt-3 text-sm text-ink/60">
              Seller approval required before product submission.
            </p>
          )}
          <form action={createProductAction} className="mt-6 grid gap-4">
            <Field label="Name" name="name" required disabled={!approved} />
            <Field label="Brand" name="brand" required disabled={!approved} />
            <Select label="Category" name="categoryId" disabled={!approved}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameEn}
                </option>
              ))}
            </Select>
            <TextArea
              label="Description"
              name="description"
              required
              disabled={!approved}
            />
            <Field
              label="Image URL"
              name="imageUrl"
              type="url"
              defaultValue="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80"
              required
              disabled={!approved}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SKU" name="sku" required disabled={!approved} />
              <Field
                label="Size"
                name="size"
                defaultValue="One Size"
                required
                disabled={!approved}
              />
              <Field label="Color" name="color" required disabled={!approved} />
              <Field
                label="Price THB"
                name="priceThb"
                type="number"
                required
                disabled={!approved}
              />
              <Field
                label="Stock"
                name="stockOnHand"
                type="number"
                required
                disabled={!approved}
              />
            </div>
            <Button disabled={!approved} type="submit">
              Submit for review
            </Button>
          </form>
        </section>
        <section>
          <h2 className="font-display text-3xl">Products</h2>
          <div className="mt-6 grid gap-4">
            {products.map((product) => {
              const variant = product.variants[0];
              const image = product.images[0];
              const editable = product.status !== "ARCHIVED" && approved;

              return (
                <div
                  key={product.id}
                  className="border-b border-ink/10 py-5 first:border-t"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-ink/60">
                        {product.category.nameEn} · {product.variants.length}{" "}
                        variant(s)
                      </p>
                      <p className="mt-1 text-sm">
                        {formatThb(product.variants[0]?.priceThb ?? 0)}
                      </p>
                      {product.rejectReason && (
                        <p className="mt-3 max-w-2xl border-l-2 border-clay pl-3 text-sm leading-6 text-ink/70">
                          {product.rejectReason}
                        </p>
                      )}
                    </div>
                    <StatusPill>{product.status}</StatusPill>
                  </div>

                  <details className="mt-4 group">
                    <summary className="inline-flex cursor-pointer list-none text-sm font-medium text-clay hover:text-ink">
                      Edit and submit again
                    </summary>
                    <form
                      action={updateProductAction}
                      className="mt-5 grid gap-4 border-t border-ink/10 pt-5"
                    >
                      <input
                        type="hidden"
                        name="productId"
                        value={product.id}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Name"
                          name="name"
                          defaultValue={product.name}
                          required
                          disabled={!editable}
                        />
                        <Field
                          label="Brand"
                          name="brand"
                          defaultValue={product.brand}
                          required
                          disabled={!editable}
                        />
                      </div>
                      <Select
                        label="Category"
                        name="categoryId"
                        defaultValue={product.categoryId}
                        disabled={!editable}
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.nameEn}
                          </option>
                        ))}
                      </Select>
                      <TextArea
                        label="Description"
                        name="description"
                        defaultValue={product.description}
                        required
                        disabled={!editable}
                      />
                      <Field
                        label="Image URL"
                        name="imageUrl"
                        type="url"
                        defaultValue={image?.url ?? ""}
                        required
                        disabled={!editable}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="SKU"
                          name="sku"
                          defaultValue={variant?.sku ?? ""}
                          required
                          disabled={!editable}
                        />
                        <Field
                          label="Size"
                          name="size"
                          defaultValue={variant?.size ?? "One Size"}
                          required
                          disabled={!editable}
                        />
                        <Field
                          label="Color"
                          name="color"
                          defaultValue={variant?.color ?? ""}
                          required
                          disabled={!editable}
                        />
                        <Field
                          label="Price THB"
                          name="priceThb"
                          type="number"
                          defaultValue={
                            variant ? String(variant.priceThb / 100) : ""
                          }
                          required
                          disabled={!editable}
                        />
                        <Field
                          label="Stock"
                          name="stockOnHand"
                          type="number"
                          defaultValue={variant?.stockOnHand ?? ""}
                          required
                          disabled={!editable}
                        />
                      </div>
                      <Button disabled={!editable} type="submit">
                        Save and submit for review
                      </Button>
                    </form>
                  </details>
                </div>
              );
            })}
            {products.length === 0 && (
              <EmptyState
                title="No products yet"
                detail="Create your first product and submit it for review."
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
