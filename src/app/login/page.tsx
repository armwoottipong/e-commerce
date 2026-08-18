import Link from "next/link";
import { loginAction } from "@/app/actions";
import { Button, Field, GhostLink, LinkButton } from "@/components/ui";
import { dashboardPath, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const errorMessages: Record<string, string> = {
  invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "rate-limit": "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที",
  unauthorized: "กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(dashboardPath(user.role));
  const { error } = await searchParams;
  return (
    <main className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex flex-col justify-between border-b border-ink/10 bg-ink px-4 py-10 text-white sm:px-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
        <p className="font-display text-2xl">MAII account</p>
        <div className="py-16">
          <p className="font-mono text-[11px] uppercase text-white/70">
            Welcome back
          </p>
          <h1 className="mt-4 max-w-lg font-display text-5xl leading-[.95] md:text-7xl">
            คุณมีบัญชีอยู่แล้วไหม?
          </h1>
          <p className="mt-6 max-w-md leading-7 text-white/78">
            เข้าสู่ระบบเดียวสำหรับลูกค้า ผู้ขาย และผู้ดูแลระบบ
            เมนูจะปรับตามสิทธิ์ของบัญชีโดยอัตโนมัติ
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase text-white/50">
          Thai fashion marketplace / 2026
        </p>
      </section>

      <section className="grid content-center gap-5 px-4 py-12 sm:px-10 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow">Sign in</p>
          <h2 className="mt-2 font-display text-4xl">มีบัญชีแล้ว</h2>
          <p className="mt-2 text-sm text-ink/70">
            กรอกอีเมลและรหัสผ่านเพื่อดำเนินการต่อ
          </p>
          {error && (
            <p
              role="alert"
              className="mt-4 border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {errorMessages[error] ?? "ไม่สามารถเข้าสู่ระบบได้"}
            </p>
          )}
          <form action={loginAction} className="mt-6 grid gap-4">
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue="customer@market.test"
              required
            />
            <Field
              label="Password"
              name="password"
              type="password"
              defaultValue="password123"
              required
            />
            <Button type="submit">Login</Button>
          </form>
          <div className="mt-5 grid gap-1 border-t border-ink/10 pt-4 text-xs text-ink/65">
            <p>Admin demo: admin@market.test</p>
            <p>Seller demo: seller@market.test</p>
            <p>Password: password123</p>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-md gap-4 border-t border-ink/10 pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="font-display text-2xl">ยังไม่มีบัญชี?</h2>
            <p className="mt-2 text-sm text-ink/60">
              สร้างบัญชีลูกค้าเพื่อเก็บ address และดู order history.
            </p>
          </div>
          <div className="grid gap-2 sm:justify-end">
            <LinkButton href="/register" className="w-full sm:w-auto">
              Create account
            </LinkButton>
            <GhostLink href="/seller/register" className="w-full sm:w-auto">
              Seller application
            </GhostLink>
          </div>
        </div>

        <p className="mx-auto w-full max-w-md text-sm text-ink/70">
          <Link href="/products" className="underline">
            Continue shopping
          </Link>
        </p>
      </section>
    </main>
  );
}
