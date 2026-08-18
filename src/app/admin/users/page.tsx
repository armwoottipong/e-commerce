import { EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <main className="page-shell max-w-6xl">
      <PageHeader
        eyebrow="Admin / Access"
        title="Users"
        description="Latest marketplace accounts and assigned roles."
      />
      <div className="mt-8">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between border-b border-ink/10 py-5 first:border-t"
          >
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-ink/60">{user.email}</p>
            </div>
            <StatusPill>{user.role}</StatusPill>
          </div>
        ))}
      </div>
      {users.length === 0 && <EmptyState title="No users found" />}
    </main>
  );
}
