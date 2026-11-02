import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "tau_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET не задан или короче 32 символов");
  }
  return new TextEncoder().encode(value);
}

export function signSession(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

/** Возвращает id пользователя. Подпись проверяют и панель, и сервис файлов. */
export async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
