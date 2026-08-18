import { checkoutAction } from "@/app/actions";
import { Button, Field, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { formatThb } from "@/lib/money";

export default async function CheckoutPage() {
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
          eyebrow="Checkout / Step 1 of 2"
          title="Shipping details"
          description="ระบบจะตรวจราคาและสต็อกอีกครั้งก่อนสร้าง mock payment"
        />
        <form action={checkoutAction} className="mt-8 grid gap-4">
          {!user && <Field label="Email" name="email" type="email" required />}
          <Field
            label="Full name"
            name="fullName"
            defaultValue={user?.name}
            required
          />
          <Field
            label="Phone"
            name="phone"
            defaultValue={user?.phone ?? ""}
            required
          />
          <Field label="Address" name="line1" required />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="District" name="district" required />
            <Field label="Province" name="province" required />
            <Field label="Postal code" name="postalCode" required />
          </div>
          <Button disabled={items.length === 0} type="submit">
            Create mock payment
          </Button>
        </form>
      </section>
      <aside className="h-fit border-t-2 border-ink bg-white p-6 shadow-line lg:sticky lg:top-24">
        <p className="eyebrow">Order preview</p>
        <h2 className="mt-2 font-display text-3xl">Your order</h2>
        <div className="mt-4 grid gap-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4">
              <span>
                {item.quantity}x {item.variant.product.name}
              </span>
              <span>{formatThb(item.variant.priceThb * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-ink/10 pt-3">
            <span>Shipping</span>
            <span>{formatThb(shipping)}</span>
          </div>
          <div className="flex items-end justify-between font-medium">
            <span>Total</span>
            <span className="font-display text-2xl">
              {formatThb(subtotal + shipping)}
            </span>
          </div>
        </div>
      </aside>
    </main>
  );
}
