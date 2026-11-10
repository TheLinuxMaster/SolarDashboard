import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EncryptJWT, jwtDecrypt } from "jose";

export type Session = {
  username: string;
  password: string;
};

export class AuthConfigError extends Error {}

const SESSION_TTL_SECONDS = 12 * 60 * 60;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_NAME = IS_PRODUCTION ? "__Host-onyx_session" : "onyx_session";

function authSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 24) return secret;
  throw new AuthConfigError(
    "AUTH_SECRET is not set. Add a 32-byte secret to .env.local or the deployment environment.",
  );
}

function secretKey(): Uint8Array {
  return new Uint8Array(createHash("sha256").update(authSecret()).digest());
}

/** Reads and decrypts the session cookie. Never throws. */
export async function getSession(): Promise<Session | null> {
  let token: string | undefined;
  try {
    token = (await cookies()).get(COOKIE_NAME)?.value;
  } catch {
    return null;
  }
  if (!token) return null;

  try {
    const { payload } = await jwtDecrypt(token, secretKey(), {
      clockTolerance: 5,
    });
    const username = typeof payload.u === "string" ? payload.u : "";
    const password = typeof payload.p === "string" ? payload.p : "";
    if (!username || !password) return null;
    return { username, password };
  } catch {
    return null;
  }
}

/** Only call from a Server Action or Route Handler. */
export async function setSession(credentials: {
  username: string;
  password: string;
}): Promise<void> {
  const token = await new EncryptJWT({ u: credentials.username, p: credentials.password })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .encrypt(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high",
  });
}

/** Only call from a Server Action or Route Handler. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
