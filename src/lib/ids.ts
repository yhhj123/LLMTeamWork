import { randomBytes } from "node:crypto";

export function generateApiKey(): string {
  return "ltw_" + randomBytes(24).toString("base64url");
}

export function generateWebhookSecret(): string {
  return "whsec_" + randomBytes(24).toString("base64url");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60) || randomBytes(4).toString("hex");
}
