import bcrypt from "bcryptjs";
import { createHash, createHmac, randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const cookieName = "market_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;
const throttleWindowMs = 15 * 60 * 1000;
const throttleBlockMs = 15 * 60 * 1000;
const maxLoginAttempts = 5;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function throttleKey(email: string, ip: string) {
  return createHmac("sha256", config.sessionSecret)
    .update(`${email.toLowerCase()}|${ip}`)
    .digest("hex");
}

export function dashboardPath(role: UserRole) {
  if (role === "ADMIN") return "/admin";
  if (role === "SELLER") return "/seller";
  return "/account";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);
  await prisma.$transaction([
    prisma.authSession.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    }),
    prisma.authSession.create({
      data: { tokenHash: hashToken(token), userId, expiresAt },
    }),
  ]);
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await prisma.authSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  jar.delete(cookieName);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { seller: true } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}

export async function isLoginBlocked(email: string, ip: string) {
  const row = await prisma.authThrottle.findUnique({
    where: { key: throttleKey(email, ip) },
  });
  return Boolean(row?.blockedUntil && row.blockedUntil > new Date());
}

export async function recordLoginFailure(email: string, ip: string) {
  const key = throttleKey(email, ip);
  const now = new Date();
  const existing = await prisma.authThrottle.findUnique({ where: { key } });
  const outsideWindow =
    !existing ||
    now.getTime() - existing.windowStart.getTime() > throttleWindowMs;
  const attempts = outsideWindow ? 1 : existing.attempts + 1;
  const blockedUntil =
    attempts >= maxLoginAttempts
      ? new Date(now.getTime() + throttleBlockMs)
      : null;

  await prisma.authThrottle.upsert({
    where: { key },
    create: { key, attempts, windowStart: now, blockedUntil },
    update: {
      attempts,
      windowStart: outsideWindow ? now : existing!.windowStart,
      blockedUntil: blockedUntil ?? existing?.blockedUntil,
    },
  });
}

export async function resetLoginThrottle(email: string, ip: string) {
  await prisma.authThrottle.deleteMany({
    where: { key: throttleKey(email, ip) },
  });
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(dashboardPath(user.role));
  return user;
}

export async function requireAdmin() {
  return requireUser(["ADMIN"]);
}

export async function requireSeller() {
  return requireUser(["SELLER"]);
}
