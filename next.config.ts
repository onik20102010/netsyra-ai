import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: false as any,   // disables Turbopack, prevents OOM crashes
};

export default nextConfig;