import { updateProfileAction } from "@/app/actions";
import { Button, Field, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireUser();
  const { success } = await searchParams;
  return (
    <main className="page-shell max-w-3xl">
      <PageHeader
        eyebrow="Account / Personal details"
        title="Profile"
        description="ข้อมูลนี้ใช้กับ account และช่วยเติม checkout ให้เร็วขึ้น"
      />
      <form
        action={updateProfileAction}
        className="mt-8 grid gap-4 border-t-2 border-ink bg-white p-5 sm:p-8"
      >
        {success && (
          <p
            role="status"
            className="border-l-2 border-clay bg-green-50 px-3 py-2 text-sm text-clay"
          >
            Profile updated
          </p>
        )}
        <Field label="Name" name="name" defaultValue={user.name} required />
        <Field label="Email" name="email" value={user.email} disabled />
        <Field label="Phone" name="phone" defaultValue={user.phone ?? ""} />
        <Button type="submit">Save changes</Button>
      </form>
    </main>
  );
}
