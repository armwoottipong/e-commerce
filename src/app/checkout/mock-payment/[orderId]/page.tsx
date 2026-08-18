import { mockPaymentAction } from "@/app/actions";
import { Button } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatThb } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MockPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderId } = await params;
  const { token } = await searchParams;
  const user = await getCurrentUser();
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payments: true },
  });
  if (
    order.userId
      ? order.userId !== user?.id && user?.role !== "ADMIN"
      : order.lookupToken !== token
  )
    redirect("/login?error=unauthorized");
  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <p className="eyebrow">Checkout / Step 2 of 2</p>
      <h1 className="mt-2 font-display text-5xl leading-none">
        Payment simulator
      </h1>
      <p className="mt-4 text-sm leading-6 text-ink/70">
        เลือกผลลัพธ์เพื่อจำลอง PromptPay หรือบัตรผ่าน payment provider
      </p>
      <div className="mt-8 border-t-2 border-ink bg-white p-6 shadow-line">
        <p className="text-sm text-ink/60">Order {order.orderNumber}</p>
        <p className="mt-2 font-display text-4xl">
          {formatThb(order.totalThb)}
        </p>
        <p className="mt-4 text-sm text-ink/60">
          This simulates a provider webhook. Duplicate events are idempotent.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <form action={mockPaymentAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input
              type="hidden"
              name="token"
              value={token ?? order.lookupToken}
            />
            <input type="hidden" name="outcome" value="success" />
            <Button className="w-full" type="submit">
              Pay success
            </Button>
          </form>
          <form action={mockPaymentAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input
              type="hidden"
              name="token"
              value={token ?? order.lookupToken}
            />
            <input type="hidden" name="outcome" value="fail" />
            <Button tone="secondary" className="w-full" type="submit">
              Pay fail
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
