import { createCipheriv } from "node:crypto";

/**
 * AES-CBC request signing, mirrored from the Home Assistant integration
 * (custom_components/solarmax_onyx/api.py). The platform signs a sorted,
 * filtered form string with a key + IV extracted from its JS bundle.
 */
export type SignKeys = {
  key: Buffer;
  iv: Buffer;
  salt: string;
};

export const DEFAULT_KEYS: SignKeys = {
  key: Buffer.from("05469137076236813460585715952089", "utf8"),
  iv: Buffer.from("5161557162012237", "utf8"),
  salt: "05469137076236813460585715952089",
};

export type SignPayload = Record<string, unknown>;

export function computeSign(
  payload: SignPayload,
  keys: SignKeys = DEFAULT_KEYS,
): string {
  const parts: string[] = [];

  for (const key of Object.keys(payload).sort()) {
    const value = payload[key];
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      typeof value === "boolean"
    ) {
      continue;
    }
    parts.push(`${key}=${Array.isArray(value) ? "Array" : String(value)}`);
  }

  const plaintext = `${parts.join("&")}&${keys.salt}`;
  const cipher = createCipheriv("aes-256-cbc", keys.key, keys.iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}
