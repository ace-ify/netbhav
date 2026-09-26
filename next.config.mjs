/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Landing-page placeholder photography is served from Unsplash's CDN via
    // next/image. Swap for real farm/mandi assets before demo (see design.md §6).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
