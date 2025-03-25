import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export so Next.js builds static HTML files in the /out folder
  output: "export",

  // Optional: basePath or assetPrefix if your app will be under a subpath
  // basePath: "/your-path",
  // assetPrefix: "/your-path",
};

export default nextConfig;
