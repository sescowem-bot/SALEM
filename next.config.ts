import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Next.js defaults Server Action request bodies to 1MB, which silently
      // rejects (413, before our own file-size/type validation in
      // reports/[id]/actions.ts ever runs) any real scanned lab report PDF —
      // this was the actual cause of "PDF upload is not working". Matches
      // the 15MB ceiling already enforced in uploadPdfAction, plus headroom
      // for multipart/form-data overhead.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
