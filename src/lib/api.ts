import { NextRequest, NextResponse } from "next/server";
import { Prisma, type UserRole } from "@prisma/client";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(error: ApiError) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: error.status },
  );
}

export async function withApi(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) return apiError(error);
    if (error instanceof ZodError)
      return apiError(
        new ApiError(
          400,
          "VALIDATION_ERROR",
          "Request validation failed",
          error.flatten(),
        ),
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      return apiError(new ApiError(404, "NOT_FOUND", "Resource not found"));
    console.error("API_ERROR", error);
    return apiError(
      new ApiError(500, "INTERNAL_ERROR", "Unexpected server error"),
    );
  }
}

export async function requireApiUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user)
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  if (roles && !roles.includes(user.role))
    throw new ApiError(403, "FORBIDDEN", "Insufficient permission");
  return user;
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(config.appUrl).origin)
    throw new ApiError(
      403,
      "INVALID_ORIGIN",
      "Mutation must come from the configured application origin",
    );
}
