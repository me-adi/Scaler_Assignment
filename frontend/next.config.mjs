/** @type {import('next').NextConfig} */
const nextConfig = {
  // The dev-only route indicator badge (bottom-left by default) was
  // overlapping modal buttons like BookingConfirmModal's "Confirm and
  // book" on some pages/viewports. Dev-only — doesn't affect production.
  devIndicators: false,
  images: {
    // Placeholder image hosts used by the seed data.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
