import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
