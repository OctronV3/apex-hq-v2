import type { NextConfig } from "next";

const isTauri = process.env.TAURI_BUILD === "1";

const nextConfig: NextConfig = {
  output: isTauri ? "export" : undefined,
  distDir: isTauri ? "dist" : ".next",
  images: {
    unoptimized: isTauri,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
