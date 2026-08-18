import Link from "next/link";
import { updateCartItemAction } from "@/app/actions";
import { Button, EmptyState, GhostLink, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { formatThb } from "@/lib/money";

export default async function CartPage() {
  const user = await getCurrentUser();
  const cart = await getCart(user?.id);
  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.priceThb * item.quantity,
    0,
  );
  const sellers = new Set(items.map((item) => item.variant.product.seller.id));
  const shipping = sellers.size * 5000;

  return (
    <main className="page-shell grid gap-9 lg:grid-cols-[1fr_360px]">
      <section>
        <PageHeader
          eyebrow="Your selection"
          title="Shopping cart"
          description={`${items.length} item${items.length === 1 ? "" : "s"} from ${sellers.size} seller${sellers.size === 1 ? "" : "s"}`}
        />
        <div className="mt-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 border-b border-ink/10 py-5 first:border-t sm:grid-cols-[104px_1fr_auto]"
            >
              <div className="aspect-[4/5] overflow-hidden bg-linen">
                <img
                  src={item.variant.product.images[0]?.url}
                  alt={item.variant.product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <Link
                  href={`/products/${item.variant.product.slug}`}
                  className="font-medium"
                >
                  {item.variant.product.name}
                </Link>
                <p className="text-sm text-ink/60">
                  {item.variant.size} / {item.variant.color} ·{" "}
                  {item.variant.product.seller.shopName}
                </p>
                <p className="mt-2 text-sm">
                  {formatThb(item.variant.priceThb)}
                </p>
              </div>
              <form
                action={updateCartItemAction}
                className="flex items-center gap-2 sm:self-center"
              >
                <input type="hidden" name="itemId" value={item.id} />
                <input
                  name="quantity"
                  aria-label="Quantity"
                  type="number"
                  min="0"
                  max="20"
                  defaultValue={item.quantity}
                  className="h-10 w-16 rounded-[2px] border border-ink/15 bg-white px-2 focus:border-clay focus:outline-none"
                />
                <Button type="submit" tone="secondary" className="h-10">
                  Update
                </Button>
              </form>
            </div>
          ))}
          {items.length === 0 && (
            <EmptyState
              title="Your cart is empty"
              detail="เริ่มจากคอลเลกชันล่าสุดของร้านที่ผ่านการอนุมัติ"
              action={<GhostLink href="/products">Shop products</GhostLink>}
            />
          )}
        </div>
      </section>
      <aside className="h-fit border-t-2 border-ink bg-white p-6 shadow-line lg:sticky lg:top-24">
        <p className="eyebrow">Order summary</p>
        <h2 className="mt-2 font-display text-3xl">Total</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatThb(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping ({sellers.size} sellers)</dt>
            <dd>{formatThb(shipping)}</dd>
          </div>
          <div className="flex items-end justify-between border-t border-ink/10 pt-4 font-medium">
            <dt>Total</dt>
            <dd className="font-display text-2xl">
              {formatThb(subtotal + shipping)}
            </dd>
          </div>
        </dl>
        <GhostLink href="/checkout" tone="filled" className="mt-6 w-full">
          Checkout
        </GhostLink>
      </aside>
    </main>
  );
}
