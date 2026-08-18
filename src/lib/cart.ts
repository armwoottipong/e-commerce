import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const guestCookie = "market_guest";

async function getGuestId({ create }: { create: boolean }) {
  const jar = await cookies();
  const existing = jar.get(guestCookie)?.value;
  if (existing) return existing;
  if (!create) return null;
  const value = crypto.randomUUID();
  jar.set(guestCookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return value;
}

export async function getOrCreateCart(userId?: string | null) {
  if (userId) {
    const existing = await prisma.cart.findFirst({ where: { userId } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId } });
  }
  const guestId = await getGuestId({ create: true });
  const existing = await prisma.cart.findFirst({ where: { guestId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { guestId } });
}

export async function getCart(userId?: string | null) {
  const guestId = userId ? null : await getGuestId({ create: false });
  const cart = userId
    ? await prisma.cart.findFirst({ where: { userId } })
    : await prisma.cart.findFirst({
        where: { guestId: guestId ?? "__none__" },
      });

  if (!cart) return null;

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  seller: true,
                  images: { orderBy: { position: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCartCount(userId?: string | null) {
  const cart = await getCart(userId);
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(guestCookie)?.value;
  if (!guestId) return;
  await prisma.$transaction(async (tx) => {
    const [guestCart, userCart] = await Promise.all([
      tx.cart.findFirst({ where: { guestId }, include: { items: true } }),
      tx.cart.findFirst({ where: { userId }, include: { items: true } }),
    ]);

    if (!guestCart) return;

    if (!userCart) {
      await tx.cart.update({
        where: { id: guestCart.id },
        data: { userId, guestId: null },
      });
      return;
    }

    for (const item of guestCart.items) {
      const existing = userCart.items.find(
        (candidate) => candidate.variantId === item.variantId,
      );
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + item.quantity, 20) },
        });
      } else {
        await tx.cartItem.update({
          where: { id: item.id },
          data: { cartId: userCart.id },
        });
      }
    }
    await tx.cart.delete({ where: { id: guestCart.id } });
  });
  jar.delete(guestCookie);
}

export async function getOwnedCartItem(itemId: string, userId?: string | null) {
  const cart = await getCart(userId);
  if (!cart) return null;
  return cart.items.find((item) => item.id === itemId) ?? null;
}
