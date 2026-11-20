import { createHmac, timingSafeEqual } from "node:crypto";

export const PILOT_COOKIE = "lf_pilot";
const DEFAULT_PASSWORD = "floresta-piloto";
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.PILOT_SESSION_SECRET || "pilot-la-floresta-session-v1";
}

function password(): string {
  return process.env.PILOT_PASSWORD || DEFAULT_PASSWORD;
}

export function pilotPasswordIsDefault(): boolean {
  return !process.env.PILOT_PASSWORD;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function same(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPilotPassword(input: string): boolean {
  return same(input, password());
}

export function issuePilotToken(): string {
  const exp = Date.now() + FOURTEEN_DAYS_MS;
  const payload = `v1.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyPilotToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, exp, signature] = parts;
  if (version !== "v1" || !exp || !signature) return false;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const payload = `v1.${exp}`;
  return same(signature, sign(payload));
}

export function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
