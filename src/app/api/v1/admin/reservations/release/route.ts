import { NextRequest } from "next/server";
import { apiOk, requireApiUser, requireSameOrigin, withApi } from "@/lib/api";
import { releaseExpiredReservations } from "@/lib/order";

export async function POST(request: NextRequest) {
  return withApi(async () => {
    requireSameOrigin(request);
    await requireApiUser(["ADMIN"]);
    return apiOk({ releasedOrders: await releaseExpiredReservations() });
  });
}
