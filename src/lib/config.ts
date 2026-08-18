const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
if (process.env.NODE_ENV === "production" && sessionSecret.length < 32)
  throw new Error(
    "SESSION_SECRET must be at least 32 characters in production",
  );

export const config = {
  commissionRate: Number(process.env.COMMISSION_RATE ?? "0.10"),
  flatShippingFeeThb: Number(process.env.FLAT_SHIPPING_FEE_THB ?? "50"),
  sessionSecret,
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
};
