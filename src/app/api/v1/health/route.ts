import { apiOk, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApi(async () => {
    await prisma.$queryRaw`SELECT 1`;
    return apiOk({
      status: "healthy",
      database: "connected",
      paymentProvider: "mock",
      timestamp: new Date().toISOString(),
    });
  });
}
