import { apiOk } from "@/lib/api";

export async function GET() {
  return apiOk({
    version: "v1",
    endpoints: [
      "GET /api/v1/health",
      "GET /api/v1/products",
      "GET /api/v1/products/:slug",
      "GET /api/v1/categories",
      "GET /api/v1/me",
      "PATCH /api/v1/me",
      "PATCH /api/v1/me/password",
      "GET /api/v1/orders",
      "GET /api/v1/seller/products",
      "GET /api/v1/seller/orders",
      "PATCH /api/v1/seller/orders/:id",
      "GET /api/v1/seller/payouts",
      "POST /api/v1/seller/products",
      "GET /api/v1/admin/summary",
      "PATCH /api/v1/admin/sellers/:id",
      "PATCH /api/v1/admin/products/:id",
      "POST /api/v1/admin/categories",
      "GET|PATCH /api/v1/admin/payouts/:id",
      "POST /api/v1/admin/reservations/release",
      "POST /api/v1/payments/mock",
    ],
    payoutMode: "manual-tracking-only",
  });
}
