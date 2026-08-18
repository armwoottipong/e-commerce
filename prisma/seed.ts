import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@market.test" },
    update: {},
    create: {
      email: "admin@market.test",
      passwordHash,
      name: "Market Admin",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@market.test" },
    update: {},
    create: {
      email: "customer@market.test",
      passwordHash,
      name: "Nira Customer",
      role: "CUSTOMER",
      phone: "0811111111",
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@market.test" },
    update: {},
    create: {
      email: "seller@market.test",
      passwordHash,
      name: "Suda Seller",
      role: "SELLER",
      phone: "0822222222",
    },
  });

  const seller = await prisma.sellerProfile.upsert({
    where: { slug: "suda-studio" },
    update: { status: "APPROVED" },
    create: {
      userId: sellerUser.id,
      shopName: "Suda Studio",
      slug: "suda-studio",
      contactEmail: "seller@market.test",
      contactPhone: "0822222222",
      address: "Bangkok, Thailand",
      bankName: "Kasikornbank",
      bankAccount: "1234567890",
      bankOwner: "Suda Studio",
      status: "APPROVED",
    },
  });

  const women = await prisma.category.upsert({
    where: { slug: "women" },
    update: {},
    create: { nameTh: "ผู้หญิง", nameEn: "Women", slug: "women" },
  });
  const shoes = await prisma.category.upsert({
    where: { slug: "shoes" },
    update: {},
    create: { nameTh: "รองเท้า", nameEn: "Shoes", slug: "shoes" },
  });
  const bags = await prisma.category.upsert({
    where: { slug: "bags" },
    update: {},
    create: { nameTh: "กระเป๋า", nameEn: "Bags", slug: "bags" },
  });

  const products = [
    {
      slug: "linen-box-shirt",
      name: "Linen Box Shirt",
      brand: "Suda Studio",
      categoryId: women.id,
      description:
        "A relaxed linen shirt for Bangkok heat, cut with a clean box silhouette.",
      image: img("photo-1529139574466-a303027c1d8b"),
      variants: [
        ["LINEN-WHT-S", "S", "White", 129000, 8],
        ["LINEN-WHT-M", "M", "White", 129000, 12],
        ["LINEN-BLK-M", "M", "Black", 129000, 6],
      ],
    },
    {
      slug: "soft-strap-sandal",
      name: "Soft Strap Sandal",
      brand: "Bangkok Form",
      categoryId: shoes.id,
      description: "Minimal sandals with soft straps and a walkable city sole.",
      image: img("photo-1543163521-1bf539c55dd2"),
      variants: [
        ["SANDAL-TAN-37", "37", "Tan", 179000, 5],
        ["SANDAL-TAN-38", "38", "Tan", 179000, 7],
        ["SANDAL-BLK-39", "39", "Black", 179000, 4],
      ],
    },
    {
      slug: "market-tote",
      name: "Market Tote",
      brand: "Everyday Archive",
      categoryId: bags.id,
      description:
        "Structured daily tote with enough room for laptop, linen layers, and city errands.",
      image: img("photo-1590874103328-eac38a683ce7"),
      variants: [
        ["TOTE-MOSS-OS", "One Size", "Moss", 219000, 10],
        ["TOTE-INK-OS", "One Size", "Ink", 219000, 6],
      ],
    },
  ];

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: { status: "APPROVED" },
      create: {
        sellerId: seller.id,
        categoryId: item.categoryId,
        name: item.name,
        slug: item.slug,
        brand: item.brand,
        description: item.description,
        status: "APPROVED",
        images: { create: { url: item.image, alt: item.name, position: 0 } },
      },
    });

    for (const [sku, size, color, priceThb, stockOnHand] of item.variants) {
      await prisma.productVariant.upsert({
        where: { sku: String(sku) },
        update: {},
        create: {
          productId: product.id,
          sku: String(sku),
          size: String(size),
          color: String(color),
          priceThb: Number(priceThb),
          stockOnHand: Number(stockOnHand),
        },
      });
    }
  }

  await prisma.adminActionLog.create({
    data: {
      actorId: admin.id,
      action: "SEED_MVP",
      entity: "System",
      entityId: "seed",
      note: "Seeded MVP data",
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
