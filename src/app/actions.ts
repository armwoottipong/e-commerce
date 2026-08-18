"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProductStatus, SellerStatus } from "@prisma/client";
import { z } from "zod";
import {
  clearSession,
  createSession,
  dashboardPath,
  getCurrentUser,
  hashPassword,
  isLoginBlocked,
  recordLoginFailure,
  requireAdmin,
  requireSeller,
  requireUser,
  resetLoginThrottle,
  verifyPassword,
} from "@/lib/auth";
import { getOrCreateCart, getOwnedCartItem, mergeGuestCart } from "@/lib/cart";
import { createOrderFromCart, completeMockPayment } from "@/lib/order";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const emailPassword = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8).max(72),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const checkoutSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(8),
  fullName: z.string().min(2),
  line1: z.string().min(4),
  province: z.string().min(2),
  district: z.string().min(2),
  postalCode: z.string().min(4),
});

const sellerRegistrationSchema = emailPassword.extend({
  name: z.string().min(2),
  shopName: z.string().min(2),
  contactPhone: z.string().min(8),
  address: z.string().min(4),
  bankName: z.string().min(2),
  bankAccount: z.string().min(4),
  bankOwner: z.string().min(2),
});

const productSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(2),
  categoryId: z.string().min(1),
  description: z.string().min(10),
  imageUrl: z.string().url(),
  sku: z.string().min(2),
  size: z.string().min(1),
  color: z.string().min(1),
  priceThb: z.coerce.number().min(1),
  stockOnHand: z.coerce.number().int().min(0),
});

const editableProductStatuses = new Set<ProductStatus>([
  ProductStatus.DRAFT,
  ProductStatus.PENDING_REVIEW,
  ProductStatus.APPROVED,
  ProductStatus.REJECTED,
]);

const dummyPasswordHash =
  "$2b$12$nQ5IPd8eKR.wKYeATS7ZXOZi9vyrlbRIyqF/LpWkD/kuZFim9XmAm";

// Auth

export async function loginAction(formData: FormData) {
  const data = emailPassword.parse(Object.fromEntries(formData));
  const email = data.email.trim().toLowerCase();
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "local";

  if (await isLoginBlocked(email, ip)) redirect("/login?error=rate-limit");

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await verifyPassword(
    data.password,
    user?.passwordHash ?? dummyPasswordHash,
  );

  if (!user || !passwordMatches) {
    await recordLoginFailure(email, ip);
    redirect("/login?error=invalid");
  }

  await resetLoginThrottle(email, ip);
  await mergeGuestCart(user.id);
  await createSession(user.id);
  redirect(dashboardPath(user.role));
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

// Account

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const data = profileSchema.parse(Object.fromEntries(formData));

  await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name, phone: data.phone || null },
  });
  revalidatePath("/account");
  revalidatePath("/account/profile");
  redirect("/account/profile?success=1");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const data = passwordSchema.parse(Object.fromEntries(formData));

  if (!(await verifyPassword(data.currentPassword, user.passwordHash)))
    redirect("/account/security?error=current-password");
  if (await verifyPassword(data.newPassword, user.passwordHash))
    redirect("/account/security?error=same-password");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.newPassword) },
    }),
    prisma.authSession.deleteMany({ where: { userId: user.id } }),
  ]);
  await createSession(user.id);
  redirect("/account/security?success=1");
}

export async function logoutAllSessionsAction() {
  const user = await requireUser();
  await prisma.authSession.deleteMany({ where: { userId: user.id } });
  await clearSession();
  redirect("/login?status=sessions-revoked");
}

export async function registerCustomerAction(formData: FormData) {
  const schema = emailPassword.extend({
    name: z.string().min(2),
    phone: z.string().optional(),
  });
  const data = schema.parse(Object.fromEntries(formData));
  const email = data.email.trim().toLowerCase();

  if (await prisma.user.findUnique({ where: { email } }))
    redirect("/register?error=email-exists");

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name.trim(),
      phone: data.phone,
      role: "CUSTOMER",
      passwordHash: await hashPassword(data.password),
    },
  });

  await mergeGuestCart(user.id);
  await createSession(user.id);
  redirect("/account");
}

// Seller onboarding

export async function registerSellerAction(formData: FormData) {
  const data = sellerRegistrationSchema.parse(Object.fromEntries(formData));
  const email = data.email.trim().toLowerCase();

  if (await prisma.user.findUnique({ where: { email } }))
    redirect("/seller/register?error=email-exists");

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      phone: data.contactPhone,
      role: "SELLER",
      passwordHash: await hashPassword(data.password),
      seller: {
        create: {
          shopName: data.shopName,
          slug: `${slugify(data.shopName)}-${Date.now()}`,
          contactEmail: email,
          contactPhone: data.contactPhone,
          address: data.address,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          bankOwner: data.bankOwner,
        },
      },
    },
  });
  await createSession(user.id);
  redirect("/seller");
}

// Cart

export async function addToCartAction(formData: FormData) {
  const user = await getCurrentUser();
  const variantId = z.string().min(1).parse(formData.get("variantId"));
  const quantity = z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .parse(formData.get("quantity") ?? 1);
  const cart = await getOrCreateCart(user?.id);
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (
    !variant ||
    variant.product.status !== ProductStatus.APPROVED ||
    variant.stockOnHand - variant.reserved < quantity
  ) {
    redirect("/cart?error=stock");
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  if (
    nextQuantity > 20 ||
    nextQuantity > variant.stockOnHand - variant.reserved
  )
    redirect("/cart?error=stock");

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: nextQuantity },
    create: { cartId: cart.id, variantId, quantity },
  });
  revalidatePath("/cart");
  redirect("/cart");
}

export async function addProductCardToCartAction(variantId: string) {
  const user = await getCurrentUser();
  const id = z.string().min(1).parse(variantId);
  const cart = await getOrCreateCart(user?.id);
  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: { product: true },
  });

  if (
    !variant ||
    !variant.isActive ||
    variant.product.status !== ProductStatus.APPROVED
  ) {
    return { ok: false, error: "unavailable" };
  }

  const available = variant.stockOnHand - variant.reserved;
  if (available < 1) return { ok: false, error: "stock" };

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: id } },
  });
  const nextQuantity = (existing?.quantity ?? 0) + 1;

  if (nextQuantity > 20 || nextQuantity > available) {
    return { ok: false, error: "stock" };
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: id } },
    update: { quantity: nextQuantity },
    create: { cartId: cart.id, variantId: id, quantity: 1 },
  });
  revalidatePath("/cart");

  return { ok: true, quantity: 1 };
}

export async function updateCartItemAction(formData: FormData) {
  const itemId = z.string().min(1).parse(formData.get("itemId"));
  const quantity = z.coerce
    .number()
    .int()
    .min(0)
    .max(20)
    .parse(formData.get("quantity"));
  const user = await getCurrentUser();
  const ownedItem = await getOwnedCartItem(itemId, user?.id);

  if (!ownedItem) redirect("/cart?error=forbidden");
  if (quantity > ownedItem.variant.stockOnHand - ownedItem.variant.reserved)
    redirect("/cart?error=stock");

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  revalidatePath("/cart");
}

// Checkout

export async function checkoutAction(formData: FormData) {
  const user = await getCurrentUser();
  const cart = await getOrCreateCart(user?.id);
  const data = checkoutSchema.parse(Object.fromEntries(formData));
  const order = await createOrderFromCart({
    userId: user?.id,
    cartId: cart.id,
    email: data.email || user?.email,
    phone: data.phone,
    address: {
      fullName: data.fullName,
      phone: data.phone,
      line1: data.line1,
      province: data.province,
      district: data.district,
      postalCode: data.postalCode,
    },
  });
  redirect(`/checkout/mock-payment/${order.id}?token=${order.lookupToken}`);
}

export async function mockPaymentAction(formData: FormData) {
  const orderId = z.string().min(1).parse(formData.get("orderId"));
  const outcome = z.enum(["success", "fail"]).parse(formData.get("outcome"));
  const token = z.string().min(1).parse(formData.get("token"));
  const user = await getCurrentUser();
  const target = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, lookupToken: true },
  });

  if (
    !target ||
    (target.userId
      ? target.userId !== user?.id && user?.role !== "ADMIN"
      : target.lookupToken !== token)
  )
    redirect("/login?error=unauthorized");

  const order = await completeMockPayment(orderId, outcome);
  redirect(`/order/${order.lookupToken}`);
}

// Admin

export async function createCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  const data = z
    .object({ nameTh: z.string().min(2), nameEn: z.string().min(2) })
    .parse(Object.fromEntries(formData));
  const category = await prisma.category.create({
    data: { ...data, slug: `${slugify(data.nameEn)}-${Date.now()}` },
  });
  await prisma.adminActionLog.create({
    data: {
      actorId: admin.id,
      action: "CREATE_CATEGORY",
      entity: "Category",
      entityId: category.id,
    },
  });
  revalidatePath("/admin/categories");
}

export async function reviewSellerAction(formData: FormData) {
  const admin = await requireAdmin();
  const sellerId = z.string().min(1).parse(formData.get("sellerId"));
  const status = z.nativeEnum(SellerStatus).parse(formData.get("status"));

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { status },
  });
  await prisma.adminActionLog.create({
    data: {
      actorId: admin.id,
      action: `SELLER_${status}`,
      entity: "SellerProfile",
      entityId: sellerId,
    },
  });
  revalidatePath("/admin/sellers");
}

// Seller

export async function createProductAction(formData: FormData) {
  const user = await requireSeller();
  if (user.seller?.status !== "APPROVED") redirect("/seller");

  const data = productSchema.parse(Object.fromEntries(formData));
  await prisma.product.create({
    data: {
      sellerId: user.seller.id,
      categoryId: data.categoryId,
      name: data.name,
      brand: data.brand,
      slug: `${slugify(data.name)}-${Date.now()}`,
      description: data.description,
      status: "PENDING_REVIEW",
      images: { create: { url: data.imageUrl, alt: data.name } },
      variants: {
        create: {
          sku: data.sku,
          size: data.size,
          color: data.color,
          priceThb: Math.round(data.priceThb * 100),
          stockOnHand: data.stockOnHand,
        },
      },
    },
  });
  revalidatePath("/seller/products");
}

export async function updateProductAction(formData: FormData) {
  const user = await requireSeller();
  if (user.seller?.status !== "APPROVED") redirect("/seller");

  const productId = z.string().min(1).parse(formData.get("productId"));
  const data = productSchema.parse(Object.fromEntries(formData));
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: user.seller.id },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  if (!product) redirect("/seller/products?error=not-found");
  if (!editableProductStatuses.has(product.status))
    redirect("/seller/products?error=not-editable");

  const variant = product.variants[0];
  const skuOwner = await prisma.productVariant.findUnique({
    where: { sku: data.sku },
    select: { id: true },
  });

  if (skuOwner && skuOwner.id !== variant?.id)
    redirect("/seller/products?error=sku-exists");

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        brand: data.brand,
        description: data.description,
        status: ProductStatus.PENDING_REVIEW,
        rejectReason: null,
      },
    });

    if (product.images[0]) {
      await tx.productImage.update({
        where: { id: product.images[0].id },
        data: { url: data.imageUrl, alt: data.name },
      });
    } else {
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: data.imageUrl,
          alt: data.name,
          position: 0,
        },
      });
    }

    const variantData = {
      sku: data.sku,
      size: data.size,
      color: data.color,
      priceThb: Math.round(data.priceThb * 100),
      stockOnHand: data.stockOnHand,
    };

    if (variant) {
      await tx.productVariant.update({
        where: { id: variant.id },
        data: variantData,
      });
    } else {
      await tx.productVariant.create({
        data: { productId: product.id, ...variantData },
      });
    }
  });

  revalidatePath("/seller/products");
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

// Admin review

export async function reviewProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const productId = z.string().min(1).parse(formData.get("productId"));
  const status = z.nativeEnum(ProductStatus).parse(formData.get("status"));
  const note = z
    .string()
    .trim()
    .max(500)
    .optional()
    .parse(formData.get("note") ?? undefined);

  await prisma.product.update({
    where: { id: productId },
    data: {
      status,
      rejectReason:
        status === ProductStatus.REJECTED
          ? note || "Please update the product details and submit again."
          : null,
    },
  });
  await prisma.adminActionLog.create({
    data: {
      actorId: admin.id,
      action: `PRODUCT_${status}`,
      entity: "Product",
      entityId: productId,
      note,
    },
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

// Fulfillment

export async function updateSellerOrderAction(formData: FormData) {
  const user = await requireSeller();
  if (user.seller?.status !== "APPROVED") redirect("/seller");
  const sellerOrderId = z.string().min(1).parse(formData.get("sellerOrderId"));
  const status = z
    .enum(["PROCESSING", "SHIPPED", "DELIVERED"])
    .parse(formData.get("status"));
  const trackingNo = z
    .string()
    .optional()
    .parse(formData.get("trackingNo") ?? "");

  if ((status === "SHIPPED" || status === "DELIVERED") && !trackingNo)
    redirect("/seller/orders?error=tracking-required");

  await prisma.sellerOrder.update({
    where: { id: sellerOrderId, sellerId: user.seller?.id },
    data: { status, trackingNo: trackingNo || undefined },
  });

  if (status === "DELIVERED") {
    const sellerOrder = await prisma.sellerOrder.findUniqueOrThrow({
      where: { id: sellerOrderId, sellerId: user.seller.id },
    });
    await prisma.payout.upsert({
      where: { sellerOrderId },
      update: {},
      create: {
        sellerId: user.seller.id,
        sellerOrderId,
        amountThb: sellerOrder.payoutThb,
      },
    });
  }
  revalidatePath("/seller/orders");
}

// Payouts

export async function markPayoutPaidAction(formData: FormData) {
  const admin = await requireAdmin();
  const payoutId = z.string().min(1).parse(formData.get("payoutId"));

  await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "PAID", paidAt: new Date() },
  });
  await prisma.adminActionLog.create({
    data: {
      actorId: admin.id,
      action: "PAYOUT_PAID",
      entity: "Payout",
      entityId: payoutId,
    },
  });
  revalidatePath("/admin/payouts");
}
