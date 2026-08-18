import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader } from "@/components/ui";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="page-shell max-w-4xl">
      <PageHeader
        eyebrow="Account"
        title="Addresses"
        description="Saved delivery addresses from your checkout history."
      />
      <div className="mt-8">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="border-b border-ink/10 py-5 first:border-t"
          >
            <p className="font-medium">{address.fullName}</p>
            <p className="text-sm text-ink/60">
              {address.line1}, {address.district}, {address.province}{" "}
              {address.postalCode}
            </p>
          </div>
        ))}
        {addresses.length === 0 && (
          <EmptyState
            title="No saved addresses"
            detail="Saved checkout addresses will appear here."
          />
        )}
      </div>
    </main>
  );
}
