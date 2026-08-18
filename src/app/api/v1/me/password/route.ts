import { NextRequest } from "next/server";
import { z } from "zod";
import {
  ApiError,
  apiOk,
  requireApiUser,
  requireSameOrigin,
  withApi,
} from "@/lib/api";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(8).max(72),
});

export async function PATCH(request: NextRequest) {
  return withApi(async () => {
    requireSameOrigin(request);
    const user = await requireApiUser();
    const data = schema.parse(await request.json());
    if (!(await verifyPassword(data.currentPassword, user.passwordHash)))
      throw new ApiError(
        400,
        "CURRENT_PASSWORD_INVALID",
        "Current password is incorrect",
      );
    if (await verifyPassword(data.newPassword, user.passwordHash))
      throw new ApiError(
        400,
        "PASSWORD_UNCHANGED",
        "New password must be different",
      );
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(data.newPassword) },
      }),
      prisma.authSession.deleteMany({ where: { userId: user.id } }),
    ]);
    await createSession(user.id);
    return apiOk({ changed: true, otherSessionsRevoked: true });
  });
}
