"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { clsx } from "clsx";
import { logoutAction } from "@/app/actions";

type HeaderProps = {
  user: { name: string; role: "CUSTOMER" | "SELLER" | "ADMIN" } | null;
  cartCount: number;
};

const customerLinks = [{ href: "/products", label: "Shop" }];
const sellerLinks = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
];
const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
];

export function SiteHeader({ user, cartCount }: HeaderProps) {
  const pathname = usePathname();
  const [visibleCartCount, setVisibleCartCount] = useState(cartCount);
  const [cartBump, setCartBump] = useState(false);
  const workspace =
    user?.role === "ADMIN"
      ? "Admin desk"
      : user?.role === "SELLER"
        ? "Seller studio"
        : null;
  const links =
    user?.role === "ADMIN"
      ? adminLinks
      : user?.role === "SELLER"
        ? sellerLinks
        : customerLinks;
  const workspaceHome =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "SELLER"
        ? "/seller"
        : "/account";
  const isActive = (href: string) =>
    href === "/admin" || href === "/seller"
      ? pathname === href
      : pathname.startsWith(href);

  useEffect(() => {
    setVisibleCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const onCartAdded = (event: Event) => {
      const detail = (event as CustomEvent<{ quantity?: number }>).detail;
      setVisibleCartCount((count) => count + (detail?.quantity ?? 1));
      setCartBump(true);
      window.setTimeout(() => setCartBump(false), 520);
    };

    window.addEventListener("maii:cart-added", onCartAdded);
    return () => window.removeEventListener("maii:cart-added", onCartAdded);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-baseline gap-2 pr-5 font-display text-[26px] leading-none"
          aria-label="MAII home"
        >
          MAII{" "}
          <span className="hidden font-sans text-[10px] uppercase text-ink/60 sm:inline">
            Bangkok
          </span>
        </Link>
        {workspace && (
          <span className="hidden border-l border-ink/15 pl-5 font-mono text-[10px] uppercase text-clay lg:block">
            {workspace}
          </span>
        )}

        <nav
          className="ml-8 hidden h-full items-center gap-4 lg:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "relative flex h-full items-center text-sm text-ink/70 hover:text-ink",
                isActive(link.href) &&
                  "font-medium text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-clay",
              )}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "CUSTOMER" && (
            <Link
              href="/account/orders"
              className="text-sm text-ink/70 hover:text-ink"
            >
              Orders
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white"
            aria-label={`Cart with ${visibleCartCount} items`}
          >
            <ShoppingBag
              className={clsx("h-[18px] w-[18px]", cartBump && "cart-bump")}
            />
            {visibleCartCount > 0 && (
              <span
                className={clsx(
                  "absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1 font-mono text-[9px] text-white",
                  cartBump && "cart-bump",
                )}
              >
                {visibleCartCount}
              </span>
            )}
          </Link>
          {user ? (
            <details className="group relative">
              <summary
                className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-ink/20 bg-white px-3 text-sm hover:border-ink/40"
                aria-label="Account menu"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden max-w-28 truncate sm:inline">
                  {user.name}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 transition group-open:rotate-180 sm:block" />
              </summary>
              <div className="absolute right-0 top-12 z-50 grid min-w-56 border border-ink/10 bg-white p-2 shadow-lift">
                <div className="border-b border-ink/10 px-3 py-2">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="font-mono text-[10px] uppercase text-ink/55">
                    {user.role}
                  </p>
                </div>
                <Link
                  href="/account"
                  className="px-3 py-2.5 text-sm hover:bg-paper"
                >
                  Account overview
                </Link>
                <Link
                  href="/account/profile"
                  className="px-3 py-2.5 text-sm hover:bg-paper"
                >
                  Profile
                </Link>
                <Link
                  href="/account/security"
                  className="px-3 py-2.5 text-sm hover:bg-paper"
                >
                  Security
                </Link>
                {user.role !== "CUSTOMER" && (
                  <Link
                    href={workspaceHome}
                    className="px-3 py-2.5 text-sm hover:bg-paper"
                  >
                    Workspace overview
                  </Link>
                )}
                {user.role === "CUSTOMER" && (
                  <>
                    <Link
                      href="/account/orders"
                      className="px-3 py-2.5 text-sm hover:bg-paper"
                    >
                      Order history
                    </Link>
                    <Link
                      href="/account/addresses"
                      className="px-3 py-2.5 text-sm hover:bg-paper"
                    >
                      Addresses
                    </Link>
                  </>
                )}
                {user.role === "SELLER" && (
                  <>
                    <Link
                      href="/seller/products"
                      className="px-3 py-2.5 text-sm hover:bg-paper"
                    >
                      Manage products
                    </Link>
                    <Link
                      href="/seller/orders"
                      className="px-3 py-2.5 text-sm hover:bg-paper"
                    >
                      Fulfillment
                    </Link>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <>
                    <Link
                      href="/admin/sellers"
                      className="px-3 py-2.5 text-sm hover:bg-paper"
                    >
                      Seller review
                    </Link>
                    <Link
                      href="/admin/products"
                      className="px-3 py-2.5 text-sm hover:bg-paper"
                    >
                      Product review
                    </Link>
                  </>
                )}
                <form
                  action={logoutAction}
                  className="border-t border-ink/10 pt-1"
                >
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink/75 hover:bg-paper hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/20 bg-white px-3 text-sm hover:border-ink/40"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
          <details className="relative lg:hidden">
            <summary
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full hover:bg-white"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <nav className="absolute right-0 top-12 grid min-w-52 border border-ink/10 bg-white p-2 shadow-lift">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "px-3 py-2.5 text-sm hover:bg-paper",
                    isActive(link.href) && "bg-paper text-clay",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/seller/register"
                  className="border-t border-ink/10 px-3 py-2.5 text-sm hover:bg-paper"
                >
                  Sell on MAII
                </Link>
              )}
              {user && (
                <form action={logoutAction} className="border-t border-ink/10">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </form>
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
