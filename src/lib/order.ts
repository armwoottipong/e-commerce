import { Prisma, ProductStatus } from "@prisma/client";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function createOrderFromCart(input: {
  userId?: string;
  cartId: string;
  email?: string;
  phone?: string;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    province: string;
    district: string;
    postalCode: string;
  };
}) {
  return prisma.$transaction(
    async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { id: input.cartId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: { include: { seller: true } } },
              },
            },
          },
        },
      });
      if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

      for (const item of cart.items) {
        if (item.variant.product.status !== ProductStatus.APPROVED)
          throw new Error("Product unavailable");
        if (!item.variant.isActive) throw new Error("Variant unavailable");
        if (item.variant.stockOnHand - item.variant.reserved < item.quantity)
          throw new Error("Insufficient stock");
      }

      const sellerIds = [
        ...new Set(cart.items.map((item) => item.variant.product.sellerId)),
      ];
      const subtotalThb = cart.items.reduce(
        (sum, item) => sum + item.variant.priceThb * item.quantity,
        0,
      );
      const shippingThb = sellerIds.length * config.flatShippingFeeThb * 100;
      const totalThb = subtotalThb + shippingThb;
      const address = await tx.address.create({
        data: { ...input.address, userId: input.userId },
      });
      const order = await tx.order.create({
        data: {
          orderNumber: `MAII-${Date.now()}`,
          userId: input.userId,
          guestEmail: input.userId ? undefined : input.email,
          guestPhone: input.userId ? undefined : input.phone,
          lookupToken: crypto.randomUUID(),
          addressId: address.id,
          subtotalThb,
          shippingThb,
          totalThb,
        },
      });

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      for (const sellerId of sellerIds) {
        const sellerItems = cart.items.filter(
          (item) => item.variant.product.sellerId === sellerId,
        );
        const sellerSubtotal = sellerItems.reduce(
          (sum, item) => sum + item.variant.priceThb * item.quantity,
          0,
        );
        const commissionThb = Math.round(
          sellerSubtotal * config.commissionRate,
        );
        const sellerOrder = await tx.sellerOrder.create({
          data: {
            orderId: order.id,
            sellerId,
            subtotalThb: sellerSubtotal,
            shippingThb: config.flatShippingFeeThb * 100,
            commissionThb,
            payoutThb: sellerSubtotal - commissionThb,
          },
        });

        for (const item of sellerItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reserved: { increment: item.quantity } },
          });
          await tx.inventoryReservation.create({
            data: {
              orderId: order.id,
              variantId: item.variantId,
              quantity: item.quantity,
              expiresAt,
            },
          });
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              sellerOrderId: sellerOrder.id,
              productId: item.variant.productId,
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantLabel: `${item.variant.size} / ${item.variant.color}`,
              unitPriceThb: item.variant.priceThb,
              quantity: item.quantity,
              totalThb: item.variant.priceThb * item.quantity,
            },
          });
        }
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          sessionId: `mock_${crypto.randomUUID()}`,
          idempotencyKey: `create_${order.id}`,
          amountThb: totalThb,
          expiresAt,
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { payments: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function completeMockPayment(
  orderId: string,
  outcome: "success" | "fail",
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) throw new Error("Order not found");
    const payment = order.payments[0];
    if (!payment || payment.status !== "PENDING") return order;

    if (payment.expiresAt <= new Date()) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });
      await releaseReservations(tx, orderId);
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    }

    if (outcome === "success") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", paidAt: new Date() },
      });
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, released: false },
      });
      for (const reservation of reservations) {
        await tx.productVariant.update({
          where: { id: reservation.variantId },
          data: {
            reserved: { decrement: reservation.quantity },
            stockOnHand: { decrement: reservation.quantity },
          },
        });
      }
      await tx.inventoryReservation.updateMany({
        where: { orderId },
        data: { released: true },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });
    } else {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      await releaseReservations(tx, orderId);
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

async function releaseReservations(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderId, released: false },
  });
  for (const reservation of reservations) {
    await tx.productVariant.update({
      where: { id: reservation.variantId },
      data: { reserved: { decrement: reservation.quantity } },
    });
  }
  await tx.inventoryReservation.updateMany({
    where: { orderId },
    data: { released: true },
  });
}

export async function releaseExpiredReservations() {
  const expired = await prisma.inventoryReservation.findMany({
    where: { released: false, expiresAt: { lte: new Date() } },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  for (const { orderId } of expired) {
    await prisma.$transaction(async (tx) => {
      await releaseReservations(tx, orderId);
      await tx.payment.updateMany({
        where: { orderId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      await tx.order.updateMany({
        where: { id: orderId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
    });
  }
  return expired.length;
}
