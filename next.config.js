/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 本番環境での最適化
  compress: true,
  poweredByHeader: false,

  // 画像の最適化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ビルド時の最適化
  productionBrowserSourceMaps: false,

  // 環境変数
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID || 'dev',
  },
};

module.exports = nextConfig;
