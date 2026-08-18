import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "MAII Market",
  description: "Thai fashion marketplace MVP",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const cartCount = await getCartCount(user?.id);
  return (
    <html lang="th">
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <SiteHeader
          user={user ? { name: user.name, role: user.role } : null}
          cartCount={cartCount}
        />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="mt-auto border-t border-ink/10 bg-ink text-paper">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-display text-3xl">MAII</p>
              <p className="mt-2 max-w-md text-sm text-white/70">
                Independent fashion from approved Thai sellers.
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-white/80">
              <Link href="/products" className="hover:text-white">
                Shop
              </Link>
              <Link href="/seller/register" className="hover:text-white">
                Sell on MAII
              </Link>
              <Link href="/login" className="hover:text-white">
                Account
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
