import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed serverExternalPackages to fix Netlify CLI symlink EPERM error
};

export default nextConfig;
