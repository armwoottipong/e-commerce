import { registerCustomerAction } from "@/app/actions";
import { Button, Field, GhostLink } from "@/components/ui";
import { dashboardPath, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(dashboardPath(user.role));
  const { error } = await searchParams;
  return (
    <main className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <section>
        <p className="eyebrow">Customer account</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">
          เริ่มเก็บประวัติการสั่งซื้อไว้ในที่เดียว
        </h1>
        <p className="mt-5 max-w-md leading-7 text-ink/70">
          บัญชีลูกค้าช่วยเก็บที่อยู่และดูประวัติคำสั่งซื้อ ส่วนการช้อปและ
          checkout ยังใช้งานแบบ guest ได้
        </p>
        <GhostLink href="/login" className="mt-7">
          มีบัญชีแล้ว? Login
        </GhostLink>
      </section>
      <form
        action={registerCustomerAction}
        className="surface grid gap-4 p-5 sm:p-8"
      >
        <h2 className="font-display text-3xl">Create account</h2>
        {error === "email-exists" && (
          <p
            role="alert"
            className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ
          </p>
        )}
        <Field label="Name" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone" name="phone" />
        <Field
          label="Password"
          name="password"
          type="password"
          minLength={8}
          required
        />
        <Button type="submit">Create account</Button>
      </form>
    </main>
  );
}
