import { changePasswordAction, logoutAllSessionsAction } from "@/app/actions";
import { Button, Field, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

const errors: Record<string, string> = {
  "current-password": "Current password is incorrect",
  "same-password": "Choose a password different from the current password",
};

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireUser();
  const { error, success } = await searchParams;
  return (
    <main className="page-shell max-w-3xl">
      <PageHeader
        eyebrow="Account / Authentication"
        title="Security"
        description="เปลี่ยนรหัสผ่านและจัดการ session ที่เข้าสู่ระบบอยู่"
      />
      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_240px]">
        <form
          action={changePasswordAction}
          className="grid gap-4 border-t-2 border-ink bg-white p-5 sm:p-8"
        >
          <h2 className="font-display text-3xl">Change password</h2>
          {error && (
            <p
              role="alert"
              className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {errors[error] ?? "Password could not be changed"}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="border-l-2 border-clay bg-green-50 px-3 py-2 text-sm text-clay"
            >
              Password changed and other sessions revoked
            </p>
          )}
          <Field
            label="Current password"
            name="currentPassword"
            type="password"
            minLength={8}
            maxLength={72}
            required
          />
          <Field
            label="New password"
            name="newPassword"
            type="password"
            minLength={8}
            maxLength={72}
            required
          />
          <Field
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            minLength={8}
            maxLength={72}
            required
          />
          <Button type="submit">Change password</Button>
        </form>
        <aside className="h-fit border-t border-ink/15 py-5">
          <p className="font-medium">Other sessions</p>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            ออกจากระบบทุกอุปกรณ์ รวมถึง session ปัจจุบัน
          </p>
          <form action={logoutAllSessionsAction}>
            <Button type="submit" tone="secondary" className="mt-5 w-full">
              Logout everywhere
            </Button>
          </form>
        </aside>
      </section>
    </main>
  );
}
