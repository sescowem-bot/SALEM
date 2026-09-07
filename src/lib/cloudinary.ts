import "server-only";

import { createHash } from "node:crypto";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

function getConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(getConfig());
}

function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
}

export async function uploadToCloudinary(input: {
  file: File | Blob;
  fileName: string;
  folder: string;
  resourceType?: "image" | "raw" | "auto";
}): Promise<CloudinaryUploadResult | null> {
  const config = getConfig();
  if (!config) return null;

  const resourceType = input.resourceType ?? "image";
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: input.folder, timestamp };
  const signature = signParams(params, config.apiSecret);

  const form = new FormData();
  form.append("file", new Blob([await input.file.arrayBuffer()], { type: input.file.type || "application/octet-stream" }), input.fileName);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", input.folder);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${response.status})${body ? `: ${body.slice(0, 240)}` : "."}`);
  }

  return (await response.json()) as CloudinaryUploadResult;
}

export async function destroyCloudinaryAsset(input: {
  publicId: string;
  resourceType?: "image" | "raw";
}): Promise<void> {
  const config = getConfig();
  if (!config) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = input.resourceType ?? "image";
  const params = { public_id: input.publicId, timestamp, invalidate: "true" };
  const signature = signParams(params, config.apiSecret);

  const form = new FormData();
  form.append("public_id", input.publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", config.apiKey);
  form.append("signature", signature);
  form.append("invalidate", "true");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Cloudinary delete failed (${response.status})${body ? `: ${body.slice(0, 240)}` : "."}`);
  }
}

export function encodeCloudinaryAsset(input: {
  publicId: string;
  secureUrl: string;
  resourceType?: "image" | "raw";
}): string {
  return `cloudinary|${input.resourceType ?? "image"}|${input.publicId}|${input.secureUrl}`;
}

export function decodeCloudinaryAsset(value: string): {
  publicId: string;
  secureUrl: string;
  resourceType: "image" | "raw";
} | null {
  if (!value.startsWith("cloudinary|")) return null;
  const [, resourceType, publicId, ...urlParts] = value.split("|");
  const secureUrl = urlParts.join("|");
  if (!publicId || !secureUrl || (resourceType !== "image" && resourceType !== "raw")) return null;
  return { publicId, secureUrl, resourceType };
}
